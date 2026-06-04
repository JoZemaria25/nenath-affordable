import requests
import sys
import json
from datetime import datetime

class NenathEcommerceAPITester:
    def __init__(self, base_url="https://nenath-affordable.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n[TEST] Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"[PASS] Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"[FAIL] Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"[FAIL] Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "nenathaffordable@gmail.com", "password": "nendbuns12#"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user_id = response.get('user', {}).get('user_id')
            print(f"   Admin logged in: {response.get('user', {}).get('email')}")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "08012345678",
            "state": "Lagos",
            "country": "Nigeria"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response.get('user', {}).get('user_id')
            print(f"   User registered: {response.get('user', {}).get('email')}")
            return True
        return False

    def test_get_categories(self):
        """Test getting categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        if success:
            categories = response.get('categories', [])
            print(f"   Found {len(categories)} categories")
            return len(categories) >= 7  # Should have 7 seeded categories
        return False

    def test_get_products(self):
        """Test getting products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        if success:
            products = response.get('products', [])
            total = response.get('total', 0)
            print(f"   Found {len(products)} products (total: {total})")
            return len(products) >= 12  # Should have 12 seeded products
        return False

    def test_product_detail(self):
        """Test getting product detail"""
        # First get a product ID
        success, response = self.run_test(
            "Get Products for Detail Test",
            "GET",
            "products?limit=1",
            200
        )
        if success and response.get('products'):
            product_id = response['products'][0]['product_id']
            success, detail_response = self.run_test(
                "Get Product Detail",
                "GET",
                f"products/{product_id}",
                200
            )
            if success:
                product = detail_response.get('product', {})
                related = detail_response.get('related', [])
                print(f"   Product: {product.get('name', 'Unknown')}")
                print(f"   Related products: {len(related)}")
                return True
        return False

    def test_add_to_cart(self):
        """Test adding item to cart"""
        if not self.token:
            print("   Skipped - No user token")
            return False
            
        # Get a product to add
        success, response = self.run_test(
            "Get Products for Cart Test",
            "GET",
            "products?limit=1",
            200
        )
        if success and response.get('products'):
            product = response['products'][0]
            cart_data = {
                "product_id": product['product_id'],
                "quantity": 2,
                "size": product.get('sizes', [''])[0] if product.get('sizes') else '',
                "color": product.get('colors', [''])[0] if product.get('colors') else ''
            }
            
            success, cart_response = self.run_test(
                "Add to Cart",
                "POST",
                "cart",
                200,
                data=cart_data
            )
            return success
        return False

    def test_get_cart(self):
        """Test getting cart"""
        if not self.token:
            print("   Skipped - No user token")
            return False
            
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        if success:
            cart = response.get('cart', {})
            items = cart.get('items', [])
            total = cart.get('total', 0)
            print(f"   Cart items: {len(items)}, Total: NGN {total:,.2f}")
            return True
        return False

    def test_wishlist_toggle(self):
        """Test wishlist functionality"""
        if not self.token:
            print("   Skipped - No user token")
            return False
            
        # Get a product to add to wishlist
        success, response = self.run_test(
            "Get Products for Wishlist Test",
            "GET",
            "products?limit=1",
            200
        )
        if success and response.get('products'):
            product_id = response['products'][0]['product_id']
            
            success, wishlist_response = self.run_test(
                "Toggle Wishlist",
                "POST",
                f"wishlist/{product_id}",
                200
            )
            if success:
                action = wishlist_response.get('action', 'unknown')
                print(f"   Wishlist action: {action}")
                return True
        return False

    def test_create_order(self):
        """Test creating an order"""
        if not self.token:
            print("   Skipped - No user token")
            return False
            
        order_data = {
            "customer_name": "Test Customer",
            "phone": "08012345678",
            "address": "123 Test Street, Test Area",
            "city": "Lagos",
            "state": "Lagos",
            "notes": "Test order"
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        if success:
            order = response.get('order', {})
            order_id = order.get('order_id', 'Unknown')
            total = order.get('total', 0)
            print(f"   Order created: {order_id[:8]}..., Total: NGN {total:,.2f}")
            return True
        return False

    def test_get_settings(self):
        """Test getting settings"""
        success, response = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        if success:
            settings = response.get('settings', {})
            bank_name = settings.get('bank_name', 'Not set')
            whatsapp = settings.get('whatsapp_number', 'Not set')
            print(f"   Bank: {bank_name}, WhatsApp: {whatsapp}")
            return True
        return False

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        if not self.admin_token:
            print("   Skipped - No admin token")
            return False
            
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "admin/dashboard",
            200,
            use_admin=True
        )
        if success:
            total_products = response.get('total_products', 0)
            total_orders = response.get('total_orders', 0)
            total_revenue = response.get('total_revenue', 0)
            print(f"   Products: {total_products}, Orders: {total_orders}, Revenue: NGN {total_revenue:,.2f}")
            return True
        return False

    def test_admin_orders(self):
        """Test admin orders endpoint"""
        if not self.admin_token:
            print("   Skipped - No admin token")
            return False
            
        success, response = self.run_test(
            "Admin Orders",
            "GET",
            "admin/orders",
            200,
            use_admin=True
        )
        if success:
            orders = response.get('orders', [])
            total = response.get('total', 0)
            print(f"   Found {len(orders)} orders (total: {total})")
            return True
        return False

    def test_admin_customers(self):
        """Test admin customers endpoint"""
        if not self.admin_token:
            print("   Skipped - No admin token")
            return False
            
        success, response = self.run_test(
            "Admin Customers",
            "GET",
            "admin/customers",
            200,
            use_admin=True
        )
        if success:
            customers = response.get('customers', [])
            total = response.get('total', 0)
            print(f"   Found {len(customers)} customers (total: {total})")
            return True
        return False

    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        if not self.admin_token:
            print("   Skipped - No admin token")
            return False
            
        success, response = self.run_test(
            "Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            use_admin=True
        )
        if success:
            most_viewed = response.get('most_viewed', [])
            best_selling = response.get('best_selling', [])
            revenue_trends = response.get('revenue_trends', [])
            print(f"   Most viewed: {len(most_viewed)}, Best selling: {len(best_selling)}, Revenue trends: {len(revenue_trends)}")
            return True
        return False

def main():
    print("[START] Starting NENATH AFFORDABLE E-commerce API Tests")
    print("=" * 60)
    
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    tester = NenathEcommerceAPITester(base_url=base_url)
    
    # Test sequence
    tests = [
        # Auth tests
        ("Admin Login", tester.test_admin_login),
        ("User Registration", tester.test_user_registration),
        
        # Public endpoints
        ("Get Categories", tester.test_get_categories),
        ("Get Products", tester.test_get_products),
        ("Product Detail", tester.test_product_detail),
        ("Get Settings", tester.test_get_settings),
        
        # User-specific tests
        ("Add to Cart", tester.test_add_to_cart),
        ("Get Cart", tester.test_get_cart),
        ("Wishlist Toggle", tester.test_wishlist_toggle),
        ("Create Order", tester.test_create_order),
        
        # Admin tests
        ("Admin Dashboard", tester.test_admin_dashboard),
        ("Admin Orders", tester.test_admin_orders),
        ("Admin Customers", tester.test_admin_customers),
        ("Admin Analytics", tester.test_admin_analytics),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"[FAIL] {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"[STATS] Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n[FAIL] Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n[PASS] All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n[RATE] Success rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())