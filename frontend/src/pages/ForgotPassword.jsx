import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API } from '@/App';

const ForgotPassword = ({ auth }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setSent(true);
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-8" data-testid="forgot-password-success">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-sage/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-sage" />
          </div>
          <h1 className="font-heading text-3xl text-deep-navy">Check Your Email</h1>
          <p className="text-deep-navy/60">
            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            Please check your inbox and spam folder.
          </p>
          <p className="text-sm text-deep-navy/50">
            The link will expire in 1 hour.
          </p>
          <Link to="/login">
            <Button variant="outline" className="rounded-full px-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-8" data-testid="forgot-password-page">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center">
              <span className="text-white font-heading font-bold">W</span>
            </div>
            <span className="font-heading text-2xl text-deep-navy">WellnessHub</span>
          </Link>
          <h1 className="font-heading text-3xl text-deep-navy mb-2">Forgot Password?</h1>
          <p className="text-deep-navy/60">Enter your email and we'll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="forgot-password-form">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-deep-navy">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-navy/40" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 py-6 rounded-xl bg-white border-border"
                required
                data-testid="forgot-email-input"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-6 text-lg"
            data-testid="forgot-submit-btn"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <p className="text-center text-deep-navy/60">
          Remember your password?{' '}
          <Link to="/login" className="text-terracotta hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
