import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Video, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { API } from '@/App';

const CartPage = ({ auth }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: ''
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const headers = {};
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      const response = await fetch(`${API}/cart`, {
        credentials: 'include',
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPhysicalItems = cartItems.some(item => item.item_type === 'shop');
  const hasVideoItems = cartItems.some(item => item.item_type === 'video');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      const response = await fetch(`${API}/cart/${cartItemId}?quantity=${newQuantity}`, {
        method: 'PUT',
        headers,
        credentials: 'include'
      });
      if (response.ok) {
        if (newQuantity <= 0) {
          setCartItems(cartItems.filter(item => item.cart_item_id !== cartItemId));
        } else {
          setCartItems(cartItems.map(item => 
            item.cart_item_id === cartItemId ? { ...item, quantity: newQuantity } : item
          ));
        }
      }
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const headers = {};
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      const response = await fetch(`${API}/cart/${cartItemId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      if (response.ok) {
        setCartItems(cartItems.filter(item => item.cart_item_id !== cartItemId));
        toast.success('Item removed from cart');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (hasPhysicalItems && !showShipping) {
      setShowShipping(true);
      return;
    }

    if (hasPhysicalItems) {
      const required = ['full_name', 'address_line1', 'city', 'state', 'postal_code', 'country', 'phone'];
      const missing = required.filter(field => !shippingAddress[field]);
      if (missing.length > 0) {
        toast.error('Please fill in all required shipping fields');
        return;
      }
    }

    setCheckingOut(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const body = {
        origin_url: window.location.origin
      };
      if (hasPhysicalItems) {
        body.shipping_address = shippingAddress;
      }

      const response = await fetch(`${API}/cart/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Checkout failed');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <Layout auth={auth}>
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="cart-page">
        <div className="flex items-center gap-4 mb-8">
          <ShoppingCart className="w-8 h-8 text-terracotta" />
          <h1 className="font-heading text-3xl text-deep-navy">Shopping Cart</h1>
          <span className="px-3 py-1 rounded-full bg-terracotta/10 text-terracotta text-sm font-medium">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
            <ShoppingCart className="w-16 h-16 text-deep-navy/20 mx-auto mb-4" />
            <h2 className="font-heading text-xl text-deep-navy mb-2">Your cart is empty</h2>
            <p className="text-deep-navy/60 mb-6">Add some courses or products to get started</p>
            <div className="flex justify-center gap-4">
              <Link to="/videos">
                <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full">
                  Browse Courses
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" className="rounded-full">
                  Visit Shop
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div 
                  key={item.cart_item_id}
                  className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg flex gap-4 sm:gap-6"
                  data-testid={`cart-item-${index}`}
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 sm:w-28 sm:h-28 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {item.item_type === 'video' ? (
                            <Video className="w-4 h-4 text-sage" />
                          ) : (
                            <Package className="w-4 h-4 text-sun" />
                          )}
                          <span className="text-xs text-deep-navy/50 uppercase">
                            {item.item_type === 'video' ? 'Course' : 'Product'}
                          </span>
                        </div>
                        <h3 className="font-heading text-lg text-deep-navy truncate">{item.name}</h3>
                        <span className="category-badge text-xs">{item.category}</span>
                      </div>
                      <button
                        onClick={() => removeItem(item.cart_item_id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        data-testid={`remove-item-${index}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      {item.item_type === 'shop' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-8 h-8 rounded-full"
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                            data-testid={`decrease-${index}`}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-8 h-8 rounded-full"
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                            data-testid={`increase-${index}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-deep-navy/50">Lifetime access</span>
                      )}
                      <span className="font-heading text-xl text-deep-navy">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <Link to="/videos" className="inline-flex items-center gap-2 text-deep-navy/60 hover:text-deep-navy mt-4">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-xl sticky top-28" data-testid="order-summary">
                <h2 className="font-heading text-xl text-deep-navy mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  {hasVideoItems && (
                    <div className="flex justify-between text-deep-navy/70">
                      <span>Courses ({cartItems.filter(i => i.item_type === 'video').length})</span>
                      <span>${cartItems.filter(i => i.item_type === 'video').reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
                    </div>
                  )}
                  {hasPhysicalItems && (
                    <div className="flex justify-between text-deep-navy/70">
                      <span>Products</span>
                      <span>${cartItems.filter(i => i.item_type === 'shop').reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}</span>
                    </div>
                  )}
                  {hasPhysicalItems && (
                    <div className="flex justify-between text-deep-navy/70">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between text-deep-navy">
                    <span className="font-heading text-lg">Total</span>
                    <span className="font-heading text-2xl">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping Form */}
                {showShipping && hasPhysicalItems && (
                  <div className="mb-6 space-y-4 animate-fade-in" data-testid="shipping-form">
                    <div className="flex items-center gap-2 text-deep-navy mb-4">
                      <Truck className="w-5 h-5 text-terracotta" />
                      <span className="font-medium">Shipping Address</span>
                    </div>
                    
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={shippingAddress.full_name}
                        onChange={(e) => setShippingAddress({...shippingAddress, full_name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address_line1">Address *</Label>
                      <Input
                        id="address_line1"
                        value={shippingAddress.address_line1}
                        onChange={(e) => setShippingAddress({...shippingAddress, address_line1: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="postal_code">Postal Code *</Label>
                        <Input
                          id="postal_code"
                          value={shippingAddress.postal_code}
                          onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-6 text-lg shadow-lg shadow-terracotta/20"
                  data-testid="checkout-btn"
                >
                  {checkingOut ? 'Processing...' : showShipping ? 'Complete Checkout' : hasPhysicalItems ? 'Continue to Shipping' : 'Checkout'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {hasPhysicalItems && !showShipping && (
                  <p className="text-center text-xs text-deep-navy/50 mt-3">
                    Shipping address required for physical items
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;
