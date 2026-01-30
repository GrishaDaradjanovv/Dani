import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, BookOpen, Video, LayoutDashboard, ShoppingBag, Shield, Mic, Heart, UserCircle, Flower2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Sidebar navigation items
const sidebarItems = [
  { id: 'speech-therapist', label: 'Speech Therapist', icon: Mic, path: '/services/speech-therapist' },
  { id: 'womens-circle-rose', label: "Women's Circle Rose", icon: Heart, path: '/services/womens-circle-rose' },
  { id: 'bio', label: 'About Me', icon: UserCircle, path: '/services/bio' },
  { id: 'bach-flowers', label: 'Dr. Bach Flowers', icon: Flower2, path: '/services/bach-flowers' },
  { id: 'psychology', label: 'Psychology', icon: Brain, path: '/services/psychology' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-deep-navy/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:shadow-lg`}
        data-testid="sidebar"
      >
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center">
              <span className="text-white font-heading font-bold">W</span>
            </div>
            <span className="font-heading text-xl text-deep-navy">WellnessHub</span>
          </Link>
        </div>
        
        <nav className="p-4">
          <p className="text-xs font-medium text-deep-navy/50 uppercase tracking-wider mb-4 px-3">Services</p>
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-terracotta/10 text-terracotta' 
                        : 'text-deep-navy/70 hover:bg-cream hover:text-deep-navy'
                    }`}
                    data-testid={`sidebar-${item.id}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <div className="border-t border-border my-6" />
          
          <p className="text-xs font-medium text-deep-navy/50 uppercase tracking-wider mb-4 px-3">Quick Links</p>
          <ul className="space-y-1">
            <li>
              <Link
                to="/videos"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  location.pathname === '/videos' ? 'bg-terracotta/10 text-terracotta' : 'text-deep-navy/70 hover:bg-cream hover:text-deep-navy'
                }`}
              >
                <Video className="w-5 h-5" />
                <span className="font-medium">Courses</span>
              </Link>
            </li>
            <li>
              <Link
                to="/blog"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  location.pathname === '/blog' ? 'bg-terracotta/10 text-terracotta' : 'text-deep-navy/70 hover:bg-cream hover:text-deep-navy'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Blog</span>
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  location.pathname === '/shop' ? 'bg-terracotta/10 text-terracotta' : 'text-deep-navy/70 hover:bg-cream hover:text-deep-navy'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="font-medium">Shop</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export const Navbar = ({ auth, onMenuClick }) => {
  const navigate = (path) => window.location.href = path;

  const handleLogout = async () => {
    await auth.logout();
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-4 left-4 right-4 z-30 glass-nav rounded-full px-6 py-3 shadow-lg lg:left-80" data-testid="navbar">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-cream"
          onClick={onMenuClick}
          data-testid="mobile-menu-toggle"
        >
          <Menu className="w-6 h-6 text-deep-navy" />
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/videos" className="text-deep-navy hover:text-terracotta transition-colors font-medium" data-testid="nav-videos">
            Courses
          </Link>
          <Link to="/blog" className="text-deep-navy hover:text-terracotta transition-colors font-medium" data-testid="nav-blog">
            Blog
          </Link>
          <Link to="/shop" className="text-deep-navy hover:text-terracotta transition-colors font-medium" data-testid="nav-shop">
            Shop
          </Link>
          
          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-deep-navy hover:text-terracotta transition-colors font-medium" data-testid="nav-dropdown-trigger">
                Services <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white shadow-xl border-0 rounded-xl p-2" data-testid="nav-dropdown-content">
              {sidebarItems.map((item) => (
                <DropdownMenuItem key={item.id} asChild>
                  <Link to={item.path} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream cursor-pointer">
                    <item.icon className="w-4 h-4 text-terracotta" />
                    <span className="font-medium text-deep-navy">{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {auth.loading ? (
            <div className="w-20 h-10 bg-muted rounded-full animate-pulse" />
          ) : auth.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-cream hover:bg-sun/30 transition-colors" data-testid="user-menu-trigger">
                  <User className="w-4 h-4 text-deep-navy" />
                  <span className="text-deep-navy font-medium text-sm hidden sm:block">{auth.user.name?.split(' ')[0]}</span>
                  {auth.user.is_admin && (
                    <Shield className="w-3 h-3 text-terracotta" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white shadow-xl border-0 rounded-xl p-2" data-testid="user-menu-content">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {auth.user.is_admin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream cursor-pointer">
                      <Shield className="w-4 h-4 text-terracotta" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer text-red-600" data-testid="logout-btn">
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-deep-navy hover:text-terracotta" data-testid="login-btn">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-6" data-testid="signup-btn">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export const Layout = ({ children, auth, showSidebar = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <Navbar auth={auth} onMenuClick={() => setSidebarOpen(true)} />
      <main className={`pt-20 ${showSidebar ? 'lg:ml-72' : ''}`}>
        {children}
      </main>
      
      {/* Footer */}
      <footer className={`bg-deep-navy text-white py-12 mt-16 ${showSidebar ? 'lg:ml-72' : ''}`} data-testid="footer">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
                  <span className="text-white font-heading font-bold text-sm">W</span>
                </div>
                <span className="font-heading text-xl">WellnessHub</span>
              </div>
              <p className="text-white/70 text-sm">
                Your journey to mental wellness starts here.
              </p>
            </div>
            
            <div>
              <h4 className="font-heading text-lg mb-4">Services</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                {sidebarItems.map(item => (
                  <li key={item.id}>
                    <Link to={item.path} className="hover:text-terracotta transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading text-lg mb-4">Explore</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link to="/videos" className="hover:text-terracotta transition-colors">Video Courses</Link></li>
                <li><Link to="/blog" className="hover:text-terracotta transition-colors">Blog</Link></li>
                <li><Link to="/shop" className="hover:text-terracotta transition-colors">Shop</Link></li>
                <li><Link to="/dashboard" className="hover:text-terracotta transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading text-lg mb-4">Connect</h4>
              <p className="text-white/70 text-sm mb-4">
                Join our community for wellness tips.
              </p>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
            <p>&copy; {new Date().getFullYear()} WellnessHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
