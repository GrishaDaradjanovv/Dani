import requests
import sys
import json
from datetime import datetime

class CartAndPasswordTester:
    def __init__(self, base_url="https://selfimprovehub-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_email = "danimoldovanova@gmail.com"
        self.admin_password = "AdminPass123!"

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
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

    def test_admin_login(self):
        """Login as admin user"""
        print("\n👑 Testing admin login...")
        
        login_data = {
            "email": self.admin_email,
            "password": self.admin_password
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            print(f"   Logged in as: {response['user']['email']}")
            print(f"   Is admin: {response['user'].get('is_admin', False)}")
            return True
        else:
            self.log_test("Admin Login Token Check", False, "No token in response")
            return False

    def test_cart_functionality(self):
        """Test cart CRUD operations"""
        print("\n🛒 Testing cart functionality...")
        
        if not self.token:
            self.log_test("Cart Tests", False, "No auth token available")
            return False
        
        # Get available videos and shop items
        success, videos = self.run_test(
            "Get Videos for Cart Test",
            "GET",
            "videos",
            200
        )
        
        success, shop_items = self.run_test(
            "Get Shop Items for Cart Test",
            "GET",
            "shop/items",
            200
        )
        
        if not (videos and shop_items):
            self.log_test("Cart Test Setup", False, "No videos or shop items available")
            return False
        
        video_id = videos[0]['video_id']
        shop_item_id = shop_items[0]['item_id']
        
        # Test 1: Add video to cart
        add_video_data = {
            "item_type": "video",
            "item_id": video_id,
            "quantity": 1
        }
        
        success, response = self.run_test(
            "Add Video to Cart",
            "POST",
            "cart/add",
            200,
            data=add_video_data
        )
        
        video_cart_item_id = None
        if success:
            video_cart_item_id = response.get('cart_item_id')
            print(f"   Added video to cart: {video_cart_item_id}")
        
        # Test 2: Add shop item to cart
        add_shop_data = {
            "item_type": "shop",
            "item_id": shop_item_id,
            "quantity": 2
        }
        
        success, response = self.run_test(
            "Add Shop Item to Cart",
            "POST",
            "cart/add",
            200,
            data=add_shop_data
        )
        
        shop_cart_item_id = None
        if success:
            shop_cart_item_id = response.get('cart_item_id')
            print(f"   Added shop item to cart: {shop_cart_item_id}")
        
        # Test 3: Get cart contents
        success, cart_items = self.run_test(
            "Get Cart Contents",
            "GET",
            "cart",
            200
        )
        
        if success:
            print(f"   Cart has {len(cart_items)} items")
            for item in cart_items:
                print(f"   - {item['name']} ({item['item_type']}) x{item['quantity']} = ${item['price'] * item['quantity']}")
        
        # Test 4: Update shop item quantity in cart
        if shop_cart_item_id:
            success, response = self.run_test(
                "Update Shop Item Quantity",
                "PUT",
                f"cart/{shop_cart_item_id}?quantity=3",
                200
            )
        
        # Test 5: Remove video from cart
        if video_cart_item_id:
            success, response = self.run_test(
                "Remove Video from Cart",
                "DELETE",
                f"cart/{video_cart_item_id}",
                200
            )
        
        # Test 6: Get updated cart
        success, updated_cart = self.run_test(
            "Get Updated Cart",
            "GET",
            "cart",
            200
        )
        
        if success:
            print(f"   Updated cart has {len(updated_cart)} items")
        
        # Test 7: Cart checkout (without completing payment)
        checkout_data = {
            "shipping_address": {
                "full_name": "Test User",
                "address_line1": "123 Test St",
                "address_line2": "",
                "city": "Test City",
                "state": "Test State",
                "postal_code": "12345",
                "country": "Test Country",
                "phone": "+1234567890"
            },
            "origin_url": self.base_url
        }
        
        success, checkout_response = self.run_test(
            "Cart Checkout",
            "POST",
            "cart/checkout",
            200,
            data=checkout_data
        )
        
        if success and 'url' in checkout_response:
            print(f"   Checkout URL created: {checkout_response['url'][:50]}...")
            self.log_test("Cart Checkout URL Check", True, "Stripe checkout URL generated")
        
        # Test 8: Clear cart
        success, response = self.run_test(
            "Clear Cart",
            "DELETE",
            "cart",
            200
        )

    def test_password_reset_flow(self):
        """Test password reset functionality"""
        print("\n🔐 Testing password reset flow...")
        
        # Test 1: Request password reset
        reset_request_data = {
            "email": self.admin_email
        }
        
        success, response = self.run_test(
            "Request Password Reset",
            "POST",
            "auth/forgot-password",
            200,
            data=reset_request_data
        )
        
        if success:
            print("   Password reset email would be sent")
        
        # Test 2: Try with non-existent email (should still return 200 for security)
        fake_reset_data = {
            "email": "nonexistent@example.com"
        }
        
        success, response = self.run_test(
            "Password Reset Non-existent Email",
            "POST",
            "auth/forgot-password",
            200,
            data=fake_reset_data
        )
        
        # Test 3: Try reset with invalid token (should fail)
        invalid_reset_data = {
            "token": "invalid_token_123",
            "new_password": "NewPassword123!"
        }
        
        success, response = self.run_test(
            "Reset Password Invalid Token",
            "POST",
            "auth/reset-password",
            400,
            data=invalid_reset_data
        )

    def test_individual_item_purchase(self):
        """Test individual video and shop item purchase flows"""
        print("\n💳 Testing individual item purchases...")
        
        if not self.token:
            self.log_test("Individual Purchase Tests", False, "No auth token available")
            return False
        
        # Get available items
        success, videos = self.run_test(
            "Get Videos for Purchase Test",
            "GET",
            "videos",
            200
        )
        
        success, shop_items = self.run_test(
            "Get Shop Items for Purchase Test",
            "GET",
            "shop/items",
            200
        )
        
        if videos:
            video_id = videos[0]['video_id']
            
            # Test video purchase checkout
            video_checkout_data = {
                "video_id": video_id,
                "origin_url": self.base_url
            }
            
            success, checkout_response = self.run_test(
                "Video Purchase Checkout",
                "POST",
                "checkout/create",
                200,
                data=video_checkout_data
            )
            
            if success and 'url' in checkout_response:
                print(f"   Video checkout URL: {checkout_response['url'][:50]}...")
        
        if shop_items:
            item_id = shop_items[0]['item_id']
            
            # Test shop item purchase checkout
            shop_checkout_data = {
                "item_id": item_id,
                "quantity": 1,
                "shipping_address": {
                    "full_name": "Test User",
                    "address_line1": "123 Test St",
                    "address_line2": "",
                    "city": "Test City",
                    "state": "Test State",
                    "postal_code": "12345",
                    "country": "Test Country",
                    "phone": "+1234567890"
                },
                "origin_url": self.base_url
            }
            
            success, checkout_response = self.run_test(
                "Shop Item Purchase Checkout",
                "POST",
                "shop/checkout",
                200,
                data=shop_checkout_data
            )
            
            if success and 'url' in checkout_response:
                print(f"   Shop item checkout URL: {checkout_response['url'][:50]}...")

    def run_all_tests(self):
        """Run all cart and password reset tests"""
        print("🚀 Starting Cart and Password Reset Tests")
        print(f"Testing against: {self.base_url}")
        
        # Login as admin first
        admin_logged_in = self.test_admin_login()
        
        if admin_logged_in:
            # Test cart functionality
            self.test_cart_functionality()
            
            # Test individual purchases
            self.test_individual_item_purchase()
        
        # Test password reset (doesn't require login)
        self.test_password_reset_flow()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": self.tests_passed/self.tests_run if self.tests_run > 0 else 0,
            "test_results": self.test_results,
            "failed_tests": failed_tests
        }

def main():
    tester = CartAndPasswordTester()
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