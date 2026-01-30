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
JWT_EXPIRATION_HOURS = 24 * 7

# Admin Config
ADMIN_EMAILS = ["danimoldovanova@gmail.com"]

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
    is_admin: bool = False
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

# Shop Models
class ShopItemCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int = 0

class ShopItemResponse(BaseModel):
    item_id: str
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int
    created_at: datetime

class ShippingAddress(BaseModel):
    full_name: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    postal_code: str
    country: str
    phone: str

class ShopCheckoutRequest(BaseModel):
    item_id: str
    quantity: int
    shipping_address: ShippingAddress
    origin_url: str

class OrderResponse(BaseModel):
    order_id: str
    item_id: str
    item_name: str
    quantity: int
    total_amount: float
    shipping_address: dict
    status: str
    created_at: datetime

# Page Content Models
class PageContent(BaseModel):
    page_id: str
    title: str
    subtitle: str
    content: str
    image_url: str
    features: List[dict] = []

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

def is_admin(email: str) -> bool:
    return email.lower() in [e.lower() for e in ADMIN_EMAILS]

async def get_current_user(request: Request, credentials=Depends(security)) -> Optional[dict]:
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
                    user["is_admin"] = is_admin(user.get("email", ""))
                    return user
    
    if credentials:
        token = credentials.credentials
        try:
            payload = decode_jwt_token(token)
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                user["is_admin"] = is_admin(user.get("email", ""))
                return user
        except:
            pass
    
    return None

async def require_auth(request: Request, credentials=Depends(security)) -> dict:
    user = await get_current_user(request, credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_admin(request: Request, credentials=Depends(security)) -> dict:
    user = await get_current_user(request, credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not is_admin(user.get("email", "")):
        raise HTTPException(status_code=403, detail="Admin access required")
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
    return {
        "token": token, 
        "user": {
            "user_id": user_id, 
            "email": user_data.email, 
            "name": user_data.name,
            "is_admin": is_admin(user_data.email)
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"])
    return {
        "token": token, 
        "user": {
            "user_id": user["user_id"], 
            "email": user["email"], 
            "name": user["name"],
            "is_admin": is_admin(user["email"])
        }
    }

@api_router.post("/auth/session")
async def create_session_from_google(request: Request, response: Response):
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
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"picture": google_data.get("picture"), "name": google_data["name"]}}
        )
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id, 
        "email": google_data["email"], 
        "name": google_data["name"], 
        "picture": google_data.get("picture"),
        "is_admin": is_admin(google_data["email"])
    }

@api_router.get("/auth/me")
async def get_current_user_info(user: dict = Depends(require_auth)):
    return {
        "user_id": user["user_id"], 
        "email": user["email"], 
        "name": user["name"], 
        "picture": user.get("picture"),
        "is_admin": is_admin(user.get("email", ""))
    }

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
async def create_video(video_data: VideoCreate, user: dict = Depends(require_admin)):
    video_id = f"vid_{uuid.uuid4().hex[:12]}"
    video_doc = {
        "video_id": video_id,
        **video_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.videos.insert_one(video_doc)
    return VideoResponse(**{**video_doc, "created_at": datetime.now(timezone.utc)})

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str, user: dict = Depends(require_admin)):
    result = await db.videos.delete_one({"video_id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    return {"message": "Video deleted successfully"}

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
            "type": "video",
            "video_id": checkout_data.video_id,
            "user_id": user["user_id"],
            "video_title": video["title"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "type": "video",
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
    
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if txn and txn["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": status.payment_status}}
        )
        
        if status.payment_status == "paid":
            if txn.get("type") == "video":
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
            elif txn.get("type") == "shop":
                await db.orders.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "paid", "payment_status": "paid"}}
                )
    
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
            payment_type = metadata.get("type", "video")
            
            if payment_type == "video":
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
            elif payment_type == "shop":
                order_id = metadata.get("order_id")
                if order_id:
                    await db.orders.update_one(
                        {"order_id": order_id},
                        {"$set": {"status": "paid", "payment_status": "paid"}}
                    )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ============== SHOP ENDPOINTS ==============

@api_router.get("/shop/items", response_model=List[ShopItemResponse])
async def get_shop_items():
    items = await db.shop_items.find({}, {"_id": 0}).to_list(100)
    return [ShopItemResponse(
        item_id=item["item_id"],
        name=item["name"],
        description=item["description"],
        price=item["price"],
        image_url=item["image_url"],
        category=item["category"],
        stock=item["stock"],
        created_at=datetime.fromisoformat(item["created_at"]) if isinstance(item["created_at"], str) else item["created_at"]
    ) for item in items]

