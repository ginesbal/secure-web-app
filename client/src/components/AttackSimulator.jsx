import { useState } from 'react';
import { securityAPI } from '../services/api';

function AttackSimulator({ type, protection, onExecute }) {
    const [selectedPayload, setSelectedPayload] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const attacks = {
        xss: {
            title: 'Cross-Site Scripting (XSS)',
            severity: 'High',
            description: 'Injects malicious scripts into web pages viewed by other users',
            impact: 'Can steal cookies, session tokens, or redirect users to malicious sites',
            payloads: [
                {
                    name: 'Basic Script Alert',
                    code: '<script>alert("XSS")</script>',
                    risk: 'Executes JavaScript directly in the page'
                },
                {
                    name: 'Image Error Handler',
                    code: '<img src=x onerror="alert(\'XSS\')">',
                    risk: 'Uses broken image to trigger code execution'
                },
                {
                    name: 'Event Handler Injection',
                    code: '<div onclick="alert(1)">Click me</div>',
                    risk: 'Adds malicious event listeners to elements'
                },
                {
                    name: 'SVG Payload',
                    code: '<svg onload="alert(document.domain)">',
                    risk: 'Uses SVG elements to execute on page load'
                }
            ]
        },
        sql: {
            title: 'SQL Injection',
            severity: 'Critical',
            description: 'Manipulates database queries to access or modify data',
            impact: 'Can expose entire database, bypass authentication, or delete data',
            payloads: [
                {
                    name: 'Authentication Bypass',
                    code: "' OR '1'='1' --",
                    risk: 'Makes WHERE clause always true, bypassing login'
                },
                {
                    name: 'Union-based Data Extraction',
                    code: "' UNION SELECT username, password FROM users--",
                    risk: 'Combines queries to extract sensitive data'
                },
                {
                    name: 'Database Destruction',
                    code: "'; DROP TABLE users; --",
                    risk: 'Executes multiple queries to damage database'
                },
                {
                    name: 'Time-based Blind SQLi',
                    code: "'; IF(1=1, SLEEP(5), 0)--",
                    risk: 'Uses delays to infer database structure'
                }
            ]
        },
        csrf: {
            title: 'Cross-Site Request Forgery (CSRF)',
            severity: 'High',
            description: 'Forces users to execute unwanted actions on a web application',
            impact: 'Can perform actions on behalf of authenticated users without their knowledge',
            payloads: [
                {
                    name: 'Forged Request',
                    code: 'csrf_token=invalid',
                    risk: 'Attempts to bypass token validation'
                }
            ]
        },
        path: {
            title: 'Path Traversal',
            severity: 'High',
            description: 'Accesses files outside the intended directory',
            impact: 'Can read sensitive system files and configuration',
            payloads: [
                {
                    name: 'Unix Password File',
                    code: '../../etc/passwd',
                    risk: 'Attempts to read system password file'
                },
                {
                    name: 'Windows System Files',
                    code: '..\\..\\windows\\system32\\config\\sam',
                    risk: 'Targets Windows credential storage'
                },
                {
                    name: 'Application Config',
                    code: '../../../config/database.yml',
                    risk: 'Seeks database credentials'
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
    };

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{attack.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${attack.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                    attack.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {attack.severity}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">{attack.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${protection ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {protection ? '🛡️ Protected' : '⚠️ Vulnerable'}
                    </div>
                </div>

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

                <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Select Attack Payload:
                    </label>
                    {attack.payloads.map((payload, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedPayload(payload.code)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedPayload === payload.code
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            <div className="font-medium text-sm">{payload.name}</div>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block font-mono">
                                {payload.code}
                            </code>
                            <div className="text-xs text-gray-500 mt-1">{payload.risk}</div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={executeAttack}
                    disabled={loading || !selectedPayload}
                    className="w-full btn-primary justify-center"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="spinner"></span>
                            Executing...
                        </span>
                    ) : (
                        'Execute Attack'
                    )}
                </button>

                {result && (
                    <div className={`mt-4 p-4 rounded-lg ${result.error ? 'bg-gray-50 border border-gray-200' :
                            result.vulnerable ? 'bg-red-50 border border-red-200' :
                                'bg-green-50 border border-green-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">
                                {result.error ? '⚠' : result.vulnerable ? '🚨' : '✅'}
                            </span>
                            <div className="flex-1">
                                <p className={`font-medium text-sm ${result.error ? 'text-gray-700' :
                                        result.vulnerable ? 'text-red-700' : 'text-green-700'
                                    }`}>
                                    {result.error ? 'Error' :
                                        result.vulnerable ? 'Attack Succeeded!' : 'Attack Blocked!'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {result.message || result.error}
                                </p>
                                {result.query && (
                                    <div className="mt-2 p-2 bg-gray-900 rounded text-xs text-green-400 font-mono">
                                        {result.query}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AttackSimulator;