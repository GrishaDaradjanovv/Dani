import { useState, useEffect, useRef } from 'react';
import { Video, ShoppingBag, BookOpen, MessageCircle, Package, Trash2, Plus, X, Upload, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { API } from '@/App';

const AdminPanel = ({ auth }) => {
  const [videos, setVideos] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  const [videoForm, setVideoForm] = useState({
    title: '', description: '', thumbnail_url: '', video_url: '', price: '', duration: '', category: ''
  });
  const [itemForm, setItemForm] = useState({
    name: '', description: '', price: '', image_url: '', category: '', stock: ''
  });
  const [blogForm, setBlogForm] = useState({
    title: '', content: '', excerpt: '', cover_image: '', category: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = {};
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }

    try {
      const [videosRes, itemsRes, ordersRes, blogRes] = await Promise.all([
        fetch(`${API}/videos`, { headers, credentials: 'include' }),
        fetch(`${API}/shop/items`),
        fetch(`${API}/admin/orders`, { headers, credentials: 'include' }),
        fetch(`${API}/blog`)
      ]);

      if (videosRes.ok) setVideos(await videosRes.json());
      if (itemsRes.ok) setShopItems(await itemsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (blogRes.ok) setBlogPosts(await blogRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return headers;
  };

  // Video handlers
  const handleCreateVideo = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/videos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...videoForm,
          price: parseFloat(videoForm.price)
        }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create video');
      toast.success('Video created successfully');
      setShowVideoForm(false);
      setVideoForm({ title: '', description: '', thumbnail_url: '', video_url: '', price: '', duration: '', category: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const response = await fetch(`${API}/videos/${videoId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete video');
      toast.success('Video deleted');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Shop item handlers
  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/shop/items`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...itemForm,
          price: parseFloat(itemForm.price),
          stock: parseInt(itemForm.stock)
        }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create item');
      toast.success('Item created successfully');
      setShowItemForm(false);
      setItemForm({ name: '', description: '', price: '', image_url: '', category: '', stock: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${API}/shop/items/${itemId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete item');
      toast.success('Item deleted');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Blog handlers
  const handleCreateBlog = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/blog`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(blogForm),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create blog post');
      toast.success('Blog post created successfully');
      setShowBlogForm(false);
      setBlogForm({ title: '', content: '', excerpt: '', cover_image: '', category: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteBlog = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await fetch(`${API}/blog/${postId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete post');
      toast.success('Post deleted');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await fetch(`${API}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API}/admin/orders/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update order');
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="admin-panel">
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl text-deep-navy mb-2">Admin Panel</h1>
          <p className="text-deep-navy/60">Manage your content and orders</p>
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="bg-white rounded-full p-1 shadow-md flex-wrap">
            <TabsTrigger value="videos" className="rounded-full px-4 py-2 data-[state=active]:bg-terracotta data-[state=active]:text-white">
              <Video className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="shop" className="rounded-full px-4 py-2 data-[state=active]:bg-terracotta data-[state=active]:text-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop Items
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full px-4 py-2 data-[state=active]:bg-terracotta data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="blog" className="rounded-full px-4 py-2 data-[state=active]:bg-terracotta data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Blog
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" data-testid="admin-videos-tab">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-xl text-deep-navy">Video Courses ({videos.length})</h2>
                <Button onClick={() => setShowVideoForm(true)} className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full" data-testid="add-video-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>

              {showVideoForm && (
                <form onSubmit={handleCreateVideo} className="mb-6 p-6 bg-cream rounded-xl space-y-4" data-testid="video-form">
                  <div className="flex justify-between items-center">
                    <h3 className="font-heading text-lg text-deep-navy">New Video</h3>
                    <button type="button" onClick={() => setShowVideoForm(false)}>
                      <X className="w-5 h-5 text-deep-navy/60" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={videoForm.title} onChange={(e) => setVideoForm({...videoForm, title: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={videoForm.category} onChange={(e) => setVideoForm({...videoForm, category: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Thumbnail URL</Label>
                      <Input value={videoForm.thumbnail_url} onChange={(e) => setVideoForm({...videoForm, thumbnail_url: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Video URL</Label>
                      <Input value={videoForm.video_url} onChange={(e) => setVideoForm({...videoForm, video_url: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Price ($)</Label>
                      <Input type="number" step="0.01" value={videoForm.price} onChange={(e) => setVideoForm({...videoForm, price: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input placeholder="e.g., 2h 30m" value={videoForm.duration} onChange={(e) => setVideoForm({...videoForm, duration: e.target.value})} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={videoForm.description} onChange={(e) => setVideoForm({...videoForm, description: e.target.value})} required />
                    </div>
                  </div>
                  <Button type="submit" className="bg-sage hover:bg-sage/90 text-white rounded-full">Create Video</Button>
                </form>
              )}

              <div className="space-y-4">
                {videos.map((video) => (
                  <div key={video.video_id} className="flex items-center gap-4 p-4 bg-cream rounded-xl" data-testid={`admin-video-${video.video_id}`}>
                    <img src={video.thumbnail_url} alt={video.title} className="w-24 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-deep-navy">{video.title}</h4>
                      <p className="text-sm text-deep-navy/60">{video.category} • ${video.price} • {video.duration}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteVideo(video.video_id)} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Shop Items Tab */}
          <TabsContent value="shop" data-testid="admin-shop-tab">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-xl text-deep-navy">Shop Items ({shopItems.length})</h2>
                <Button onClick={() => setShowItemForm(true)} className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full" data-testid="add-item-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {showItemForm && (
                <form onSubmit={handleCreateItem} className="mb-6 p-6 bg-cream rounded-xl space-y-4" data-testid="item-form">
                  <div className="flex justify-between items-center">
                    <h3 className="font-heading text-lg text-deep-navy">New Shop Item</h3>
                    <button type="button" onClick={() => setShowItemForm(false)}>
                      <X className="w-5 h-5 text-deep-navy/60" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={itemForm.name} onChange={(e) => setItemForm({...itemForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input value={itemForm.image_url} onChange={(e) => setItemForm({...itemForm, image_url: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Price ($)</Label>
                      <Input type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({...itemForm, price: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input type="number" value={itemForm.stock} onChange={(e) => setItemForm({...itemForm, stock: e.target.value})} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} required />
                    </div>
                  </div>
                  <Button type="submit" className="bg-sage hover:bg-sage/90 text-white rounded-full">Create Item</Button>
                </form>
              )}

              <div className="space-y-4">
                {shopItems.map((item) => (
                  <div key={item.item_id} className="flex items-center gap-4 p-4 bg-cream rounded-xl" data-testid={`admin-item-${item.item_id}`}>
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-deep-navy">{item.name}</h4>
                      <p className="text-sm text-deep-navy/60">{item.category} • ${item.price} • Stock: {item.stock}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.item_id)} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" data-testid="admin-orders-tab">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="font-heading text-xl text-deep-navy mb-6">Orders ({orders.length})</h2>
              {orders.length === 0 ? (
                <p className="text-deep-navy/60 text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.order_id} className="p-4 bg-cream rounded-xl" data-testid={`admin-order-${order.order_id}`}>
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <h4 className="font-medium text-deep-navy">{order.item_name} x{order.quantity}</h4>
                          <p className="text-sm text-deep-navy/60">Order: {order.order_id}</p>
                          <p className="text-sm text-deep-navy/60">Total: ${order.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === 'paid' ? 'bg-sage/20 text-sage' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                            'bg-sun/30 text-deep-navy'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-deep-navy/70">
                        <p><strong>Ship to:</strong> {order.shipping_address.full_name}</p>
                        <p>{order.shipping_address.address_line1}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleUpdateOrderStatus(order.order_id, 'shipped')}>
                          Mark Shipped
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateOrderStatus(order.order_id, 'delivered')}>
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" data-testid="admin-blog-tab">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-xl text-deep-navy">Blog Posts ({blogPosts.length})</h2>
                <Button onClick={() => setShowBlogForm(true)} className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full" data-testid="add-blog-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Post
                </Button>
              </div>

              {showBlogForm && (
                <form onSubmit={handleCreateBlog} className="mb-6 p-6 bg-cream rounded-xl space-y-4" data-testid="blog-form">
                  <div className="flex justify-between items-center">
                    <h3 className="font-heading text-lg text-deep-navy">New Blog Post</h3>
                    <button type="button" onClick={() => setShowBlogForm(false)}>
                      <X className="w-5 h-5 text-deep-navy/60" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={blogForm.title} onChange={(e) => setBlogForm({...blogForm, title: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={blogForm.category} onChange={(e) => setBlogForm({...blogForm, category: e.target.value})} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Cover Image URL</Label>
                      <Input value={blogForm.cover_image} onChange={(e) => setBlogForm({...blogForm, cover_image: e.target.value})} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Excerpt</Label>
                      <Input value={blogForm.excerpt} onChange={(e) => setBlogForm({...blogForm, excerpt: e.target.value})} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Content</Label>
                      <Textarea rows={10} value={blogForm.content} onChange={(e) => setBlogForm({...blogForm, content: e.target.value})} required />
                    </div>
                  </div>
                  <Button type="submit" className="bg-sage hover:bg-sage/90 text-white rounded-full">Create Post</Button>
                </form>
              )}

              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div key={post.post_id} className="flex items-center gap-4 p-4 bg-cream rounded-xl" data-testid={`admin-blog-${post.post_id}`}>
                    <img src={post.cover_image} alt={post.title} className="w-24 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-medium text-deep-navy">{post.title}</h4>
                      <p className="text-sm text-deep-navy/60">{post.category} • {post.comments_count} comments</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBlog(post.post_id)} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPanel;
