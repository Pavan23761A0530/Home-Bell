import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Helper to decode JWT (simple version)
const decodeToken = (token) => {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Token decoding failed', e);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const mergeProviderFields = async (baseUser) => {
        try {
            if (baseUser?.role === 'provider') {
                const profRes = await api.get('/providers/me');
                if (profRes.data?.success) {
                    const p = profRes.data.data;
                    return {
                        ...baseUser,
                        name: p.user?.name || baseUser.name,
                        profileImage: p.profileImage || baseUser.profileImage
                    };
                }
            }
        } catch (e) {
            // Ignore enrichment failures; keep base user
        }
        return baseUser;
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUserRaw = localStorage.getItem('user');
            if (storedUserRaw) {
                try {
                    const storedUser = JSON.parse(storedUserRaw);
                    setUser(storedUser);
                } catch {}
            }

            if (token) {
                try {
                    api.defaults.headers.Authorization = `Bearer ${token}`;

                    const decoded = decodeToken(token);
                    if (decoded) {
                        setUser({
                            id: decoded.id,
                            role: decoded.role
                        });
                    }

                    const response = await api.get('/auth/me');
                    if (response.data.success) {
                        const apiUser = response.data.data;
                        let normalizedUser = {
                            ...apiUser,
                            id: apiUser.id || apiUser._id
                        };
                        normalizedUser = await mergeProviderFields(normalizedUser);
                        setUser(normalizedUser);
                        localStorage.setItem('user', JSON.stringify(normalizedUser));
                    } else {
                        throw new Error('Verification failed');
                    }
                } catch (error) {
                    console.error('Auth initialization failed', error);
                    const status = error?.response?.status;
                    if (status === 401) {
                        handleAuthError();
                    } else {
                        // Keep existing user from localStorage and Authorization header
                        // Do not force logout on non-auth errors
                    }
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const handleAuthError = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.Authorization;
    };

    const checkUserLoggedIn = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.success) {
                const apiUser = res.data.data;
                let normalizedUser = {
                    ...apiUser,
                    id: apiUser.id || apiUser._id
                };
                normalizedUser = await mergeProviderFields(normalizedUser);
                setUser(normalizedUser);
                localStorage.setItem('user', JSON.stringify(normalizedUser));
                return normalizedUser;
            }
        } catch (error) {
            console.error("Auth check failed", error);
            handleAuthError();
        }
    };

    const login = async (email, password) => {
        // Clear old session data before storing new login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.Authorization;

        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
            if (res.data.otpRequired) {
                return { otpRequired: true, email };
            }
            const token = res.data.token;

            if (token) {
                localStorage.setItem('token', token);
                api.defaults.headers.Authorization = `Bearer ${token}`;
            }

            // Fetch full user profile from backend (ensures profileImage/name are up-to-date)
            const refreshed = await checkUserLoggedIn();
            return refreshed;
        } else {
            throw new Error(res.data.error || 'Login failed');
        }
    };

    const register = async (userData) => {
        const res = await api.post('/auth/register', userData);
        if (res.data.success) {
            if (res.data.otpRequired) {
                return { otpRequired: true, email: userData.email };
            }
            return res.data.user;
        } else {
            throw new Error(res.data.error || 'Registration failed');
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        handleAuthError();
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, checkUserLoggedIn }}>
            {!loading ? children : null}
        </AuthContext.Provider>
    );
};
