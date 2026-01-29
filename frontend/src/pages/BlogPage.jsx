import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MessageCircle, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { API } from '@/App';

const BlogPage = ({ auth }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API}/blog`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(posts.map(p => p.category))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="blog-page">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl text-deep-navy mb-4">Wellness Blog</h1>
          <p className="text-deep-navy/60 max-w-2xl mx-auto text-lg">
            Free articles on mental health, mindfulness, and personal growth
          </p>
        </div>

        {/* Featured Image */}
        <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden mb-12">
          <img
            src="https://images.unsplash.com/photo-1768335796369-ec98f204503b?w=1200"
            alt="Journaling with coffee"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-navy/70 to-transparent flex items-center">
            <div className="p-8 sm:p-12 max-w-lg text-white">
              <span className="category-badge bg-sun text-deep-navy mb-4 inline-block">Featured</span>
              <h2 className="font-heading text-2xl sm:text-3xl mb-3">Discover Your Path to Inner Peace</h2>
              <p className="text-white/80 mb-4">Explore our collection of expert articles and guides</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-navy/40" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 rounded-full bg-white border-border"
              data-testid="blog-search-input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-6 ${selectedCategory === cat ? 'bg-terracotta hover:bg-terracotta/90' : 'hover:bg-cream'}`}
                onClick={() => setSelectedCategory(cat)}
                data-testid={`blog-filter-${cat.toLowerCase()}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-deep-navy/60 text-lg">No articles found matching your criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <Link 
                key={post.post_id} 
                to={`/blog/${post.post_id}`}
                className="group"
                data-testid={`blog-card-${index}`}
              >
                <article className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-deep-navy/5 card-hover h-full flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="category-badge">{post.category}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-heading text-xl text-deep-navy mb-3 group-hover:text-terracotta transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-deep-navy/60 text-sm line-clamp-3 mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-deep-navy/50 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.created_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BlogPage;
