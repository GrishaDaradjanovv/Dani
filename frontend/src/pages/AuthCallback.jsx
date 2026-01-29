import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '@/App';

const AuthCallback = ({ auth }) => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL hash
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          navigate('/login');
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for app session
        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const userData = await response.json();
        auth.login(userData);
        
        // Clear hash and navigate to dashboard
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/dashboard', { replace: true, state: { user: userData } });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-terracotta/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-terracotta" />
        </div>
        <p className="text-deep-navy font-heading text-xl">Completing sign in...</p>
        <p className="text-deep-navy/60 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
};

export default AuthCallback;
