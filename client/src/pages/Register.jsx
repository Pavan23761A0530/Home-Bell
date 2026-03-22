import { useState } from 'react';
import bgImage from '../assets/repairing.jpg';
import callingBellImg from '../assets/callingbell.png';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, ArrowRight, UserCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer'
    });
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const toastId = toast.loading('Creating your account...');

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };
            const result = await register(payload);
            if (result?.otpRequired) {
                toast.success('OTP sent to your email. Verify to continue.', { id: toastId });
                sessionStorage.setItem('pending_email', formData.email);
                setLoading(false);
                navigate('/otp-verify', { replace: true, state: { email: formData.email } });
            } else {
                toast.success('Account created successfully! Please log in to continue.', { id: toastId });
                setLoading(false);
                navigate('/login', {
                    replace: true,
                    state: { fromRegister: true, email: formData.email }
                });
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || err.message || 'Failed to register', { id: toastId });
            setError(err.response?.data?.error || err.message || 'Failed to register');
            setLoading(false);
        }
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
                        <h1 className="text-4xl font-bold font-display tracking-tight text-white drop-shadow-lg">Join Home Bell</h1>
                        <p className="mt-2">Where Service Meets Excellence</p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary-400">
                                <UserCheck size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Verified Professionals</h3>
                                <p className="text-neutral-400 text-sm">Every provider passes our 5-point background check.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-success-400">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Secure Payments</h3>
                                <p className="text-neutral-400 text-sm">We hold funds in escrow until the job is done.</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm">© 2024 Home Bell Inc. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 overflow-y-auto" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Create your account</h2>
                        <p className="mt-2 text-neutral-500">
                            Join thousands of users and get premium home services.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">I am looking to:</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => handleRoleSelect('customer')}
                                    className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'customer'
                                            ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500'
                                            : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-600'
                                        }`}
                                >
                                    <User size={24} />
                                    <span className="font-medium text-sm">Hire a Pro</span>
                                </div>
                                <div
                                    onClick={() => handleRoleSelect('provider')}
                                    className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'provider'
                                            ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500'
                                            : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-600'
                                        }`}
                                >
                                    <Briefcase size={24} />
                                    <span className="font-medium text-sm">Find Work</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                name="name"
                                type="text"
                                icon={User}
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Email address"
                                name="email"
                                type="email"
                                icon={Mail}
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                icon={Lock}
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full justify-center py-3 text-base shadow-lg shadow-primary-600/20"
                            isLoading={loading}
                        >
                            Create Account <ArrowRight size={18} className="ml-2" />
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-500 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 hover:underline">
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
