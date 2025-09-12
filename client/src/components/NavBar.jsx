// =====================================
// FILE: client/src/components/Navbar.jsx (SIMPLIFIED VERSION)
// =====================================
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
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
            <div className="container-wide">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span className="text-xl font-semibold text-gray-900">SecureLearn</span>
                        </Link>

                        {/* Desktop Navigation */}
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
                                Try It Yourself
                            </Link>
                            {user && (
                                <Link
                                    to="/dashboard"
                                    className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`}
                                >
                                    My Dashboard
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

                    {/* Desktop User Menu */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                    <p className="text-xs text-gray-500">{user.role} Account</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn-secondary text-sm"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="md:hidden py-4 border-t border-gray-100">
                        <div className="flex flex-col gap-2">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/playground" className="nav-link">Try It Yourself</Link>
                            {user && <Link to="/dashboard" className="nav-link">My Dashboard</Link>}
                            {user ? (
                                <button onClick={handleLogout} className="nav-link text-left">Sign Out</button>
                            ) : (
                                <>
                                    <Link to="/login" className="nav-link">Sign In</Link>
                                    <Link to="/register" className="nav-link">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;