import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage({ addAlert }) {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData.username, formData.password);

        if (result.success) {
            addAlert('Welcome back!', 'success');
            setTimeout(() => navigate('/dashboard'), 500);
        } else {
            addAlert(result.message || 'Invalid username or password', 'error');
        }

        setLoading(false);
    };

    const quickLogin = (username, password) => {
        setFormData({ username, password });
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-papaya_whip-50 to-ash_gray-50">
            <div className="w-full max-w-md animate-fade-in">
                {/* Enhanced Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-dark_purple-500 to-raspberry-500 rounded-3xl mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-dark_purple-500 mb-3 text-display">Welcome Back</h1>
                    <p className="text-gray-600 text-lg">Sign in to access your security dashboard</p>
                </div>

                {/* Enhanced Form */}
                <div className="card-premium shadow-premium">
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="input-group">
                                <label htmlFor="username" className="input-label">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter your username"
                                    disabled={loading}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="password" className="input-label">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input-field pr-12"
                                        placeholder="Enter your password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="spinner w-5 h-5"></div>
                                        Signing In...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Sign In
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-ash_gray-200">
                            <p className="text-center text-sm text-gray-600 mb-4">
                                Don't have an account?
                            </p>
                            <Link
                                to="/register"
                                className="w-full btn-secondary text-center block"
                            >
                                Create New Account
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Enhanced Demo Accounts */}
                <div className="mt-8 p-6 bg-gradient-to-br from-papaya_whip-100 to-ash_gray-100 rounded-3xl border border-ash_gray-200">
                    <p className="text-sm text-dark_purple-600 text-center mb-4 font-semibold text-display">
                        Quick Demo Access
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => quickLogin('user', 'user123')}
                            disabled={loading}
                            className="p-4 bg-white rounded-2xl border border-ash_gray-200 hover:border-ash_gray-300 hover:bg-ash_gray-25 transition-all text-sm shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 bg-ash_gray-500 rounded-full"></div>
                                <span className="font-semibold text-dark_purple-500">Basic User</span>
                            </div>
                            <span className="text-xs text-gray-500">Standard access level</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => quickLogin('admin', 'admin123')}
                            disabled={loading}
                            className="p-4 bg-white rounded-2xl border border-raspberry-200 hover:border-raspberry-300 hover:bg-raspberry-25 transition-all text-sm shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 bg-raspberry-500 rounded-full"></div>
                                <span className="font-semibold text-dark_purple-500">Administrator</span>
                            </div>
                            <span className="text-xs text-gray-500">Full system access</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;