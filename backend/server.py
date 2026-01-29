from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Wellness Video Platform API")

# Create a router with /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class VideoCreate(BaseModel):
    title: str
    description: str
    thumbnail_url: str
    video_url: str
    price: float
    duration: str
    category: str

class VideoResponse(BaseModel):
    video_id: str
    title: str
    description: str
    thumbnail_url: str
    video_url: Optional[str] = None
    price: float
    duration: str
    category: str
    created_at: datetime
    is_purchased: bool = False

class BlogPostCreate(BaseModel):
    title: str
    content: str
    excerpt: str
    cover_image: str
    category: str

class BlogPostResponse(BaseModel):
    post_id: str
    title: str
    content: str
    excerpt: str
    cover_image: str
    category: str
    author_id: str
    author_name: str
    created_at: datetime
    comments_count: int = 0

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    user_id: str
    user_name: str
    content: str
    created_at: datetime

class CheckoutRequest(BaseModel):
    video_id: str
    origin_url: str

class CheckoutResponse(BaseModel):
    url: str
    session_id: str

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request, credentials=Depends(security)) -> Optional[dict]:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Check Authorization header
    if credentials:
        token = credentials.credentials
        try:
            payload = decode_jwt_token(token)
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except:
            pass
    
    return None

async def require_auth(request: Request, credentials=Depends(security)) -> dict:
    user = await get_current_user(request, credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    return {"token": token, "user": {"user_id": user_id, "email": user_data.email, "name": user_data.name}}

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"])
    return {"token": token, "user": {"user_id": user["user_id"], "email": user["email"], "name": user["name"]}}

@api_router.post("/auth/session")
async def create_session_from_google(request: Request, response: Response):
    """Exchange Google OAuth session_id for app session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        google_data = resp.json()
    
    # Find or create user
    user = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": google_data["email"],
            "name": google_data["name"],
            "picture": google_data.get("picture"),
            "password_hash": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update picture if changed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"picture": google_data.get("picture"), "name": google_data["name"]}}
        )
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {"user_id": user_id, "email": google_data["email"], "name": google_data["name"], "picture": google_data.get("picture")}

@api_router.get("/auth/me")
async def get_current_user_info(user: dict = Depends(require_auth)):
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture")}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== VIDEO ENDPOINTS ==============

@api_router.get("/videos", response_model=List[VideoResponse])
async def get_videos(request: Request, credentials=Depends(security)):
    user = await get_current_user(request, credentials)
    videos = await db.videos.find({}, {"_id": 0}).to_list(100)
    
    purchased_ids = set()
    if user:
        purchases = await db.purchases.find({"user_id": user["user_id"], "status": "completed"}, {"_id": 0}).to_list(100)
        purchased_ids = {p["video_id"] for p in purchases}
    
    result = []
    for v in videos:
        is_purchased = v["video_id"] in purchased_ids
        video_resp = VideoResponse(
            video_id=v["video_id"],
            title=v["title"],
            description=v["description"],
            thumbnail_url=v["thumbnail_url"],
            video_url=v["video_url"] if is_purchased else None,
            price=v["price"],
            duration=v["duration"],
            category=v["category"],
            created_at=datetime.fromisoformat(v["created_at"]) if isinstance(v["created_at"], str) else v["created_at"],
            is_purchased=is_purchased
        )
        result.append(video_resp)
    return result

@api_router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, request: Request, credentials=Depends(security)):
    video = await db.videos.find_one({"video_id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    user = await get_current_user(request, credentials)
    is_purchased = False
    if user:
        purchase = await db.purchases.find_one({"user_id": user["user_id"], "video_id": video_id, "status": "completed"}, {"_id": 0})
        is_purchased = purchase is not None
    
    return VideoResponse(
        video_id=video["video_id"],
        title=video["title"],
        description=video["description"],
        thumbnail_url=video["thumbnail_url"],
        video_url=video["video_url"] if is_purchased else None,
        price=video["price"],
        duration=video["duration"],
        category=video["category"],
        created_at=datetime.fromisoformat(video["created_at"]) if isinstance(video["created_at"], str) else video["created_at"],
        is_purchased=is_purchased
    )

@api_router.post("/videos", response_model=VideoResponse)
async def create_video(video_data: VideoCreate, user: dict = Depends(require_auth)):
    video_id = f"vid_{uuid.uuid4().hex[:12]}"
    video_doc = {
        "video_id": video_id,
        **video_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.videos.insert_one(video_doc)
    return VideoResponse(**{**video_doc, "created_at": datetime.now(timezone.utc)})

@api_router.get("/my-videos", response_model=List[VideoResponse])
async def get_my_purchased_videos(user: dict = Depends(require_auth)):
    purchases = await db.purchases.find({"user_id": user["user_id"], "status": "completed"}, {"_id": 0}).to_list(100)
    video_ids = [p["video_id"] for p in purchases]
    
    videos = await db.videos.find({"video_id": {"$in": video_ids}}, {"_id": 0}).to_list(100)
    result = []
    for v in videos:
        result.append(VideoResponse(
            video_id=v["video_id"],
            title=v["title"],
            description=v["description"],
            thumbnail_url=v["thumbnail_url"],
            video_url=v["video_url"],
            price=v["price"],
            duration=v["duration"],
            category=v["category"],
            created_at=datetime.fromisoformat(v["created_at"]) if isinstance(v["created_at"], str) else v["created_at"],
            is_purchased=True
        ))
    return result

# ============== PAYMENT ENDPOINTS ==============

@api_router.post("/checkout/create", response_model=CheckoutResponse)
async def create_checkout(checkout_data: CheckoutRequest, request: Request, user: dict = Depends(require_auth)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    video = await db.videos.find_one({"video_id": checkout_data.video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Check if already purchased
    existing = await db.purchases.find_one({"user_id": user["user_id"], "video_id": checkout_data.video_id, "status": "completed"}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Video already purchased")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{checkout_data.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_data.origin_url}/videos/{checkout_data.video_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(video["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "video_id": checkout_data.video_id,
            "user_id": user["user_id"],
            "video_title": video["title"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "video_id": checkout_data.video_id,
        "amount": float(video["price"]),
        "currency": "usd",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return CheckoutResponse(url=session.url, session_id=session.session_id)

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request, user: dict = Depends(require_auth)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if txn and txn["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": status.payment_status}}
        )
        
        # If paid, create purchase record
        if status.payment_status == "paid":
            existing_purchase = await db.purchases.find_one({
                "user_id": txn["user_id"],
                "video_id": txn["video_id"],
                "status": "completed"
            }, {"_id": 0})
            
            if not existing_purchase:
                await db.purchases.insert_one({
                    "purchase_id": f"pur_{uuid.uuid4().hex[:12]}",
                    "user_id": txn["user_id"],
                    "video_id": txn["video_id"],
                    "session_id": session_id,
                    "amount": txn["amount"],
                    "status": "completed",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
    
    return {"status": status.status, "payment_status": status.payment_status}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            metadata = webhook_response.metadata
            video_id = metadata.get("video_id")
            user_id = metadata.get("user_id")
            
            if video_id and user_id:
                existing = await db.purchases.find_one({
                    "user_id": user_id,
                    "video_id": video_id,
                    "status": "completed"
                }, {"_id": 0})
                
                if not existing:
                    await db.purchases.insert_one({
                        "purchase_id": f"pur_{uuid.uuid4().hex[:12]}",
                        "user_id": user_id,
                        "video_id": video_id,
                        "session_id": webhook_response.session_id,
                        "status": "completed",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ============== BLOG ENDPOINTS ==============

@api_router.get("/blog", response_model=List[BlogPostResponse])
async def get_blog_posts():
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    result = []
    for p in posts:
        comments_count = await db.comments.count_documents({"post_id": p["post_id"]})
        result.append(BlogPostResponse(
            post_id=p["post_id"],
            title=p["title"],
            content=p["content"],
            excerpt=p["excerpt"],
            cover_image=p["cover_image"],
            category=p["category"],
            author_id=p["author_id"],
            author_name=p["author_name"],
            created_at=datetime.fromisoformat(p["created_at"]) if isinstance(p["created_at"], str) else p["created_at"],
            comments_count=comments_count
        ))
    return result

@api_router.get("/blog/{post_id}", response_model=BlogPostResponse)
async def get_blog_post(post_id: str):
    post = await db.blog_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comments_count = await db.comments.count_documents({"post_id": post_id})
    return BlogPostResponse(
        **{**post, "created_at": datetime.fromisoformat(post["created_at"]) if isinstance(post["created_at"], str) else post["created_at"], "comments_count": comments_count}
    )

@api_router.post("/blog", response_model=BlogPostResponse)
async def create_blog_post(post_data: BlogPostCreate, user: dict = Depends(require_auth)):
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    post_doc = {
        "post_id": post_id,
        **post_data.model_dump(),
        "author_id": user["user_id"],
        "author_name": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.blog_posts.insert_one(post_doc)
    return BlogPostResponse(**{**post_doc, "created_at": datetime.now(timezone.utc), "comments_count": 0})

@api_router.get("/blog/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return [CommentResponse(**{**c, "created_at": datetime.fromisoformat(c["created_at"]) if isinstance(c["created_at"], str) else c["created_at"]}) for c in comments]

@api_router.post("/blog/{post_id}/comments", response_model=CommentResponse)
async def create_comment(post_id: str, comment_data: CommentCreate, user: dict = Depends(require_auth)):
    post = await db.blog_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
    comment_doc = {
        "comment_id": comment_id,
        "post_id": post_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment_doc)
    return CommentResponse(**{**comment_doc, "created_at": datetime.now(timezone.utc)})

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    """Seed initial videos and blog posts for demo"""
    # Check if already seeded
    existing = await db.videos.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    # Seed videos
    videos = [
        {
            "video_id": "vid_mindfulness01",
            "title": "Introduction to Mindfulness",
            "description": "Learn the foundations of mindfulness meditation. This comprehensive course covers breathing techniques, body awareness, and how to cultivate present-moment awareness in daily life.",
            "thumbnail_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
            "video_url": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            "price": 29.99,
            "duration": "2h 30m",
            "category": "Meditation",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "video_id": "vid_anxiety02",
            "title": "Managing Anxiety Naturally",
            "description": "Discover evidence-based techniques for managing anxiety without medication. Includes breathing exercises, cognitive reframing, and lifestyle modifications.",
            "thumbnail_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
            "video_url": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            "price": 39.99,
            "duration": "3h 15m",
            "category": "Mental Health",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "video_id": "vid_sleep03",
            "title": "Better Sleep Workshop",
            "description": "Transform your sleep quality with this comprehensive workshop. Learn sleep hygiene practices, relaxation techniques, and how to create the perfect sleep environment.",
            "thumbnail_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800",
            "video_url": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            "price": 24.99,
            "duration": "1h 45m",
            "category": "Wellness",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "video_id": "vid_confidence04",
            "title": "Building Unshakeable Confidence",
            "description": "A transformative journey to build lasting self-confidence. Covers self-talk, body language, overcoming limiting beliefs, and developing a growth mindset.",
            "thumbnail_url": "https://images.unsplash.com/photo-1552508744-1696d4464960?w=800",
            "video_url": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            "price": 49.99,
            "duration": "4h 00m",
            "category": "Personal Growth",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "video_id": "vid_stress05",
            "title": "Stress-Free Living",
            "description": "Master the art of stress management with practical tools you can use immediately. Includes guided meditations, journaling prompts, and daily rituals.",
            "thumbnail_url": "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800",
            "video_url": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            "price": 34.99,
            "duration": "2h 45m",
            "category": "Wellness",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "video_id": "vid_emotional06",
            "title": "Emotional Intelligence Mastery",
            "description": "Develop your emotional intelligence to improve relationships, communication, and self-awareness. Learn to recognize, understand, and manage emotions effectively.",
            "thumbnail_url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800",
            "video_url": "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            "price": 44.99,
            "duration": "3h 30m",
            "category": "Personal Growth",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.videos.insert_many(videos)
    
    # Seed blog posts
    blog_posts = [
        {
            "post_id": "post_morning01",
            "title": "5 Morning Rituals That Changed My Life",
            "content": """Starting your day with intention can transform your entire life. Here are five morning rituals that have profoundly impacted my well-being:

## 1. Wake Up Without an Alarm
Training your body to wake naturally helps maintain your circadian rhythm and ensures you get adequate rest.

## 2. Practice Gratitude
Before reaching for your phone, spend 5 minutes thinking about three things you're grateful for. This sets a positive tone for the day.

## 3. Move Your Body
Even 10 minutes of stretching or yoga can energize you more than coffee. Focus on movements that feel good.

## 4. Hydrate First
Drink a full glass of water before anything else. Your body has been fasting all night and needs hydration.

## 5. Set Daily Intentions
Rather than a to-do list, set 1-3 intentions for how you want to feel or show up that day.

Remember, consistency is more important than perfection. Start with one ritual and build from there.""",
            "excerpt": "Transform your mornings with these simple but powerful daily rituals that promote mental clarity and emotional well-being.",
            "cover_image": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
            "category": "Lifestyle",
            "author_id": "system",
            "author_name": "Wellness Team",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "post_id": "post_anxiety02",
            "title": "Understanding and Overcoming Anxiety",
            "content": """Anxiety affects millions of people worldwide, but understanding it is the first step to overcoming it.

## What is Anxiety?
Anxiety is your body's natural response to stress. It's a feeling of fear or apprehension about what's to come.

## Physical Symptoms
- Racing heart
- Rapid breathing
- Muscle tension
- Difficulty sleeping

## Coping Strategies

### 1. Deep Breathing
Practice the 4-7-8 technique: Breathe in for 4 seconds, hold for 7, exhale for 8.

### 2. Grounding Exercises
Use the 5-4-3-2-1 technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.

### 3. Challenge Negative Thoughts
Ask yourself: Is this thought helpful? Is it based on facts?

### 4. Regular Exercise
Physical activity releases endorphins and reduces stress hormones.

If anxiety significantly impacts your daily life, consider seeking professional help.""",
            "excerpt": "Learn evidence-based strategies to understand and manage anxiety in your daily life.",
            "cover_image": "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800",
            "category": "Mental Health",
            "author_id": "system",
            "author_name": "Wellness Team",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "post_id": "post_meditation03",
            "title": "Meditation for Beginners: Where to Start",
            "content": """Meditation doesn't have to be complicated. Here's your simple guide to getting started.

## Why Meditate?
- Reduces stress and anxiety
- Improves focus and concentration
- Enhances self-awareness
- Promotes emotional health

## Getting Started

### Find Your Space
You don't need a dedicated meditation room. Any quiet corner works. The key is consistency - use the same spot each time.

### Start Small
Begin with just 5 minutes. Seriously. You can build up from there.

### Focus on Your Breath
Simply notice your breath going in and out. When your mind wanders (it will), gently bring attention back to your breath.

## Common Myths

**Myth: You need to clear your mind completely.**
Truth: The goal isn't to stop thinking, but to observe thoughts without attachment.

**Myth: You need to sit in a specific position.**
Truth: Sit however is comfortable. Chair, cushion, or floor - all work.

**Myth: You're doing it wrong if your mind wanders.**
Truth: Noticing that your mind wandered IS the practice.

Start today. Even one minute of mindful breathing counts.""",
            "excerpt": "A beginner's guide to starting a meditation practice without overwhelm or confusion.",
            "cover_image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
            "category": "Meditation",
            "author_id": "system",
            "author_name": "Wellness Team",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.blog_posts.insert_many(blog_posts)
    
    return {"message": "Data seeded successfully", "videos": len(videos), "blog_posts": len(blog_posts)}

# Include router and add middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
