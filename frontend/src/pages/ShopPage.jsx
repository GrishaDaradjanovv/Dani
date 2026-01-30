import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import { API } from '@/App';

const ShopPage = ({ auth }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API}/shop/items`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(items.map(i => i.category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid="shop-page">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl text-deep-navy mb-4">Wellness Shop</h1>
          <p className="text-deep-navy/60 max-w-2xl mx-auto text-lg">
            Curated products to support your wellness journey
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-navy/40" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 rounded-full bg-white border-border"
              data-testid="shop-search-input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-6 ${selectedCategory === cat ? 'bg-terracotta hover:bg-terracotta/90' : 'hover:bg-cream'}`}
                onClick={() => setSelectedCategory(cat)}
                data-testid={`shop-filter-${cat.toLowerCase()}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-deep-navy/20 mx-auto mb-4" />
            <p className="text-deep-navy/60 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <Link 
                key={item.item_id} 
                to={`/shop/${item.item_id}`}
                className="group"
                data-testid={`shop-item-${index}`}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-deep-navy/5 card-hover">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="category-badge">{item.category}</span>
                    </div>
                    {item.stock <= 5 && item.stock > 0 && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-sun text-deep-navy text-xs px-2 py-1 rounded-full">
                          Only {item.stock} left
                        </span>
                      </div>
                    )}
                    {item.stock === 0 && (
                      <div className="absolute inset-0 bg-deep-navy/50 flex items-center justify-center">
                        <span className="bg-white text-deep-navy px-4 py-2 rounded-full font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-heading text-lg text-deep-navy mb-2 group-hover:text-terracotta transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-deep-navy/60 text-sm line-clamp-2 mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-heading text-deep-navy">${item.price.toFixed(2)}</span>
                      <Button 
                        size="sm"
                        className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full"
                        disabled={item.stock === 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        View
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

export default ShopPage;
