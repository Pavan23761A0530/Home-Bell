import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { checkUserLoggedIn } = useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { email, password } = formData;

    // Extract values for form
    const emailValue = formData.email;
    const passwordValue = formData.password;

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/admin/auth/login', { email, password });

            if (res.data.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                delete api.defaults.headers.Authorization;
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                api.defaults.headers.Authorization = `Bearer ${res.data.token}`;

                await checkUserLoggedIn();

                toast.success('Admin Access Granted');
                navigate('/admin/dashboard', { replace: true });
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Admin access denied';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/50">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Admin Portal
                </h2>
                <p className="mt-2 text-center text-sm text-neutral-400">
                    Restricted Access Area
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="bg-neutral-800 border-neutral-700 shadow-2xl">
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div>
                            <Input
                                label="Admin Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={onChange}
                                required
                                className="bg-neutral-900 border-neutral-600 text-white focus:border-primary-500 focus:ring-primary-500 placeholder-neutral-500"
                                labelClassName="text-neutral-300"
                            />
                        </div>

                        <div>
                            <div className="relative">
                                <Input
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={onChange}
                                    required
                                    className="bg-neutral-900 border-neutral-600 text-white focus:border-primary-500 focus:ring-primary-500 placeholder-neutral-500 pr-12"
                                    labelClassName="text-neutral-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-neutral-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 font-semibold shadow-lg shadow-primary-900/30"
                            >
                                <Lock size={18} className="mr-2" /> Authenticate
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-600" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-neutral-800 text-neutral-500">
                                    Secure Connection
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="mt-8 text-center">
                    <div className="inline-flex items-center p-3 rounded-lg bg-red-900/20 text-red-400 border border-red-900/50">
                        <AlertTriangle size={20} className="mr-2" />
                        <span className="text-xs font-medium">Unauthorized access attempts are logged.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
