import { useState } from 'react';
import { securityAPI } from '../services/api';

/**
 * Before/After Demo - Shows side-by-side comparison of protected vs unprotected
 * Perfect for presentations and screenshots
 */
function BeforeAfterDemo({ type }) {
    const [payload, setPayload] = useState('');
    const [vulnerableResult, setVulnerableResult] = useState(null);
    const [protectedResult, setProtectedResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const demoPayloads = {
        xss: {
            title: 'XSS Attack Demo',
            defaultPayload: '<script>alert("Hacked!")</script>',
            description: 'This script would execute in the victim\'s browser'
        },
        sql: {
            title: 'SQL Injection Demo',
            defaultPayload: "' OR '1'='1' --",
            description: 'This bypasses authentication by making the query always true'
        },
        csrf: {
            title: 'CSRF Attack Demo',
            defaultPayload: 'forged_token_123',
            description: 'This attempts to forge a request from another site'
        },
        path: {
            title: 'Path Traversal Demo',
            defaultPayload: '../../../etc/passwd',
            description: 'This tries to access files outside the intended directory'
        }
    };

    const demo = demoPayloads[type];

    const runComparison = async () => {
        if (!payload) {
            setPayload(demo.defaultPayload);
            return;
        }

        setLoading(true);
        try {
            // Run both tests in parallel
            const [vulnerable, protected] = await Promise.all([
                type === 'xss' ? securityAPI.testXSS({ input: payload, protection: false }) :
                type === 'sql' ? securityAPI.testSQL({ input: payload, protection: false }) :
                type === 'csrf' ? securityAPI.testCSRF({ csrfToken: payload, protection: false }) :
                securityAPI.testPathTraversal({ path: payload, protection: false }),

                type === 'xss' ? securityAPI.testXSS({ input: payload, protection: true }) :
                type === 'sql' ? securityAPI.testSQL({ input: payload, protection: true }) :
                type === 'csrf' ? securityAPI.testCSRF({ csrfToken: payload, protection: true }) :
                securityAPI.testPathTraversal({ path: payload, protection: true })
            ]);

            setVulnerableResult(vulnerable.data);
            setProtectedResult(protected.data);
        } catch (error) {
            console.error('Demo error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{demo?.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{demo?.description}</p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attack Payload:
                        </label>
                        <input
                            type="text"
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                            placeholder={demo?.defaultPayload}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        />
                    </div>

                    <button
                        onClick={runComparison}
                        disabled={loading}
                        className="w-full btn-primary justify-center"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="spinner w-4 h-4"></span>
                                Testing...
                            </span>
                        ) : (
                            'Run Side-by-Side Comparison'
                        )}
                    </button>
                </div>
            </div>

            {(vulnerableResult || protectedResult) && (
                <div className="grid md:grid-cols-2 gap-4">
                    {/* WITHOUT Protection */}
                    <div className="border-2 border-red-300 rounded-xl overflow-hidden">
                        <div className="bg-red-500 text-white px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <div className="font-bold">WITHOUT Protection</div>
                                    <div className="text-xs opacity-90">Vulnerable System</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-red-50">
                            {vulnerableResult?.vulnerable ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-700 font-bold">
                                        <span className="text-2xl">🚨</span>
                                        <span>ATTACK SUCCESSFUL!</span>
                                    </div>
                                    <p className="text-sm text-red-600">
                                        {vulnerableResult.message}
                                    </p>
                                    {vulnerableResult.query && (
                                        <div className="mt-2 p-2 bg-red-900 text-red-100 rounded text-xs font-mono overflow-x-auto">
                                            {vulnerableResult.query}
                                        </div>
                                    )}
                                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                                        <div className="text-xs font-bold text-red-800 mb-1">IMPACT:</div>
                                        <div className="text-xs text-red-700">
                                            {type === 'xss' && '• Attacker can steal your cookies and session\n• Can inject malicious content\n• Can redirect to phishing sites'}
                                            {type === 'sql' && '• Attacker gains full database access\n• Can steal all user data\n• Can delete or modify records'}
                                            {type === 'csrf' && '• Attacker can perform actions as you\n• Can transfer money, change settings\n• User unaware of the attack'}
                                            {type === 'path' && '• Attacker can read sensitive files\n• Can access configuration files\n• May expose credentials'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-600 text-sm">
                                    No obvious vulnerability pattern detected
                                </div>
                            )}
                        </div>
                    </div>

                    {/* WITH Protection */}
                    <div className="border-2 border-green-300 rounded-xl overflow-hidden">
                        <div className="bg-green-500 text-white px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🛡️</span>
                                <div>
                                    <div className="font-bold">WITH Protection</div>
                                    <div className="text-xs opacity-90">Secure System</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-green-50">
                            {!protectedResult?.vulnerable ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-700 font-bold">
                                        <span className="text-2xl">✅</span>
                                        <span>ATTACK BLOCKED!</span>
                                    </div>
                                    <p className="text-sm text-green-600">
                                        {protectedResult?.message}
                                    </p>
                                    {protectedResult?.query && (
                                        <div className="mt-2 p-2 bg-green-900 text-green-100 rounded text-xs font-mono overflow-x-auto">
                                            {protectedResult.query}
                                        </div>
                                    )}
                                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
                                        <div className="text-xs font-bold text-green-800 mb-1">PROTECTION:</div>
                                        <div className="text-xs text-green-700 whitespace-pre-line">
                                            {type === 'xss' && '✓ Input sanitized with DOMPurify\n✓ Dangerous HTML/scripts removed\n✓ Users see safe content only'}
                                            {type === 'sql' && '✓ Parameterized queries used\n✓ Input treated as data, not code\n✓ Database safe from injection'}
                                            {type === 'csrf' && '✓ Token validation required\n✓ Forged requests rejected\n✓ Only legitimate requests processed'}
                                            {type === 'path' && '✓ Path traversal sequences blocked\n✓ File access restricted\n✓ Sensitive files protected'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-orange-600 text-sm font-medium">
                                    Warning: Protection may be insufficient
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions for capturing */}
            {(vulnerableResult || protectedResult) && (
                <div className="card p-4 bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <div className="text-sm text-blue-800">
                            <strong>For presentations/screenshots:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                                <li>Take a screenshot of this comparison (Windows: Win+Shift+S, Mac: Cmd+Shift+4)</li>
                                <li>The red box shows what happens WITHOUT protection</li>
                                <li>The green box shows how protection BLOCKS the attack</li>
                                <li>Perfect for explaining security to non-technical stakeholders!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BeforeAfterDemo;
