import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API } from '@/App';

const ResetPassword = ({ auth }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.message);
      if (error.message.includes('expired') || error.message.includes('Invalid')) {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-8" data-testid="reset-password-error">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-heading text-3xl text-deep-navy">Invalid Reset Link</h1>
          <p className="text-deep-navy/60">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8">
              Request New Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-8" data-testid="reset-password-success">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-sage/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-sage" />
          </div>
          <h1 className="font-heading text-3xl text-deep-navy">Password Reset!</h1>
          <p className="text-deep-navy/60">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Link to="/login">
            <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8" data-testid="reset-password-page">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center">
              <span className="text-white font-heading font-bold">W</span>
            </div>
            <span className="font-heading text-2xl text-deep-navy">WellnessHub</span>
          </Link>
          <h1 className="font-heading text-3xl text-deep-navy mb-2">Reset Password</h1>
          <p className="text-deep-navy/60">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="reset-password-form">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-deep-navy">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-navy/40" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 py-6 rounded-xl bg-white border-border"
                required
                minLength={6}
                data-testid="reset-password-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-deep-navy">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-navy/40" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 py-6 rounded-xl bg-white border-border"
                required
                minLength={6}
                data-testid="reset-confirm-input"
              />
            </div>
            <p className="text-xs text-deep-navy/50">Must be at least 6 characters</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-6 text-lg"
            data-testid="reset-submit-btn"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
