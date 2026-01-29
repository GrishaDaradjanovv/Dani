import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import { API } from '@/App';

const VideoCatalog = ({ auth }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchVideos();
  }, [auth.token]);

  const fetchVideos = async () => {
    try {
      const headers = {};
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      const response = await fetch(`${API}/videos`, {
        credentials: 'include',
        headers
      });
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(videos.map(v => v.category))];

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="video-catalog">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl text-deep-navy mb-4">Video Courses</h1>
          <p className="text-deep-navy/60 max-w-2xl mx-auto text-lg">
            Premium courses designed to guide you through your mental wellness journey
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-navy/40" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 rounded-full bg-white border-border"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-6 ${selectedCategory === cat ? 'bg-terracotta hover:bg-terracotta/90' : 'hover:bg-cream'}`}
                onClick={() => setSelectedCategory(cat)}
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-deep-navy/60 text-lg">No courses found matching your criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((video, index) => (
              <Link 
                key={video.video_id} 
                to={`/videos/${video.video_id}`}
                className="group"
                data-testid={`video-card-${index}`}
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-deep-navy/5 card-hover">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/60 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="category-badge">{video.category}</span>
                      {video.is_purchased && (
                        <span className="purchased-badge">Purchased</span>
                      )}
                    </div>
                    
                    {/* Price or Locked */}
                    <div className="absolute top-4 right-4">
                      {video.is_purchased ? (
                        <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      ) : (
                        <span className="price-tag">${video.price.toFixed(2)}</span>
                      )}
                    </div>
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                        {video.is_purchased ? (
                          <Play className="w-7 h-7 text-terracotta fill-terracotta ml-1" />
                        ) : (
                          <Lock className="w-6 h-6 text-deep-navy" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-heading text-xl text-deep-navy mb-2 group-hover:text-terracotta transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-deep-navy/60 text-sm line-clamp-2 mb-4">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-deep-navy/50 text-sm">
                        <Clock className="w-4 h-4" />
                        {video.duration}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-terracotta hover:text-terracotta hover:bg-terracotta/10"
                      >
                        {video.is_purchased ? 'Watch Now' : 'Learn More'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VideoCatalog;
