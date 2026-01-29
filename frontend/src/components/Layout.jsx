import Navbar from './Navbar';

export const Layout = ({ children, auth }) => {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar auth={auth} />
      <main className="pt-20">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-deep-navy text-white py-12 mt-16" data-testid="footer">
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
                Your journey to mental wellness starts here. Premium courses and resources for personal growth.
              </p>
            </div>
            
            <div>
              <h4 className="font-heading text-lg mb-4">Explore</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><a href="/videos" className="hover:text-terracotta transition-colors">Video Courses</a></li>
                <li><a href="/blog" className="hover:text-terracotta transition-colors">Blog</a></li>
                <li><a href="/dashboard" className="hover:text-terracotta transition-colors">Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading text-lg mb-4">Categories</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li>Meditation</li>
                <li>Mental Health</li>
                <li>Personal Growth</li>
                <li>Wellness</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading text-lg mb-4">Connect</h4>
              <p className="text-white/70 text-sm mb-4">
                Join our community for weekly wellness tips and exclusive content.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm flex-1"
                />
                <button className="px-4 py-2 rounded-full bg-terracotta hover:bg-terracotta/90 text-white text-sm font-medium">
                  Join
                </button>
              </div>
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
