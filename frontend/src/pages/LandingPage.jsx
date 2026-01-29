import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Users, Sparkles, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const LandingPage = ({ auth }) => {
  return (
    <Layout auth={auth}>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center hero-gradient overflow-hidden" data-testid="hero-section">
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sun/30 text-deep-navy text-sm font-medium">
                <Sparkles className="w-4 h-4 text-terracotta" />
                Transform your mind, transform your life
              </div>
              
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-deep-navy tracking-tight leading-tight">
                Your Path to <span className="text-terracotta">Inner Peace</span> Starts Here
              </h1>
              
              <p className="text-lg text-deep-navy/70 max-w-lg leading-relaxed">
                Access premium video courses on mindfulness, anxiety management, and personal growth. 
                Join thousands transforming their mental wellness journey.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/videos">
                  <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-terracotta/20 group" data-testid="hero-cta">
                    Explore Courses
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/blog">
                  <Button variant="outline" className="rounded-full px-8 py-6 text-lg border-deep-navy/20 text-deep-navy hover:bg-deep-navy/5" data-testid="hero-blog-cta">
                    Read Free Content
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center text-white text-sm font-medium border-2 border-cream">A</div>
                  <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white text-sm font-medium border-2 border-cream">B</div>
                  <div className="w-10 h-10 rounded-full bg-sun flex items-center justify-center text-deep-navy text-sm font-medium border-2 border-cream">C</div>
                </div>
                <p className="text-sm text-deep-navy/70">
                  <span className="font-semibold text-deep-navy">2,500+</span> students already enrolled
                </p>
              </div>
            </div>
            
            <div className="relative hidden lg:block animate-fade-in stagger-2">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1632653859951-7d52ea5498ef?w=800" 
                  alt="Woman meditating peacefully"
                  className="rounded-3xl shadow-2xl shadow-deep-navy/10 w-full object-cover aspect-[4/5]"
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-sage fill-sage" />
                    </div>
                    <div>
                      <p className="font-heading text-deep-navy">6 Premium Courses</p>
                      <p className="text-sm text-deep-navy/60">20+ hours of content</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-sun/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-sage/10 rounded-full blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" data-testid="features-section">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl text-deep-navy mb-4">Why Choose WellnessHub?</h2>
            <p className="text-deep-navy/60 max-w-2xl mx-auto">
              Our platform offers comprehensive resources for your mental wellness journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Play,
                title: "Premium Video Courses",
                description: "Expert-led courses covering meditation, anxiety management, sleep improvement, and more.",
                color: "terracotta"
              },
              {
                icon: BookOpen,
                title: "Free Blog Content",
                description: "Access our library of articles on wellness tips, mental health strategies, and personal growth.",
                color: "sage"
              },
              {
                icon: Users,
                title: "Supportive Community",
                description: "Connect with others on similar journeys. Share experiences and grow together.",
                color: "sun"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-cream/50 rounded-3xl p-8 card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`feature-card-${index}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}/20 flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}`} />
                </div>
                <h3 className="font-heading text-xl text-deep-navy mb-3">{feature.title}</h3>
                <p className="text-deep-navy/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-cream" data-testid="benefits-section">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="font-heading text-3xl sm:text-4xl text-deep-navy">
                Transform Your Mental Wellbeing
              </h2>
              
              <div className="space-y-6">
                {[
                  { icon: Heart, title: "Reduce Stress & Anxiety", desc: "Learn proven techniques to calm your mind" },
                  { icon: Shield, title: "Build Resilience", desc: "Develop mental strength for life's challenges" },
                  { icon: Sparkles, title: "Improve Sleep Quality", desc: "Wake up refreshed and energized" }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4 items-start" data-testid={`benefit-${index}`}>
                    <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-terracotta" />
                    </div>
                    <div>
                      <h4 className="font-heading text-lg text-deep-navy mb-1">{benefit.title}</h4>
                      <p className="text-deep-navy/60">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to={auth.user ? "/videos" : "/register"}>
                <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 py-6 text-lg shadow-lg shadow-terracotta/20" data-testid="benefits-cta">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1758272134196-1ab895629bce?w=800"
                alt="Happy diverse friends"
                className="rounded-3xl shadow-2xl shadow-deep-navy/10 w-full object-cover aspect-square"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-deep-navy" data-testid="cta-section">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl text-white mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-8">
            Join thousands of people who have already started their wellness journey with us.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 py-6 text-lg" data-testid="cta-signup">
                Create Free Account
              </Button>
            </Link>
            <Link to="/videos">
              <Button variant="outline" className="rounded-full px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10" data-testid="cta-browse">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
