// =====================================
// FILE: client/src/components/ProtectedRoute.jsx (REFINED VERSION)
// =====================================
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole) {
        const roleHierarchy = {
            'Guest': 0,
            'User': 1,
            'Moderator': 2,
            'Admin': 3
        };

        if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
            return (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You need <span className="font-medium">{requiredRole}</span> privileges to access this page.
                    </p>
                    <a href="/" className="btn-primary">
                        Return to Home
                    </a>
                </div>
            );
        }
    }

    return children;
}

export default ProtectedRoute;