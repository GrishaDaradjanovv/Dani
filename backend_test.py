import requests
import sys
import json
from datetime import datetime

class WellnessPlatformTester:
    def __init__(self, base_url="https://selfimprovehub-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.admin_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_email = "danimoldovanova@gmail.com"

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Choose which token to use
        token_to_use = None
        if use_admin_token and self.admin_token:
            token_to_use = self.admin_token
        elif self.token:
            token_to_use = self.token
            
        if token_to_use:
            test_headers['Authorization'] = f'Bearer {token_to_use}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Seed initial data"""
        print("\n📊 Seeding initial data...")
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200
        )
        return success

    def test_public_endpoints(self):
        """Test public endpoints that don't require auth"""
        print("\n🌐 Testing public endpoints...")
        
        # Test get videos (public)
        success, videos = self.run_test(
            "Get Videos (Public)",
            "GET",
            "videos",
            200
        )
        
        if success and isinstance(videos, list):
            print(f"   Found {len(videos)} videos")
            if len(videos) >= 6:
                self.log_test("Video Count Check", True, f"Found {len(videos)} videos")
            else:
                self.log_test("Video Count Check", False, f"Expected 6+ videos, found {len(videos)}")
        
        # Test get blog posts
        success, posts = self.run_test(
            "Get Blog Posts",
            "GET",
            "blog",
            200
        )
        
        if success and isinstance(posts, list):
            print(f"   Found {len(posts)} blog posts")
            if len(posts) >= 3:
                self.log_test("Blog Post Count Check", True, f"Found {len(posts)} posts")
            else:
                self.log_test("Blog Post Count Check", False, f"Expected 3+ posts, found {len(posts)}")
        
        # Test get specific blog post
        if success and posts:
            post_id = posts[0]['post_id']
            success, post = self.run_test(
                "Get Blog Post Detail",
                "GET",
                f"blog/{post_id}",
                200
            )
            
            # Test get comments for blog post
            success, comments = self.run_test(
                "Get Blog Comments",
                "GET",
                f"blog/{post_id}/comments",
                200
            )

    def test_user_registration(self):
        """Test user registration"""
        print("\n👤 Testing user registration...")
        
        timestamp = int(datetime.now().timestamp())
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test.user.{timestamp}@example.com",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            print(f"   Registered user: {response['user']['email']}")
            self.log_test("Registration Token Check", True, "Token received")
            return True
        else:
            self.log_test("Registration Token Check", False, "No token in response")
            return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        print("\n🔐 Testing user login...")
        
        # Try to login with the registered user
        if not hasattr(self, 'test_email'):
            # Create a new user for login test
            timestamp = int(datetime.now().timestamp())
            self.test_email = f"login.test.{timestamp}@example.com"
            self.test_password = "logintest123"
            
            # Register first
            register_data = {
                "name": f"Login Test User {timestamp}",
                "email": self.test_email,
                "password": self.test_password
            }
            
            success, response = self.run_test(
                "Pre-Login Registration",
                "POST",
                "auth/register",
                200,
                data=register_data
            )
        
        # Now test login
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            self.log_test("Login Token Check", True, "Token received")
            return True
        else:
            self.log_test("Login Token Check", False, "No token in response")
            return False

    def test_authenticated_endpoints(self):
        """Test endpoints that require authentication"""
        print("\n🔒 Testing authenticated endpoints...")
        
        if not self.token:
            self.log_test("Auth Required Tests", False, "No auth token available")
            return False
        
        # Test get current user
        success, user = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        # Test get my purchased videos
        success, my_videos = self.run_test(
            "Get My Videos",
            "GET",
            "my-videos",
            200
        )
        
        if success:
            print(f"   User has {len(my_videos)} purchased videos")
        
        # Test create blog comment (need a blog post first)
        success, posts = self.run_test(
            "Get Posts for Comment Test",
            "GET",
            "blog",
            200
        )
        
        if success and posts:
            post_id = posts[0]['post_id']
            comment_data = {
                "content": f"Test comment from automated test at {datetime.now()}"
            }
            
            success, comment = self.run_test(
                "Create Blog Comment",
                "POST",
                f"blog/{post_id}/comments",
                200,
                data=comment_data
            )

    def test_video_detail_endpoints(self):
        """Test video detail endpoints"""
        print("\n🎥 Testing video detail endpoints...")
        
        # Get videos first
        success, videos = self.run_test(
            "Get Videos for Detail Test",
            "GET",
            "videos",
            200
        )
        
        if success and videos:
            video_id = videos[0]['video_id']
            
            # Test get specific video
            success, video = self.run_test(
                "Get Video Detail",
                "GET",
                f"videos/{video_id}",
                200
            )
            
            if success:
                print(f"   Video: {video.get('title', 'Unknown')}")
                print(f"   Price: ${video.get('price', 0)}")
                print(f"   Purchased: {video.get('is_purchased', False)}")

    def test_payment_endpoints(self):
        """Test payment-related endpoints (without actual payment)"""
        print("\n💳 Testing payment endpoints...")
        
        if not self.token:
            self.log_test("Payment Tests", False, "No auth token available")
            return False
        
        # Get videos first
        success, videos = self.run_test(
            "Get Videos for Payment Test",
            "GET",
            "videos",
            200
        )
        
        if success and videos:
            # Find a video that's not purchased
            unpurchased_video = None
            for video in videos:
                if not video.get('is_purchased', False):
                    unpurchased_video = video
                    break
            
            if unpurchased_video:
                video_id = unpurchased_video['video_id']
                checkout_data = {
                    "video_id": video_id,
                    "origin_url": self.base_url
                }
                
                # Test create checkout (should work but we won't complete payment)
                success, checkout = self.run_test(
                    "Create Checkout Session",
                    "POST",
                    "checkout/create",
                    200,
                    data=checkout_data
                )
                
                if success and 'url' in checkout:
                    print(f"   Checkout URL created: {checkout['url'][:50]}...")
                    self.log_test("Checkout URL Check", True, "Stripe checkout URL generated")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Wellness Platform API Tests")
        print(f"Testing against: {self.base_url}")
        
        # Seed data first
        self.test_seed_data()
        
        # Test public endpoints
        self.test_public_endpoints()
        
        # Test user registration
        if self.test_user_registration():
            # Test authenticated endpoints
            self.test_authenticated_endpoints()
            
            # Test video details
            self.test_video_detail_endpoints()
            
            # Test payment endpoints
            self.test_payment_endpoints()
        
        # Test login separately
        self.test_user_login()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Return results for further processing
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": self.tests_passed/self.tests_run if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = WellnessPlatformTester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if results["success_rate"] < 0.8:  # 80% pass rate threshold
        print(f"\n❌ Test suite failed with {results['success_rate']:.1f}% pass rate")
        return 1
    else:
        print(f"\n✅ Test suite passed with {results['success_rate']:.1f}% pass rate")
        return 0

if __name__ == "__main__":
    sys.exit(main())