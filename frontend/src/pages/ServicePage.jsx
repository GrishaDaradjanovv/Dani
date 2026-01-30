import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { API } from '@/App';

const ServicePage = ({ auth, pageId }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`${API}/pages/${pageId}`);
      if (response.ok) {
        const data = await response.json();
        setPage(data);
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout auth={auth}>
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-muted rounded-3xl" />
            <div className="h-12 bg-muted rounded w-1/2" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout auth={auth}>
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="font-heading text-3xl text-deep-navy mb-4">Page Not Found</h1>
          <Link to="/">
            <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full">
              Go Home
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const renderContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="font-heading text-2xl text-deep-navy mt-8 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 text-deep-navy/70 mb-2">{line.slice(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-deep-navy/70 leading-relaxed mb-4">{line}</p>;
    });
  };

  return (
    <Layout auth={auth}>
      <div className="container mx-auto px-6 py-8" data-testid={`service-page-${pageId}`}>
        {/* Hero Section */}
        <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden mb-12">
          <img
            src={page.image_url}
            alt={page.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-navy/70 to-transparent flex items-center">
            <div className="p-8 md:p-12 max-w-2xl text-white">
              <h1 className="font-heading text-3xl md:text-5xl mb-4" data-testid="page-title">
                {page.title}
              </h1>
              <p className="text-white/90 text-lg md:text-xl">
                {page.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-deep-navy/5">
              <div className="prose max-w-none" data-testid="page-content">
                {renderContent(page.content)}
              </div>
            </div>
          </div>

          {/* Sidebar with Features */}
          <div className="space-y-6">
            {page.features && page.features.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-deep-navy/5">
                <h3 className="font-heading text-xl text-deep-navy mb-6">Why Choose Us</h3>
                <div className="space-y-4">
                  {page.features.map((feature, index) => (
                    <div key={index} className="flex gap-3" data-testid={`feature-${index}`}>
                      <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-sage" />
                      </div>
                      <div>
                        <h4 className="font-medium text-deep-navy">{feature.title}</h4>
                        <p className="text-sm text-deep-navy/60">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Card */}
            <div className="bg-terracotta rounded-3xl p-6 text-white">
              <h3 className="font-heading text-xl mb-3">Ready to Get Started?</h3>
              <p className="text-white/80 mb-6 text-sm">
                Book a consultation or explore our courses to begin your wellness journey.
              </p>
              <div className="space-y-3">
                <Link to="/videos" className="block">
                  <Button className="w-full bg-white text-terracotta hover:bg-white/90 rounded-full">
                    View Courses
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/shop" className="block">
                  <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 rounded-full">
                    Browse Shop
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServicePage;
