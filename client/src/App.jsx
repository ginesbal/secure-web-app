// FILE: client/src/App.jsx

import { useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import SecurityAlert from './components/SecurityAlert';
import { AuthProvider } from './contexts/AuthContext';
import { SecurityProvider } from './contexts/SecurityContext';
import './index.css';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VulnerabilityPlayground from './pages/VulnerabilityPlayground';

function App() {
    const [alerts, setAlerts] = useState([]);

    const addAlert = (message, type = 'info') => {
        const alert = {
            id: Date.now(),
            message,
            type
        };
        setAlerts(prev => [...prev, alert]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 5000);
    };

    return (
        <Router>
            <AuthProvider>
                <SecurityProvider>
                    <div className="min-h-screen bg-white">
                        <Navbar />

                        {/* Alert Container */}
                        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
                            {alerts.map(alert => (
                                <SecurityAlert
                                    key={alert.id}
                                    message={alert.message}
                                    type={alert.type}
                                    onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                                />
                            ))}
                        </div>

                        <main>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/login" element={<LoginPage addAlert={addAlert} />} />
                                <Route path="/register" element={<RegisterPage addAlert={addAlert} />} />
                                <Route path="/playground" element={<VulnerabilityPlayground addAlert={addAlert} />} />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <Dashboard addAlert={addAlert} />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedRoute requiredRole="Admin">
                                            <AdminPanel addAlert={addAlert} />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </main>

                        {/* Simple Footer */}
                        <footer className="mt-auto border-t border-gray-100 bg-gray-50">
                            <div className="container-wide py-8">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <p className="text-sm text-gray-600">
                                        © 2024 Security Learning Platform. For educational purposes only.
                                    </p>
                                    <div className="flex gap-6">
                                        <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Learn More</a>
                                        <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Support</a>
                                        <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Contact</a>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </SecurityProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;