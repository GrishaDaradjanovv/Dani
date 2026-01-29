import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Video, BookOpen, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { API } from '@/App';

const Dashboard = ({ auth }) => {
  const [purchasedVideos, setPurchasedVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchasedVideos();
  }, [auth.token]);

  const fetchPurchasedVideos = async () => {
    try {
      const headers = {};
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      const response = await fetch(`${API}/my-videos`, {
        credentials: 'include',
        headers
      });
      const data = await response.json();
      setPurchasedVideos(data);
    } catch (error) {
      console.error('Failed to fetch purchased videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="dashboard">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl text-deep-navy mb-2">
                Welcome back, {auth.user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-deep-navy/60">Continue your wellness journey</p>
            </div>
            <Link to="/videos">
              <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-6" data-testid="browse-more-btn">
                Browse More Courses
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-deep-navy/5">
              <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-terracotta" />
              </div>
              <p className="text-2xl font-heading text-deep-navy">{purchasedVideos.length}</p>
              <p className="text-sm text-deep-navy/60">Courses Owned</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-deep-navy/5">
              <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-sage" />
              </div>
              <p className="text-2xl font-heading text-deep-navy">
                {purchasedVideos.reduce((acc, v) => {
                  const match = v.duration.match(/(\d+)h/);
                  return acc + (match ? parseInt(match[1]) : 0);
                }, 0)}h
              </p>
              <p className="text-sm text-deep-navy/60">Total Content</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-deep-navy/5">
              <div className="w-12 h-12 rounded-xl bg-sun/20 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-sun" />
              </div>
              <p className="text-2xl font-heading text-deep-navy">∞</p>
              <p className="text-sm text-deep-navy/60">Blog Access</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-deep-navy/5">
              <div className="w-12 h-12 rounded-xl bg-deep-navy/10 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-deep-navy" />
              </div>
              <p className="text-2xl font-heading text-deep-navy">Pro</p>
              <p className="text-sm text-deep-navy/60">Member Status</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="space-y-8">
          <TabsList className="bg-white rounded-full p-1 shadow-md">
            <TabsTrigger 
              value="courses" 
              className="rounded-full px-6 py-2 data-[state=active]:bg-terracotta data-[state=active]:text-white"
              data-testid="tab-courses"
            >
              My Courses
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="rounded-full px-6 py-2 data-[state=active]:bg-terracotta data-[state=active]:text-white"
              data-testid="tab-profile"
            >
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" data-testid="courses-content">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : purchasedVideos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-lg shadow-deep-navy/5">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Video className="w-10 h-10 text-deep-navy/30" />
                </div>
                <h3 className="font-heading text-xl text-deep-navy mb-2">No courses yet</h3>
                <p className="text-deep-navy/60 mb-6">Start your wellness journey by purchasing your first course</p>
                <Link to="/videos">
                  <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8" data-testid="explore-courses-btn">
                    Explore Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedVideos.map((video, index) => (
                  <Link 
                    key={video.video_id} 
                    to={`/videos/${video.video_id}`}
                    className="group"
                    data-testid={`owned-video-${index}`}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-deep-navy/5 card-hover">
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/60 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                            <Play className="w-7 h-7 text-terracotta fill-terracotta ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <span className="purchased-badge">Purchased</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading text-lg text-deep-navy mb-2 group-hover:text-terracotta transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-deep-navy/50 text-sm">
                          <Clock className="w-4 h-4" />
                          {video.duration}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" data-testid="profile-content">
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-deep-navy/5 max-w-2xl">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-terracotta flex items-center justify-center text-white text-2xl font-heading">
                  {auth.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-heading text-2xl text-deep-navy">{auth.user?.name}</h2>
                  <p className="text-deep-navy/60">{auth.user?.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-t border-border pt-6">
                  <h3 className="font-heading text-lg text-deep-navy mb-4">Account Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-deep-navy/60 mb-1">Full Name</p>
                      <p className="text-deep-navy font-medium">{auth.user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-deep-navy/60 mb-1">Email Address</p>
                      <p className="text-deep-navy font-medium">{auth.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-deep-navy/60 mb-1">Member Since</p>
                      <p className="text-deep-navy font-medium">2024</p>
                    </div>
                    <div>
                      <p className="text-sm text-deep-navy/60 mb-1">Courses Purchased</p>
                      <p className="text-deep-navy font-medium">{purchasedVideos.length}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-heading text-lg text-deep-navy mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/videos">
                      <Button variant="outline" className="rounded-full" data-testid="browse-courses-btn">
                        <Video className="w-4 h-4 mr-2" />
                        Browse Courses
                      </Button>
                    </Link>
                    <Link to="/blog">
                      <Button variant="outline" className="rounded-full" data-testid="read-blog-btn">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read Blog
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