@api_router.get("/shop/items/{item_id}", response_model=ShopItemResponse)
async def get_shop_item(item_id: str):
    item = await db.shop_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return ShopItemResponse(
        item_id=item["item_id"],
        name=item["name"],
        description=item["description"],
        price=item["price"],
        image_url=item["image_url"],
        category=item["category"],
        stock=item["stock"],
        created_at=datetime.fromisoformat(item["created_at"]) if isinstance(item["created_at"], str) else item["created_at"]
    )

@api_router.post("/shop/items", response_model=ShopItemResponse)
async def create_shop_item(item_data: ShopItemCreate, user: dict = Depends(require_admin)):
    item_id = f"item_{uuid.uuid4().hex[:12]}"
    item_doc = {
        "item_id": item_id,
        **item_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shop_items.insert_one(item_doc)
    return ShopItemResponse(**{**item_doc, "created_at": datetime.now(timezone.utc)})

@api_router.put("/shop/items/{item_id}", response_model=ShopItemResponse)
async def update_shop_item(item_id: str, item_data: ShopItemCreate, user: dict = Depends(require_admin)):
    result = await db.shop_items.update_one(
        {"item_id": item_id},
        {"$set": item_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    item = await db.shop_items.find_one({"item_id": item_id}, {"_id": 0})
    return ShopItemResponse(
        item_id=item["item_id"],
        name=item["name"],
        description=item["description"],
        price=item["price"],
        image_url=item["image_url"],
        category=item["category"],
        stock=item["stock"],
        created_at=datetime.fromisoformat(item["created_at"]) if isinstance(item["created_at"], str) else item["created_at"]
    )

@api_router.delete("/shop/items/{item_id}")
async def delete_shop_item(item_id: str, user: dict = Depends(require_admin)):
    result = await db.shop_items.delete_one({"item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@api_router.post("/shop/checkout", response_model=CheckoutResponse)
async def create_shop_checkout(checkout_data: ShopCheckoutRequest, request: Request, user: dict = Depends(require_auth)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    item = await db.shop_items.find_one({"item_id": checkout_data.item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item["stock"] < checkout_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")
    
    total_amount = float(item["price"]) * checkout_data.quantity
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    
    # Create order record
    order_doc = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "item_id": checkout_data.item_id,
        "item_name": item["name"],
        "quantity": checkout_data.quantity,
        "total_amount": total_amount,
        "shipping_address": checkout_data.shipping_address.model_dump(),
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{checkout_data.origin_url}/shop/order-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_data.origin_url}/shop/{checkout_data.item_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=total_amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "type": "shop",
            "order_id": order_id,
            "item_id": checkout_data.item_id,
            "user_id": user["user_id"],
            "item_name": item["name"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Update order with session_id
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"session_id": session.session_id}}
    )
    
    # Create payment transaction
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "type": "shop",
        "order_id": order_id,
        "item_id": checkout_data.item_id,
        "amount": total_amount,
        "currency": "usd",
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return CheckoutResponse(url=session.url, session_id=session.session_id)

@api_router.get("/shop/orders", response_model=List[OrderResponse])
async def get_my_orders(user: dict = Depends(require_auth)):
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [OrderResponse(
        order_id=o["order_id"],
        item_id=o["item_id"],
        item_name=o["item_name"],
        quantity=o["quantity"],
        total_amount=o["total_amount"],
        shipping_address=o["shipping_address"],
        status=o["status"],
        created_at=datetime.fromisoformat(o["created_at"]) if isinstance(o["created_at"], str) else o["created_at"]
    ) for o in orders]

@api_router.get("/admin/orders", response_model=List[OrderResponse])
async def get_all_orders(user: dict = Depends(require_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [OrderResponse(
        order_id=o["order_id"],
        item_id=o["item_id"],
        item_name=o["item_name"],
        quantity=o["quantity"],
        total_amount=o["total_amount"],
        shipping_address=o["shipping_address"],
        status=o["status"],
        created_at=datetime.fromisoformat(o["created_at"]) if isinstance(o["created_at"], str) else o["created_at"]
    ) for o in orders]

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: dict = Depends(require_admin)):
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

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
async def create_blog_post(post_data: BlogPostCreate, user: dict = Depends(require_admin)):
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

@api_router.delete("/blog/{post_id}")
async def delete_blog_post(post_id: str, user: dict = Depends(require_admin)):
    result = await db.blog_posts.delete_one({"post_id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    # Also delete associated comments
    await db.comments.delete_many({"post_id": post_id})
    return {"message": "Post deleted successfully"}

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

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user: dict = Depends(require_admin)):
    result = await db.comments.delete_one({"comment_id": comment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}

# ============== PAGE CONTENT ENDPOINTS ==============

@api_router.get("/pages", response_model=List[PageContent])
async def get_all_pages():
    pages = await db.pages.find({}, {"_id": 0}).to_list(20)
    return pages

@api_router.get("/pages/{page_id}", response_model=PageContent)
async def get_page(page_id: str):
    page = await db.pages.find_one({"page_id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.put("/pages/{page_id}", response_model=PageContent)
async def update_page(page_id: str, page_data: dict, user: dict = Depends(require_admin)):
    result = await db.pages.update_one(
        {"page_id": page_id},
        {"$set": page_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    page = await db.pages.find_one({"page_id": page_id}, {"_id": 0})
    return page

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    existing = await db.videos.count_documents({})
    if existing > 0:
        # Still seed pages and shop items if not present
        pages_exist = await db.pages.count_documents({})
        if pages_exist == 0:
            await seed_pages()
        shop_exist = await db.shop_items.count_documents({})
        if shop_exist == 0:
            await seed_shop_items()
        return {"message": "Data already seeded, added missing content"}
    
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
Before reaching for your phone, spend 5 minutes thinking about three things you're grateful for.

## 3. Move Your Body
Even 10 minutes of stretching or yoga can energize you more than coffee.

## 4. Hydrate First
Drink a full glass of water before anything else.

## 5. Set Daily Intentions
Rather than a to-do list, set 1-3 intentions for how you want to feel that day.""",
            "excerpt": "Transform your mornings with these simple but powerful daily rituals.",
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

## Coping Strategies

### 1. Deep Breathing
Practice the 4-7-8 technique: Breathe in for 4 seconds, hold for 7, exhale for 8.

### 2. Grounding Exercises
Use the 5-4-3-2-1 technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.

### 3. Challenge Negative Thoughts
Ask yourself: Is this thought helpful? Is it based on facts?""",
            "excerpt": "Learn evidence-based strategies to understand and manage anxiety.",
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
You don't need a dedicated meditation room. Any quiet corner works.

### Start Small
Begin with just 5 minutes. You can build up from there.

### Focus on Your Breath
Simply notice your breath going in and out. When your mind wanders, gently bring attention back.""",
            "excerpt": "A beginner's guide to starting a meditation practice.",
            "cover_image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
            "category": "Meditation",
            "author_id": "system",
            "author_name": "Wellness Team",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.blog_posts.insert_many(blog_posts)
    
    # Seed pages and shop items
    await seed_pages()
    await seed_shop_items()
    
    return {"message": "Data seeded successfully", "videos": len(videos), "blog_posts": len(blog_posts)}

async def seed_pages():
    pages = [
        {
            "page_id": "speech-therapist",
            "title": "Speech Therapist",
            "subtitle": "Professional Speech Therapy Services",
            "content": """As a certified speech therapist, I specialize in helping individuals of all ages overcome communication challenges. My approach combines traditional techniques with modern methods to create personalized treatment plans.

Whether you're dealing with articulation disorders, language delays, stuttering, or voice disorders, I'm here to help you find your voice and communicate with confidence.

My services include:
- Individual therapy sessions
- Group therapy programs
- Parent coaching and education
- Online consultations""",
            "image_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
            "features": [
                {"title": "Personalized Plans", "description": "Every treatment plan is tailored to your unique needs"},
                {"title": "All Ages Welcome", "description": "From toddlers to adults, I work with clients of all ages"},
                {"title": "Evidence-Based", "description": "Using proven techniques backed by research"}
            ]
        },
        {
            "page_id": "womens-circle-rose",
            "title": "Women's Circle Rose",
            "subtitle": "A Sacred Space for Women's Healing",
            "content": """Welcome to Women's Circle Rose, a nurturing community where women come together to heal, grow, and support one another.

Our circles provide a safe space for:
- Sharing experiences and wisdom
- Healing emotional wounds
- Connecting with your feminine energy
- Building lasting sisterhood bonds

Each gathering is designed to honor the sacred feminine and help you reconnect with your inner strength. Through guided meditations, sharing circles, and ritual practices, we create transformative experiences.

Join us and discover the power of women supporting women.""",
            "image_url": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
            "features": [
                {"title": "Monthly Gatherings", "description": "Regular circles aligned with moon phases"},
                {"title": "Safe Space", "description": "Confidential and judgment-free environment"},
                {"title": "Community", "description": "Build meaningful connections with like-minded women"}
            ]
        },
        {
            "page_id": "bio",
            "title": "About Me",
            "subtitle": "My Journey to Healing",
            "content": """Hello, I'm Dani, and I'm passionate about helping others find their path to wellness and personal growth.

My journey began when I discovered the transformative power of holistic healing. After years of personal struggles and searching for answers, I found my calling in helping others overcome their challenges.

I hold certifications in:
- Speech Language Pathology
- Bach Flower Therapy
- Psychology & Counseling
- Women's Circle Facilitation

My approach combines traditional therapeutic techniques with holistic practices to address the whole person - mind, body, and spirit.

I believe that everyone has the innate ability to heal and grow. My role is simply to guide you on your journey and provide the tools you need to thrive.""",
            "image_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
            "features": [
                {"title": "Holistic Approach", "description": "Treating the whole person, not just symptoms"},
                {"title": "Years of Experience", "description": "Dedicated practitioner with proven results"},
                {"title": "Continuous Learning", "description": "Always expanding knowledge to serve you better"}
            ]
        },
        {
            "page_id": "bach-flowers",
            "title": "Healing with Dr. Bach's Flowers",
            "subtitle": "Natural Remedies for Emotional Balance",
            "content": """Dr. Bach's Flower Remedies are a natural healing system that addresses emotional imbalances and promotes mental well-being.

Developed by Dr. Edward Bach in the 1930s, these 38 flower essences work gently to restore emotional equilibrium and support your natural healing process.

How Bach Flowers Work:
Each flower essence addresses specific emotional states. Whether you're experiencing fear, uncertainty, loneliness, or overwhelm, there's a remedy that can help.

Benefits include:
- Relief from stress and anxiety
- Improved emotional resilience
- Better sleep quality
- Enhanced mental clarity
- Support during life transitions

I offer personalized Bach Flower consultations to help you identify the remedies that will best support your emotional journey.""",
            "image_url": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800",
            "features": [
                {"title": "38 Remedies", "description": "A complete system for emotional healing"},
                {"title": "Safe & Natural", "description": "No side effects or contraindications"},
                {"title": "Personalized Blends", "description": "Custom formulas for your unique needs"}
            ]
        },
        {
            "page_id": "psychology",
            "title": "Psychology Services",
            "subtitle": "Professional Psychological Support",
            "content": """Mental health is just as important as physical health. I provide compassionate psychological support to help you navigate life's challenges.

Services offered:
- Individual counseling
- Anxiety and stress management
- Depression support
- Relationship guidance
- Life transitions coaching
- Personal development

My therapeutic approach is integrative, drawing from various psychological frameworks to provide the most effective support for your unique situation.

Whether you're facing a specific challenge or simply want to understand yourself better, I'm here to support your journey toward mental wellness.

All sessions are confidential and conducted in a safe, non-judgmental environment.""",
            "image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
            "features": [
                {"title": "Confidential", "description": "Your privacy is always protected"},
                {"title": "Evidence-Based", "description": "Using proven therapeutic approaches"},
                {"title": "Flexible Options", "description": "In-person and online sessions available"}
            ]
        }
    ]
    await db.pages.insert_many(pages)

async def seed_shop_items():
    items = [
        {
            "item_id": "item_journal01",
            "name": "Wellness Journal",
            "description": "A beautifully designed journal for tracking your wellness journey. Includes prompts for gratitude, mood tracking, and goal setting.",
            "price": 24.99,
            "image_url": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800",
            "category": "Journals",
            "stock": 50,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "item_id": "item_cards02",
            "name": "Affirmation Card Deck",
            "description": "52 beautifully illustrated affirmation cards to inspire and motivate your daily practice.",
            "price": 19.99,
            "image_url": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
            "category": "Cards",
            "stock": 75,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "item_id": "item_candle03",
            "name": "Meditation Candle Set",
            "description": "Set of 3 hand-poured soy candles with calming scents: Lavender, Sandalwood, and Rose.",
            "price": 34.99,
            "image_url": "https://images.unsplash.com/photo-1602607439032-c6d8e235d515?w=800",
            "category": "Aromatherapy",
            "stock": 30,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "item_id": "item_crystals04",
            "name": "Healing Crystal Set",
            "description": "A curated collection of 5 healing crystals: Amethyst, Rose Quartz, Clear Quartz, Black Tourmaline, and Citrine.",
            "price": 39.99,
            "image_url": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800",
            "category": "Crystals",
            "stock": 25,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "item_id": "item_tea05",
            "name": "Calming Herbal Tea Collection",
            "description": "Organic tea collection featuring 4 calming blends: Chamomile Dreams, Lavender Bliss, Stress Relief, and Sleep Well.",
            "price": 28.99,
            "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800",
            "category": "Wellness",
            "stock": 40,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.shop_items.insert_many(items)

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
