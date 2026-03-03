import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { KeyRound, RefreshCcw } from 'lucide-react';

const OTPVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkUserLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  useEffect(() => {
    const pendingEmail = location.state?.email || sessionStorage.getItem('pending_email');
    if (!pendingEmail) {
      navigate('/login', { replace: true });
      return;
    }
    setEmail(pendingEmail);
    sessionStorage.setItem('pending_email', pendingEmail);
  }, [location, navigate]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((t) => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return;
    const toastId = toast.loading('Verifying OTP...');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, code });
      if (res.data.success) {
        sessionStorage.removeItem('pending_email');
        toast.success('Verification successful. Please log in.', { id: toastId });
        navigate('/login', { replace: true, state: { fromRegister: true, email } });
      } else {
        throw new Error(res.data.error || 'Verification failed');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Invalid OTP';
      toast.error(msg, { id: toastId });
      if (/Maximum attempts/.test(msg)) setAttemptsLeft(0);
      else setAttemptsLeft((a) => Math.max(0, a - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    const toastId = toast.loading('Resending OTP...');
    try {
      const res = await api.post('/auth/resend-otp', { email });
      if (res.data.success) {
        toast.success('OTP resent to email', { id: toastId });
        setCooldown(60);
        setAttemptsLeft(3);
      } else {
        throw new Error(res.data.error || 'Failed to resend');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to resend OTP';
      toast.error(msg, { id: toastId });
      const waitMatch = msg.match(/wait (\d+)s/i);
      if (waitMatch) setCooldown(parseInt(waitMatch[1], 10));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-card p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <h1 className="text-2xl font-bold mb-2">Verify Your Account</h1>
        <p className="text-sm text-neutral-500 mb-6">We have sent a 6-digit code to {email}. Enter it below to continue.</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            label="OTP Code"
            type="text"
            icon={KeyRound}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Button type="submit" className="w-full justify-center" isLoading={loading}>
            Verify
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-neutral-500">Attempts left: {attemptsLeft}</div>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className={`flex items-center gap-2 text-sm font-medium ${cooldown > 0 ? 'text-neutral-400' : 'text-primary-600'}`}
          >
            <RefreshCcw size={16} /> {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerify;
