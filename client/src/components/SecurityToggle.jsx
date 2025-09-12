import { useState } from 'react';

function SecurityToggle({ label, setting, enabled, onChange, description }) {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{label}</span>
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={() => onChange(setting)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className={`text-xs ${enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {enabled ? 'Protected' : 'Vulnerable'}
                </p>
            </div>

            {showInfo && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600">{description}</p>
                </div>
            )}
        </div>
    );
}

export default SecurityToggle;