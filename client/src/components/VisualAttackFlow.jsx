import { useState, useEffect } from 'react';

/**
 * Visual Attack Flow - Shows animated attack path with visual feedback
 * Makes it easy for non-technical users to SEE the attack happening
 */
function VisualAttackFlow({ type, protection, executing, result }) {
    const [step, setStep] = useState(0);

    const flows = {
        xss: {
            vulnerable: [
                { label: 'Attacker', icon: '👤', color: 'red' },
                { label: 'Malicious Script', icon: '💀', color: 'red' },
                { label: 'Your Website', icon: '🌐', color: 'yellow' },
                { label: 'Victim Browser', icon: '💻', color: 'red' },
                { label: 'Data Stolen!', icon: '🚨', color: 'red' }
            ],
            protected: [
                { label: 'Attacker', icon: '👤', color: 'gray' },
                { label: 'Malicious Script', icon: '💀', color: 'gray' },
                { label: 'Sanitizer', icon: '🛡️', color: 'green' },
                { label: 'Clean Output', icon: '✅', color: 'green' },
                { label: 'Safe Website', icon: '🌐', color: 'green' }
            ]
        },
        sql: {
            vulnerable: [
                { label: 'Attacker', icon: '👤', color: 'red' },
                { label: 'SQL Injection', icon: '💉', color: 'red' },
                { label: 'Database', icon: '🗄️', color: 'yellow' },
                { label: 'Data Exposed!', icon: '🚨', color: 'red' }
            ],
            protected: [
                { label: 'Attacker', icon: '👤', color: 'gray' },
                { label: 'SQL Injection', icon: '💉', color: 'gray' },
                { label: 'Parameterized Query', icon: '🛡️', color: 'green' },
                { label: 'Safe Database', icon: '🗄️', color: 'green' }
            ]
        },
        csrf: {
            vulnerable: [
                { label: 'Attacker Site', icon: '🌐', color: 'red' },
                { label: 'Forged Request', icon: '📤', color: 'red' },
                { label: 'Your Server', icon: '🖥️', color: 'yellow' },
                { label: 'Action Executed!', icon: '🚨', color: 'red' }
            ],
            protected: [
                { label: 'Attacker Site', icon: '🌐', color: 'gray' },
                { label: 'Forged Request', icon: '📤', color: 'gray' },
                { label: 'Token Validator', icon: '🛡️', color: 'green' },
                { label: 'Request Blocked', icon: '✅', color: 'green' }
            ]
        },
        path: {
            vulnerable: [
                { label: 'Attacker', icon: '👤', color: 'red' },
                { label: '../../../etc/passwd', icon: '📂', color: 'red' },
                { label: 'File System', icon: '💾', color: 'yellow' },
                { label: 'Files Exposed!', icon: '🚨', color: 'red' }
            ],
            protected: [
                { label: 'Attacker', icon: '👤', color: 'gray' },
                { label: '../../../etc/passwd', icon: '📂', color: 'gray' },
                { label: 'Path Validator', icon: '🛡️', color: 'green' },
                { label: 'Access Denied', icon: '✅', color: 'green' }
            ]
        }
    };

    const currentFlow = flows[type] ? (protection ? flows[type].protected : flows[type].vulnerable) : [];

    useEffect(() => {
        if (executing) {
            setStep(0);
            const interval = setInterval(() => {
                setStep(s => {
                    if (s >= currentFlow.length - 1) {
                        clearInterval(interval);
                        return s;
                    }
                    return s + 1;
                });
            }, 500);
            return () => clearInterval(interval);
        } else {
            setStep(0);
        }
    }, [executing, currentFlow.length]);

    const getStepColor = (index, nodeColor) => {
        if (!executing && !result) return 'border-gray-300 bg-gray-50';
        if (index > step && executing) return 'border-gray-200 bg-gray-50 opacity-30';

        if (nodeColor === 'red') return 'border-red-500 bg-red-50 animate-pulse';
        if (nodeColor === 'green') return 'border-green-500 bg-green-50';
        if (nodeColor === 'yellow') return 'border-yellow-500 bg-yellow-50';
        return 'border-gray-300 bg-gray-100';
    };

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Visual Attack Flow</h4>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    protection ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {protection ? 'Protection ON' : 'Protection OFF'}
                </span>
            </div>

            <div className="flex items-center justify-between gap-2">
                {currentFlow.map((node, index) => (
                    <div key={index} className="flex items-center gap-2 flex-1">
                        <div className={`
                            flex flex-col items-center justify-center
                            w-20 h-20 rounded-xl border-2 transition-all duration-300
                            ${getStepColor(index, node.color)}
                        `}>
                            <span className="text-2xl mb-1">{node.icon}</span>
                            <span className="text-xs text-center font-medium text-gray-700 px-1">
                                {node.label}
                            </span>
                        </div>

                        {index < currentFlow.length - 1 && (
                            <div className={`flex-1 h-0.5 transition-all duration-300 ${
                                index < step ?
                                    (node.color === 'green' ? 'bg-green-500' :
                                     node.color === 'red' ? 'bg-red-500' :
                                     'bg-yellow-500')
                                    : 'bg-gray-300'
                            }`}>
                                {index < step && (
                                    <div className="relative">
                                        <div className="absolute -top-1 right-0 text-xs">
                                            {node.color === 'red' ? '→' : '→'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {result && (
                <div className={`mt-4 p-3 rounded-lg border ${
                    result.vulnerable ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                    <p className={`text-sm font-medium ${
                        result.vulnerable ? 'text-red-700' : 'text-green-700'
                    }`}>
                        {result.vulnerable ?
                            '🚨 Attack Successful - Your data is compromised!' :
                            '✅ Attack Blocked - Protection working perfectly!'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

export default VisualAttackFlow;
