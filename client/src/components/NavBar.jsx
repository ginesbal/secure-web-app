import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-ash_gray-200 sticky top-0 z-50">
            <div className="container-wide">
                <div className="flex items-center justify-between h-16">
                    {/* logo */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-dark_purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-dark_purple-500">SecureLearn</span>
                        </Link>

                        {/* navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            <Link
                                to="/"
                                className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
                            >
                                Home
                            </Link>
                            <Link
                                to="/playground"
                                className={`nav-link ${isActive('/playground') ? 'nav-link-active' : ''}`}
                            >
                                Playground
                            </Link>
                            {user && (
                                <Link
                                    to="/dashboard"
                                    className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`}
                                >
                                    Dashboard
                                </Link>
                            )}
                            {user?.role === 'Admin' && (
                                <Link
                                    to="/admin"
                                    className={`nav-link ${isActive('/admin') ? 'nav-link-active' : ''}`}
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* user menu */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 px-4 py-2 bg-papaya_whip-100 rounded-2xl border border-ash_gray-200">
                                    <div className="w-8 h-8 bg-gradient-to-br from-dark_purple-500 to-raspberry-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-dark_purple-500">{user.username}</p>
                                        <div className="flex items-center gap-1">
                                            <span className={`w-2 h-2 rounded-full ${user.role === 'Admin' ? 'bg-raspberry-500' :
                                                user.role === 'Moderator' ? 'bg-vermilion-500' : 'bg-ash_gray-500'
                                                }`}></span>
                                            <p className="text-xs text-ash_gray-600">{user.role}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn-secondary text-sm"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-sm font-medium text-dark_purple-500 hover:text-dark_purple-600">
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* mobile toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-ash_gray-50"
                    >
                        <svg className="w-6 h-6 text-dark_purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-ash_gray-200">
                        <div className="flex flex-col gap-2">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/playground" className="nav-link">Lab</Link>
                            {user && (
                                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            )}

                            <div className="border-t border-ash_gray-200 pt-2 mt-2">
                                {user ? (
                                    <div className="space-y-2">
                                        <div className="text-sm text-ash_gray-600">
                                            Signed in as {user.username}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="nav-link text-left w-full"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Link to="/login" className="nav-link">Sign In</Link>
                                        <Link to="/register" className="btn-primary text-center">
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;