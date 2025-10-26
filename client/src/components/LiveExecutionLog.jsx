import { useState, useEffect } from 'react';

/**
 * Live Execution Log - Shows real-time attack execution steps
 */
function LiveExecutionLog({ isExecuting, attackType, payload, onComplete }) {
    const [visibleLogs, setVisibleLogs] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const executionSteps = {
        xss: [
            { time: 0, type: 'info', message: 'Preparing XSS attack payload...' },
            { time: 200, type: 'info', message: `Sending malicious script: "${payload?.substring(0, 50)}..."` },
            { time: 400, type: 'warn', message: 'Payload contains <script> tag - attempting code injection' },
            { time: 600, type: 'info', message: 'Request sent to server' },
            { time: 800, type: 'info', message: 'Server processing input...' },
            { time: 1000, type: 'process', message: 'Checking for XSS protection...' },
            { time: 1200, type: 'process', message: 'Evaluating sanitization rules' },
            { time: 1400, type: 'result', message: 'Analyzing output...' }
        ],
        sql: [
            { time: 0, type: 'info', message: 'Preparing SQL injection attack...' },
            { time: 200, type: 'info', message: `Sending malicious SQL: "${payload?.substring(0, 50)}..."` },
            { time: 400, type: 'warn', message: 'Payload contains SQL operators (OR, --, UNION)' },
            { time: 600, type: 'info', message: 'Request sent to database layer' },
            { time: 800, type: 'info', message: 'Server processing query...' },
            { time: 1000, type: 'process', message: 'Checking query parameterization...' },
            { time: 1200, type: 'process', message: 'Evaluating SQL injection protection' },
            { time: 1400, type: 'result', message: 'Query execution complete' }
        ],
        csrf: [
            { time: 0, type: 'info', message: 'Preparing CSRF attack...' },
            { time: 200, type: 'info', message: 'Sending forged request with token...' },
            { time: 400, type: 'warn', message: 'Attempting to bypass CSRF validation' },
            { time: 600, type: 'info', message: 'Request sent to server' },
            { time: 800, type: 'info', message: 'Server processing request...' },
            { time: 1000, type: 'process', message: 'Validating token against database...' },
            { time: 1200, type: 'process', message: 'Checking token origin' },
            { time: 1400, type: 'result', message: 'Validation complete' }
        ],
        path: [
            { time: 0, type: 'info', message: 'Preparing path traversal attack...' },
            { time: 200, type: 'info', message: `Sending file path: "${payload}"` },
            { time: 400, type: 'warn', message: 'Path contains ../ traversal sequences' },
            { time: 600, type: 'info', message: 'Request sent to file handler' },
            { time: 800, type: 'info', message: 'Server resolving file path...' },
            { time: 1000, type: 'process', message: 'Checking for path traversal patterns...' },
            { time: 1200, type: 'process', message: 'Validating against allowed directories' },
            { time: 1400, type: 'result', message: 'Path validation complete' }
        ]
    };

    const steps = executionSteps[attackType] || executionSteps.xss;

    useEffect(() => {
        if (!isExecuting) {
            setVisibleLogs([]);
            setCurrentStep(0);
            return;
        }

        setVisibleLogs([]);
        setCurrentStep(0);

        let currentStepIndex = 0;
        let cumulativeTime = 0;

        const showNextStep = () => {
            if (currentStepIndex < steps.length) {
                const step = steps[currentStepIndex];
                const delay = step.time - cumulativeTime;

                setTimeout(() => {
                    setVisibleLogs(prev => [...prev, { ...step, timestamp: Date.now() }]);
                    setCurrentStep(currentStepIndex + 1);
                    currentStepIndex++;
                    cumulativeTime = step.time;

                    if (currentStepIndex < steps.length) {
                        showNextStep();
                    } else if (onComplete) {
                        setTimeout(() => onComplete(), 200);
                    }
                }, delay);
            }
        };

        showNextStep();
    }, [isExecuting, attackType, payload]);

    if (!isExecuting && visibleLogs.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-sm font-semibold text-gray-100">Live Execution Log</div>
                {isExecuting && (
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-green-400">Running</span>
                    </div>
                )}
            </div>

            <div className="space-y-1 font-mono text-xs">
                {visibleLogs.map((log, index) => {
                    const elapsedTime = ((log.time) / 1000).toFixed(1);

                    let typeColor = 'text-gray-400';
                    let prefix = '[INFO]';

                    if (log.type === 'warn') {
                        typeColor = 'text-yellow-400';
                        prefix = '[WARN]';
                    } else if (log.type === 'process') {
                        typeColor = 'text-blue-400';
                        prefix = '[PROC]';
                    } else if (log.type === 'result') {
                        typeColor = 'text-green-400';
                        prefix = '[DONE]';
                    }

                    return (
                        <div
                            key={index}
                            className={`${typeColor} flex gap-2 animate-fadeIn`}
                        >
                            <span className="text-gray-600">[{elapsedTime}s]</span>
                            <span className="font-semibold">{prefix}</span>
                            <span className="flex-1">{log.message}</span>
                        </div>
                    );
                })}
            </div>

            {!isExecuting && visibleLogs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-400">
                        Execution completed in {(steps[steps.length - 1].time / 1000).toFixed(1)}s
                    </div>
                </div>
            )}
        </div>
    );
}

export default LiveExecutionLog;
