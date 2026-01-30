import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { API } from '@/App';

const ShopItemDetail = ({ auth }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
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
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`${API}/shop/items/${itemId}`);
      if (!response.ok) throw new Error('Item not found');
      const data = await response.json();
      setItem(data);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!auth.user) {
      toast.error('Please log in to purchase');
      navigate('/login');
      return;
    }

    // Validate shipping address
    const required = ['full_name', 'address_line1', 'city', 'state', 'postal_code', 'country', 'phone'];
    const missing = required.filter(field => !shippingAddress[field]);
    if (missing.length > 0) {
      toast.error('Please fill in all required shipping fields');
      return;
    }

    setPurchasing(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${API}/shop/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          item_id: itemId,
          quantity,
          shipping_address: shippingAddress,
          origin_url: window.location.origin
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create checkout');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleAddToCart = async () => {
    if (!auth.user) {
      toast.error('Please log in to add to cart');
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${API}/cart/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          item_type: 'shop',
          item_id: itemId,
          quantity: quantity
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add to cart');
      }

      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <Layout auth={auth}>
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-3xl" />
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded w-3/4" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!item) return null;

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="shop-item-detail">
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 text-deep-navy/60 hover:text-deep-navy mb-8 transition-colors"
          data-testid="back-to-shop"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="category-badge">{item.category}</span>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl text-deep-navy mb-4" data-testid="item-name">
                {item.name}
              </h1>
              <p className="text-deep-navy/70 text-lg leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-heading text-deep-navy">${item.price.toFixed(2)}</span>
              {item.stock > 0 ? (
                <span className="text-sage font-medium">
                  <Package className="w-4 h-4 inline mr-1" />
                  {item.stock} in stock
                </span>
              ) : (
                <span className="text-red-500 font-medium">Out of stock</span>
              )}
            </div>

            {/* Quantity Selector */}
            {item.stock > 0 && !showCheckout && (
              <div className="space-y-4">
                <Label className="text-deep-navy font-medium">Quantity</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-medium text-deep-navy w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setQuantity(Math.min(item.stock, quantity + 1))}
                    disabled={quantity >= item.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-deep-navy/60">
                  Total: <span className="font-heading text-deep-navy">${(item.price * quantity).toFixed(2)}</span>
                </p>
              </div>
            )}

            {/* Checkout Button or Form */}
            {item.stock > 0 && !showCheckout && (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-6 text-lg shadow-lg shadow-terracotta/20"
                  data-testid="proceed-to-checkout-btn"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  variant="outline"
                  className="w-full rounded-full py-6 text-lg border-terracotta text-terracotta hover:bg-terracotta/10"
                  data-testid="add-to-cart-btn"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            )}

            {/* Shipping Form */}
            {showCheckout && (
              <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4" data-testid="shipping-form">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-terracotta" />
                  <h3 className="font-heading text-lg text-deep-navy">Shipping Information</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={shippingAddress.full_name}
                      onChange={(e) => setShippingAddress({...shippingAddress, full_name: e.target.value})}
                      className="mt-1"
                      data-testid="shipping-name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      value={shippingAddress.address_line1}
                      onChange={(e) => setShippingAddress({...shippingAddress, address_line1: e.target.value})}
                      className="mt-1"
                      data-testid="shipping-address1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={shippingAddress.address_line2}
                      onChange={(e) => setShippingAddress({...shippingAddress, address_line2: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="mt-1"
                      data-testid="shipping-city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      className="mt-1"
                      data-testid="shipping-state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code *</Label>
                    <Input
                      id="postal_code"
                      value={shippingAddress.postal_code}
                      onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                      className="mt-1"
                      data-testid="shipping-postal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      className="mt-1"
                      data-testid="shipping-country"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      className="mt-1"
                      data-testid="shipping-phone"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between text-deep-navy mb-2">
                    <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                    <span className="font-medium">${(item.price * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-deep-navy mb-4">
                    <span>Shipping</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 rounded-full py-6"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-6"
                    data-testid="complete-purchase-btn"
                  >
                    {purchasing ? 'Processing...' : 'Complete Purchase'}
                  </Button>
                </div>
              </div>
            )}

            {!auth.user && item.stock > 0 && (
              <p className="text-center text-sm text-deep-navy/60">
                <Link to="/login" className="text-terracotta hover:underline">Log in</Link>
                {' '}or{' '}
                <Link to="/register" className="text-terracotta hover:underline">create an account</Link>
                {' '}to purchase
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShopItemDetail;
