// FILE: client/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext';
import { securityAPI } from '../services/api';

function Dashboard({ addAlert }) {
    const { user } = useAuth();
    const { statistics } = useSecurity();
    const [activityLog, setActivityLog] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [logsRes, statsRes] = await Promise.all([
                securityAPI.getActivityLogs(),
                securityAPI.getStatistics()
            ]);

            setActivityLog(logsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPermissionDescription = (role) => {
        const descriptions = {
            Admin: 'You have full access to all features and can manage users',
            Moderator: 'You can moderate content and manage basic users',
            User: 'You have standard access to use all basic features',
            Guest: 'You have read-only access to view content'
        };
        return descriptions[role] || 'Standard access';
    };

    const statCards = [
        {
            title: 'Attacks Blocked',
            value: stats?.attacks_blocked || statistics.attacksBlocked || 0,
            description: 'Harmful attempts stopped',
            icon: '🛡️',
            color: 'green'
        },
        {
            title: 'Successful Logins',
            value: stats?.successful_logins || 0,
            description: 'Authorized access',
            icon: '✓',
            color: 'blue'
        },
        {
            title: 'Failed Attempts',
            value: stats?.failed_logins || 0,
            description: 'Invalid login tries',
            icon: '⚠',
            color: 'amber'
        },
        {
            title: 'Total Users',
            value: stats?.total_users || 0,
            description: 'Registered accounts',
            icon: '👥',
            color: 'indigo'
        }
    ];

    if (loading) {
        return (
            <div className="container-wide py-8">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="spinner mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading your dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-b from-gray-50 to-white py-8 border-b border-gray-100">
                <div className="container-wide">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Welcome back, {user.username}!
                            </h1>
                            <p className="text-gray-600">
                                Here's an overview of your security dashboard
                            </p>
                        </div>
                        <div className={`badge badge-${user.role === 'Admin' ? 'danger' : user.role === 'Moderator' ? 'warning' : 'primary'}`}>
                            {user.role} Account
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-wide py-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <div key={index} className="card hover-lift">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-3xl">{stat.icon}</span>
                                    <span className={`text-3xl font-bold text-${stat.color}-600`}>
                                        {stat.value}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900">{stat.title}</h3>
                                <p className="text-sm text-gray-500">{stat.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Account Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="card">
                            <div className="p-6">
                                <h2 className="font-semibold mb-4">Your Account</h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Username</p>
                                        <p className="font-medium">{user.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account ID</p>
                                        <p className="font-mono text-sm text-gray-600">#{user.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Access Level</p>
                                        <p className="text-sm">{getPermissionDescription(user.role)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="card">
                            <div className="p-6">
                                <h2 className="font-semibold mb-4">Quick Actions</h2>
                                <div className="space-y-2">
                                    <a href="/playground" className="block w-full btn-secondary text-center">
                                        Try Security Tests
                                    </a>
                                    <button className="w-full btn-secondary">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-semibold">Recent Activity</h2>
                                    <button className="text-sm text-indigo-600 hover:text-indigo-500">
                                        View all →
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-clean">
                                    {activityLog.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <p>No recent activity to show</p>
                                            <p className="text-sm mt-2">Your actions will appear here</p>
                                        </div>
                                    ) : (
                                        activityLog.slice(0, 10).map((activity, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${activity.status === 'success' ? 'bg-green-500' :
                                                    activity.status === 'failed' ? 'bg-red-500' :
                                                        activity.status === 'blocked' ? 'bg-amber-500' :
                                                            'bg-blue-500'
                                                    }`} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {activity.action}
                                                    </p>
                                                    {activity.details && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {activity.details}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(activity.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${activity.status === 'success' ? 'bg-green-100 text-green-700' :
                                                    activity.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        activity.status === 'blocked' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Help Section */}
                <div className="card-flat p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Need Help?</h2>
                    <p className="text-gray-600 mb-4">
                        Learn more about web security or get support with your account
                    </p>
                    <div className="flex gap-3 justify-center">
                        <a href="/playground" className="btn-primary">
                            Try Security Tests
                        </a>
                        <button className="btn-secondary">
                            Get Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;