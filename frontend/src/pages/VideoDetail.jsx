import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Clock, Lock, CheckCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { API } from '@/App';

const VideoDetail = ({ auth }) => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [videoId, auth.token]);

  const fetchVideo = async () => {
    try {
      const headers = {};
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      const response = await fetch(`${API}/videos/${videoId}`, {
        credentials: 'include',
        headers
      });
      if (!response.ok) {
        throw new Error('Video not found');
      }
      const data = await response.json();
      setVideo(data);
    } catch (error) {
      toast.error('Failed to load video');
      navigate('/videos');
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

    setPurchasing(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${API}/checkout/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          video_id: videoId,
          origin_url: window.location.origin
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create checkout');
      }

      // Redirect to Stripe checkout
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
          item_type: 'video',
          item_id: videoId,
          quantity: 1
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
            <div className="aspect-video bg-muted rounded-3xl" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!video) return null;

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="video-detail">
        {/* Back button */}
        <Link 
          to="/videos" 
          className="inline-flex items-center gap-2 text-deep-navy/60 hover:text-deep-navy mb-8 transition-colors"
          data-testid="back-to-videos"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Player or Preview */}
            <div className="relative aspect-video bg-deep-navy rounded-3xl overflow-hidden shadow-2xl">
              {video.is_purchased && video.video_url ? (
                <video
                  src={video.video_url}
                  controls
                  className="w-full h-full"
                  poster={video.thumbnail_url}
                  data-testid="video-player"
                />
              ) : (
                <>
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-deep-navy/60 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Lock className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-heading">Purchase to unlock</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl text-deep-navy mb-4" data-testid="video-title">
                {video.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="category-badge">{video.category}</span>
                <div className="flex items-center gap-2 text-deep-navy/60">
                  <Clock className="w-4 h-4" />
                  {video.duration}
                </div>
                {video.is_purchased && (
                  <span className="purchased-badge flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Purchased
                  </span>
                )}
              </div>
              <p className="text-deep-navy/70 text-lg leading-relaxed" data-testid="video-description">
                {video.description}
              </p>
            </div>

            {/* What you'll learn */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-deep-navy/5">
              <h2 className="font-heading text-2xl text-deep-navy mb-6">What You'll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Evidence-based techniques and strategies",
                  "Practical exercises you can apply immediately",
                  "Understanding the science behind wellness",
                  "Tools for long-term sustainable change",
                  "Self-assessment frameworks",
                  "Access to downloadable resources"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                    <span className="text-deep-navy/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-8 shadow-xl shadow-deep-navy/10" data-testid="purchase-card">
              {video.is_purchased ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-sage" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-deep-navy mb-2">You own this course!</h3>
                    <p className="text-deep-navy/60">Enjoy unlimited access to all content</p>
                  </div>
                  <Button 
                    className="w-full bg-sage hover:bg-sage/90 text-white rounded-full py-6 text-lg"
                    onClick={() => {
                      const player = document.querySelector('video');
                      if (player) player.scrollIntoView({ behavior: 'smooth' });
                    }}
                    data-testid="watch-now-btn"
                  >
                    <Play className="w-5 h-5 mr-2 fill-white" />
                    Watch Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-heading text-deep-navy mb-2">
                      ${video.price.toFixed(2)}
                    </div>
                    <p className="text-deep-navy/60">One-time payment, lifetime access</p>
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-6 text-lg shadow-lg shadow-terracotta/20"
                    data-testid="purchase-btn"
                  >
                    {purchasing ? (
                      'Processing...'
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Purchase Course
                      </>
                    )}
                  </Button>

                  {!auth.user && (
                    <p className="text-center text-sm text-deep-navy/60">
                      <Link to="/login" className="text-terracotta hover:underline">Log in</Link>
                      {' '}or{' '}
                      <Link to="/register" className="text-terracotta hover:underline">create an account</Link>
                      {' '}to purchase
                    </p>
                  )}

                  <div className="border-t border-border pt-6 space-y-4">
                    <h4 className="font-medium text-deep-navy">This course includes:</h4>
                    <ul className="space-y-3 text-deep-navy/70 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-sage" />
                        {video.duration} of video content
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-sage" />
                        Lifetime access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-sage" />
                        Access on any device
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-sage" />
                        Certificate of completion
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoDetail;
