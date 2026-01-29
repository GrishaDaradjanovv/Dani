import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, BookOpen, Video, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = ({ auth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 glass-nav rounded-full px-6 py-3 shadow-lg" data-testid="navbar">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">W</span>
          </div>
          <span className="font-heading text-xl text-deep-navy tracking-tight hidden sm:block">WellnessHub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/videos" className="text-deep-navy hover:text-terracotta transition-colors font-medium" data-testid="nav-videos">
            Courses
          </Link>
          <Link to="/blog" className="text-deep-navy hover:text-terracotta transition-colors font-medium" data-testid="nav-blog">
            Blog
          </Link>
          
          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-deep-navy hover:text-terracotta transition-colors font-medium" data-testid="nav-dropdown-trigger">
                Explore <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl border-0 rounded-xl p-2" data-testid="nav-dropdown-content">
              <DropdownMenuItem asChild>
                <Link to="/videos" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream cursor-pointer">
                  <Video className="w-4 h-4 text-terracotta" />
                  <div>
                    <p className="font-medium text-deep-navy">Video Courses</p>
                    <p className="text-xs text-muted-foreground">Premium training content</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/blog" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream cursor-pointer">
                  <BookOpen className="w-4 h-4 text-sage" />
                  <div>
                    <p className="font-medium text-deep-navy">Blog & Articles</p>
                    <p className="text-xs text-muted-foreground">Free wellness content</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              {auth.user && (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 text-sun" />
                    <div>
                      <p className="font-medium text-deep-navy">My Dashboard</p>
                      <p className="text-xs text-muted-foreground">Your purchased courses</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {auth.loading ? (
            <div className="w-20 h-10 bg-muted rounded-full animate-pulse" />
          ) : auth.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-cream hover:bg-sun/30 transition-colors" data-testid="user-menu-trigger">
                  <User className="w-4 h-4 text-deep-navy" />
                  <span className="text-deep-navy font-medium text-sm">{auth.user.name?.split(' ')[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white shadow-xl border-0 rounded-xl p-2" data-testid="user-menu-content">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-cream"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-deep-navy" /> : <Menu className="w-6 h-6 text-deep-navy" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl p-4 animate-fade-in" data-testid="mobile-menu">
          <div className="flex flex-col gap-2">
            <Link to="/videos" className="px-4 py-3 rounded-xl hover:bg-cream text-deep-navy font-medium" onClick={() => setMobileMenuOpen(false)}>
              Courses
            </Link>
            <Link to="/blog" className="px-4 py-3 rounded-xl hover:bg-cream text-deep-navy font-medium" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </Link>
            {auth.user && (
              <Link to="/dashboard" className="px-4 py-3 rounded-xl hover:bg-cream text-deep-navy font-medium" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            )}
            <div className="border-t border-border my-2" />
            {auth.user ? (
              <button onClick={handleLogout} className="px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium text-left">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="px-4 py-3 rounded-xl hover:bg-cream text-deep-navy font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" className="px-4 py-3 rounded-xl bg-terracotta text-white font-medium text-center" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
