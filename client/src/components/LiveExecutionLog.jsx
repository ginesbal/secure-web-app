import { useState, useEffect } from 'react';

/**
 * Live Execution Log - Shows attack execution in REAL-TIME
 * Step-by-step logging as the attack progresses
 */
function LiveExecutionLog({ isExecuting, attackType, payload, onComplete }) {
    const [logs, setLogs] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const executionSteps = {
        xss: [
            { time: 0, type: 'info', message: '🔵 Preparing XSS attack payload...' },
            { time: 200, type: 'info', message: `📤 Sending malicious script: "${payload?.substring(0, 50)}..."` },
            { time: 400, type: 'warn', message: '⚡ Payload contains <script> tag - attempting code injection' },
            { time: 600, type: 'info', message: '🌐 Server receiving request...' },
            { time: 800, type: 'process', message: '⚙️ Server processing input...' },
            { time: 1000, type: 'process', message: '🔍 Checking for XSS protection...' },
            { time: 1200, type: 'process', message: '🛡️ Running DOMPurify sanitization check...' },
            { time: 1400, type: 'result', message: '📊 Analyzing output...' }
        ],
        sql: [
            { time: 0, type: 'info', message: '🔵 Preparing SQL injection attack...' },
            { time: 200, type: 'info', message: `📤 Sending malicious SQL: "${payload?.substring(0, 50)}..."` },
            { time: 400, type: 'warn', message: '⚡ Payload contains SQL operators (OR, --, UNION)' },
            { time: 600, type: 'info', message: '🗄️ Server constructing database query...' },
            { time: 800, type: 'process', message: '⚙️ Building SQL statement...' },
            { time: 1000, type: 'process', message: '🔍 Checking query parameterization...' },
            { time: 1200, type: 'process', message: '🔐 Validating input treatment (data vs code)...' },
            { time: 1400, type: 'result', message: '📊 Query execution complete' }
        ],
        csrf: [
            { time: 0, type: 'info', message: '🔵 Preparing CSRF attack...' },
            { time: 200, type: 'info', message: '📤 Sending forged request with token...' },
            { time: 400, type: 'warn', message: '⚡ Attempting to bypass CSRF validation' },
            { time: 600, type: 'info', message: '🌐 Server receiving state-changing request...' },
            { time: 800, type: 'process', message: '⚙️ Extracting CSRF token from request...' },
            { time: 1000, type: 'process', message: '🔍 Validating token against database...' },
            { time: 1200, type: 'process', message: '🔐 Checking token expiration and user match...' },
            { time: 1400, type: 'result', message: '📊 Validation complete' }
        ],
        path: [
            { time: 0, type: 'info', message: '🔵 Preparing path traversal attack...' },
            { time: 200, type: 'info', message: `📤 Sending file path: "${payload}"` },
            { time: 400, type: 'warn', message: '⚡ Path contains ../ traversal sequences' },
            { time: 600, type: 'info', message: '💾 Server processing file access request...' },
            { time: 800, type: 'process', message: '⚙️ Resolving file path...' },
            { time: 1000, type: 'process', message: '🔍 Checking for path traversal patterns...' },
            { time: 1200, type: 'process', message: '🔐 Validating path against allowed directories...' },
            { time: 1400, type: 'result', message: '📊 Path validation complete' }
        ]
    };

    useEffect(() => {
        if (isExecuting && attackType && payload) {
            setLogs([]);
            setCurrentStep(0);

            const steps = executionSteps[attackType] || executionSteps.xss;

            steps.forEach((step, index) => {
                setTimeout(() => {
                    setLogs(prev => [...prev, step]);
                    setCurrentStep(index + 1);

                    if (index === steps.length - 1) {
                        setTimeout(() => {
                            if (onComplete) onComplete();
                        }, 300);
                    }
                }, step.time);
            });
        }
    }, [isExecuting, attackType, payload]);

    if (!isExecuting && logs.length === 0) {
        return null;
    }

    const getLogColor = (type) => {
        switch (type) {
            case 'info': return 'text-blue-400';
            case 'warn': return 'text-yellow-400';
            case 'error': return 'text-red-400';
            case 'success': return 'text-green-400';
            case 'process': return 'text-purple-400';
            case 'result': return 'text-cyan-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="mt-4 border-2 border-purple-500 rounded-lg overflow-hidden animate-fade-in">
            <div className="bg-purple-500 text-white px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div className="flex-1">
                        <div className="font-bold">Live Execution Log</div>
                        <div className="text-xs opacity-90">Real-time step-by-step attack execution</div>
                    </div>
                    {isExecuting && (
                        <div className="flex items-center gap-2">
                            <div className="spinner w-4 h-4 border-2 border-white border-t-transparent"></div>
                            <span className="text-xs">Executing...</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-900 p-4 max-h-64 overflow-y-auto">
                <div className="font-mono text-xs space-y-2">
                    {logs.length === 0 && (
                        <div className="text-gray-500 animate-pulse">
                            Initializing attack simulation...
                        </div>
                    )}

                    {logs.map((log, index) => (
                        <div
                            key={index}
                            className={`flex items-start gap-2 ${getLogColor(log.type)} animate-slide-in`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <span className="text-gray-600 select-none">
                                [{new Date().toLocaleTimeString()}]
                            </span>
                            <span className="flex-1">{log.message}</span>
                        </div>
                    ))}

                    {isExecuting && (
                        <div className="text-gray-500 animate-pulse mt-2">
                            <span className="inline-block">▋</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                    Progress: {currentStep} / {(executionSteps[attackType] || []).length} steps
                    {!isExecuting && logs.length > 0 && <span className="text-green-400 ml-2">✓ Complete</span>}
                </div>
            </div>
        </div>
    );
}

export default LiveExecutionLog;
