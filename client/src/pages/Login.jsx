import { useState } from 'react';
import bgImage from '../assets/repairing.jpg';
import callingBellImg from '../assets/callingbell.png';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Briefcase, Shield, Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('customer'); // Default to customer
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // No default redirect - role-based navigation only

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const registrationMessage = location.state?.fromRegister
        ? location.state.email
            ? `Account created for ${location.state.email}. Please log in to continue.`
            : 'Account created successfully. Please log in to continue.'
        : '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const toastId = toast.loading('Logging in...');

        try {
            const result = await login(email, password);
            if (result?.otpRequired) {
                toast.success('OTP sent to your email', { id: toastId });
                sessionStorage.setItem('pending_email', email);
                navigate('/otp-verify', { replace: true, state: { email } });
                setLoading(false);
                return;
            }
            const userData = result;
            toast.success('Welcome back!', { id: toastId });

            const selectedRole = role;
            const backendRoleRaw = userData?.role;
            const backendRole = backendRoleRaw === 'user' ? 'customer' : backendRoleRaw;

            if (!backendRole || backendRole !== selectedRole) {
                setError('Invalid credentials');
                toast.error('Invalid credentials', { id: toastId });
                setLoading(false);
                return;
            }
            
            const userRole = backendRole;
            
            // Strict role-based navigation using backend role only
            if (userRole === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (userRole === 'provider') {
                navigate('/provider/dashboard', { replace: true });
            } else if (userRole === 'worker') {
                navigate('/worker/dashboard', { replace: true });
            } else if (userRole === 'user' || userRole === 'customer') {
                navigate('/dashboard', { replace: true });
            } else {
                // Invalid role - redirect to login
                navigate('/login', { replace: true });
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to login', { id: toastId });
            setError(err.response?.data?.error || 'Failed to login');
            setLoading(false);
        }
    };

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
            {/* Left Side - Image/Brand */}
            <div
                className="flex w-full lg:w-1/2 relative overflow-hidden"
                style={{
                    backgroundImage: `url(${callingBellImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
                <div className="relative z-20 flex flex-col justify-between p-16 h-full text-white">
                    <div>
                        <h1 className="text-4xl font-bold font-display tracking-tight text-white drop-shadow-lg">Home Bell</h1>
                        <p className="mt-2">Premium Home Services</p>
                    </div>

                    <div>
                        <blockquote className="text-2xl font-light italic mb-6">
                            "The easiest way to find reliable professionals for my home renovation projects."
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">SJ</div>
                            <div>
                                <p className="font-semibold">Kommoju Pavan Kumar Ganesh</p>
                                <p className="text-sm">Homeowner, New York</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Welcome back</h2>
                        <p className="mt-2 text-neutral-500">
                            Please enter your details to access your account.
                        </p>
                    </div>

                    {/* Role Toggle */}
                    <div className="flex bg-neutral-100 rounded-xl p-1">
                        <button
                            onClick={() => handleRoleSelect('customer')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${role === 'customer'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <User size={18} />
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('provider')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${role === 'provider'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <Briefcase size={18} />
                            Provider
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('admin')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${role === 'admin'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <Shield size={18} />
                            Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('worker')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${role === 'worker'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <Briefcase size={18} />
                            Worker
                        </button>
                    </div>

                    {registrationMessage && (
                        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg text-sm">
                            {registrationMessage}
                        </div>
                    )}

                    {error && (
                        <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <Input
                                label="Email address"
                                type="email"
                                icon={Mail}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <div>
                                <div className="relative">
                                    <Input
                                        label="Password"
                                        type={showPassword ? "text" : "password"}
                                        icon={Lock}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full justify-center py-3 text-base shadow-lg shadow-primary-600/20"
                            isLoading={loading}
                        >
                            Sign in <ArrowRight size={18} className="ml-2" />
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-500 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 hover:underline">
                                Create free account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-neutral-100 text-center">
                        <p className="text-xs text-neutral-400">
                            By clicking continue, you agree to our{' '}
                            <a href="#" className="underline hover:text-neutral-500">Terms of Service</a> and{' '}
                            <a href="#" className="underline hover:text-neutral-500">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
