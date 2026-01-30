import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { API } from '@/App';

const ShopOrderSuccess = ({ auth }) => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('failed');
    }
  }, []);

  const pollPaymentStatus = async (sessionId) => {
    if (attempts >= maxAttempts) {
      setStatus('failed');
      return;
    }

    try {
      const headers = {};
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const response = await fetch(`${API}/checkout/status/${sessionId}`, {
        credentials: 'include',
        headers
      });

      if (!response.ok) throw new Error('Failed to check status');

      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStatus('success');
      } else if (data.status === 'expired') {
        setStatus('failed');
      } else {
        setAttempts(prev => prev + 1);
        setTimeout(() => pollPaymentStatus(sessionId), 2000);
      }
    } catch (error) {
      setAttempts(prev => prev + 1);
      setTimeout(() => pollPaymentStatus(sessionId), 2000);
    }
  };

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-20" data-testid="shop-order-success-page">
        <div className="max-w-lg mx-auto text-center">
          {status === 'checking' && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-sun/20 flex items-center justify-center mx-auto">
                <Loader2 className="w-12 h-12 text-sun animate-spin" />
              </div>
              <h1 className="font-heading text-3xl text-deep-navy">Processing Order...</h1>
              <p className="text-deep-navy/60">Please wait while we confirm your purchase</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-sage/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-sage" />
              </div>
              <h1 className="font-heading text-3xl text-deep-navy">Order Placed!</h1>
              <p className="text-deep-navy/60">
                Thank you for your order! We'll send you a confirmation email with tracking details soon.
              </p>
              <div className="bg-cream rounded-2xl p-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-5 h-5 text-terracotta" />
                  <span className="font-heading text-deep-navy">What's Next?</span>
                </div>
                <ul className="space-y-2 text-deep-navy/70 text-sm">
                  <li>• You'll receive an order confirmation email</li>
                  <li>• We'll prepare your items for shipping</li>
                  <li>• Tracking info will be sent once shipped</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/dashboard">
                  <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 py-6" data-testid="go-to-dashboard-btn">
                    View Orders
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline" className="rounded-full px-8 py-6" data-testid="continue-shopping-btn">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-6 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="font-heading text-3xl text-deep-navy">Order Issue</h1>
              <p className="text-deep-navy/60">
                We couldn't confirm your order. If you were charged, please contact support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/shop">
                  <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 py-6">
                    Try Again
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ShopOrderSuccess;
