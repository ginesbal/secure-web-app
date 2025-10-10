import { useEffect, useState } from 'react';
import { securityAPI, userAPI } from '../services/api';

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [securityEvents, setSecurityEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [usersRes, eventsRes] = await Promise.all([
                userAPI.getUsers(),
                securityAPI.getSecurityEvents()
            ]);

            setUsers(usersRes.data);
            setSecurityEvents(eventsRes.data);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-500 bg-red-900/20';
            case 'high': return 'text-orange-500 bg-orange-900/20';
            case 'medium': return 'text-yellow-500 bg-yellow-900/20';
            case 'low': return 'text-blue-500 bg-blue-900/20';
            default: return 'text-gray-500 bg-gray-900/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <span className="px-4 py-2 bg-red-600 rounded-full text-sm font-bold">
                    Administrator Access
                </span>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'users'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Users ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'security'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Security Events ({securityEvents.length})
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Verified
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            #{user.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium">{user.username}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-bold ${user.role === 'Admin' ? 'bg-red-600' :
                                                user.role === 'Moderator' ? 'bg-purple-600' :
                                                    user.role === 'User' ? 'bg-blue-600' : 'bg-gray-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.email_verified ? (
                                                <span className="text-green-400">✓</span>
                                            ) : (
                                                <span className="text-gray-500">✕</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Security Events Tab */}
            {activeTab === 'security' && (
                <div className="space-y-4">
                    {securityEvents.map(event => (
                        <div key={event.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(event.severity)}`}>
                                            {event.severity.toUpperCase()}
                                        </span>
                                        <span className="font-medium">{event.event_type}</span>
                                        {event.blocked && (
                                            <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-xs">
                                                BLOCKED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                                    {event.payload && (
                                        <div className="bg-gray-900 rounded p-2 mb-2">
                                            <code className="text-xs text-gray-400">{event.payload}</code>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>IP: {event.ip_address}</span>
                                        {event.user_id && <span>User ID: {event.user_id}</span>}
                                        <span>{new Date(event.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminPanel;