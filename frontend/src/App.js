import { useEffect, useState, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AuthCallback from "@/pages/AuthCallback";
import VideoCatalog from "@/pages/VideoCatalog";
import VideoDetail from "@/pages/VideoDetail";
import BlogPage from "@/pages/BlogPage";
import BlogPostDetail from "@/pages/BlogPostDetail";
import Dashboard from "@/pages/Dashboard";
import PaymentSuccess from "@/pages/PaymentSuccess";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth context
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  const checkAuth = async () => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include',
        headers
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
        localStorage.removeItem('auth_token');
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, authToken) => {
    setUser(userData);
    if (authToken) {
      setToken(authToken);
      localStorage.setItem('auth_token', authToken);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { user, loading, login, logout, checkAuth, token };
};

// Protected Route wrapper
const ProtectedRoute = ({ children, auth }) => {
  const location = useLocation();
  
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-deep-navy">Loading...</div>
      </div>
    );
  }

  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function AppRouter() {
  const location = useLocation();
  const auth = useAuth();

  // Check for session_id in URL hash (Google OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback auth={auth} />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage auth={auth} />} />
      <Route path="/login" element={<LoginPage auth={auth} />} />
      <Route path="/register" element={<RegisterPage auth={auth} />} />
      <Route path="/videos" element={<VideoCatalog auth={auth} />} />
      <Route path="/videos/:videoId" element={<VideoDetail auth={auth} />} />
      <Route path="/blog" element={<BlogPage auth={auth} />} />
      <Route path="/blog/:postId" element={<BlogPostDetail auth={auth} />} />
      <Route path="/dashboard" element={
        <ProtectedRoute auth={auth}>
          <Dashboard auth={auth} />
        </ProtectedRoute>
      } />
      <Route path="/payment-success" element={
        <ProtectedRoute auth={auth}>
          <PaymentSuccess auth={auth} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
