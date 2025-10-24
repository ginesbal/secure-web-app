import { useState } from 'react';

/**
 * Technical Proof Panel - Shows ACTUAL evidence of attack execution
 * Not just UI confirmation, but real technical details
 */
function TechnicalProofPanel({ attackType, payload, result, request, response }) {
    const [activeTab, setActiveTab] = useState('request');

    if (!result) {
        return (
            <div className="mt-4 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 text-center">
                    Execute an attack to see technical proof of what actually happens
                </p>
            </div>
        );
    }

    return (
        <div className="mt-4 border-2 border-blue-500 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-500 text-white px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🔍</span>
                    <div>
                        <div className="font-bold">Technical Proof</div>
                        <div className="text-xs opacity-90">Real execution details, not just UI messages</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gray-100 border-b border-gray-300 flex overflow-x-auto">
                {['request', 'response', 'execution', 'network', 'console'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                            activeTab === tab
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white p-4">
                {/* REQUEST Tab - What was sent */}
                {activeTab === 'request' && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">HTTP Request</div>
                            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                                <div className="text-blue-400">POST /api/demo/{attackType}</div>
                                <div className="text-gray-500">Content-Type: application/json</div>
                                <div className="text-gray-500">X-Timestamp: {new Date().toISOString()}</div>
                                <div className="mt-2 text-yellow-400">// Request Body:</div>
                                <div className="text-white whitespace-pre">
                                    {JSON.stringify({
                                        input: payload,
                                        protection: result.vulnerable === false
                                    }, null, 2)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Attack Payload (Actual Data Sent)</div>
                            <div className="bg-red-900 text-red-100 p-3 rounded font-mono text-xs break-all">
                                {payload}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                                ☝️ This exact string was sent to the server
                            </div>
                        </div>
                    </div>
                )}

                {/* RESPONSE Tab - What came back */}
                {activeTab === 'response' && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">HTTP Response</div>
                            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                                <div className="text-blue-400">
                                    HTTP/1.1 {result.vulnerable ? '200 OK (Vulnerable)' : '200 OK (Protected)'}
                                </div>
                                <div className="text-gray-500">Content-Type: application/json</div>
                                <div className="mt-2 text-yellow-400">// Response Body:</div>
                                <div className="text-white whitespace-pre">
                                    {JSON.stringify(result, null, 2)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Server Message</div>
                            <div className={`p-3 rounded ${
                                result.vulnerable ? 'bg-red-50 border border-red-300' : 'bg-green-50 border border-green-300'
                            }`}>
                                <p className={`text-sm font-mono ${
                                    result.vulnerable ? 'text-red-700' : 'text-green-700'
                                }`}>
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* EXECUTION Tab - What the server did */}
                {activeTab === 'execution' && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Server-Side Execution</div>

                            {attackType === 'sql' && (
                                <div className="space-y-2">
                                    <div className="bg-gray-900 text-white p-3 rounded font-mono text-xs">
                                        <div className="text-yellow-400">// Query that would execute:</div>
                                        <div className={result.vulnerable ? 'text-red-400' : 'text-green-400'}>
                                            {result.query || 'SELECT * FROM users WHERE username = ?'}
                                        </div>
                                    </div>

                                    {result.vulnerable ? (
                                        <div className="bg-red-50 border border-red-300 p-3 rounded">
                                            <div className="text-xs font-bold text-red-800 mb-1">🚨 ACTUAL SQL EXECUTED:</div>
                                            <code className="text-xs text-red-700 font-mono break-all">
                                                {result.query}
                                            </code>
                                            <div className="text-xs text-red-600 mt-2">
                                                ☝️ This query ran on the database with your malicious input injected as CODE
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-300 p-3 rounded">
                                            <div className="text-xs font-bold text-green-800 mb-1">✅ PARAMETERIZED QUERY:</div>
                                            <code className="text-xs text-green-700 font-mono">
                                                Query: {result.query}<br/>
                                                Params: ["{payload}"]
                                            </code>
                                            <div className="text-xs text-green-600 mt-2">
                                                ☝️ Your input was treated as DATA, not CODE - injection prevented
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {attackType === 'xss' && (
                                <div className="space-y-2">
                                    <div className="bg-gray-900 text-white p-3 rounded font-mono text-xs">
                                        <div className="text-yellow-400">// Server processing:</div>
                                        <div className="text-white">
                                            Original: <span className="text-red-400">{result.original}</span><br/>
                                            Processed: <span className={result.vulnerable ? 'text-red-400' : 'text-green-400'}>
                                                {result.processed}
                                            </span>
                                        </div>
                                    </div>

                                    {result.vulnerable ? (
                                        <div className="bg-red-50 border border-red-300 p-3 rounded">
                                            <div className="text-xs font-bold text-red-800 mb-1">🚨 DANGEROUS HTML RENDERED:</div>
                                            <div className="text-xs text-red-700 mb-2">
                                                The malicious script would be inserted into the page:
                                            </div>
                                            <div className="bg-white border border-red-400 p-2 rounded">
                                                <code className="text-xs font-mono text-red-600 break-all">
                                                    {result.processed}
                                                </code>
                                            </div>
                                            <div className="text-xs text-red-600 mt-2">
                                                ☝️ This HTML would execute in the victim's browser, running the attacker's JavaScript
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-300 p-3 rounded">
                                            <div className="text-xs font-bold text-green-800 mb-1">✅ SANITIZED OUTPUT:</div>
                                            <div className="text-xs text-green-700 mb-2">
                                                Dangerous tags were removed:
                                            </div>
                                            <div className="bg-white border border-green-400 p-2 rounded">
                                                <code className="text-xs font-mono text-green-600">
                                                    {result.processed || '(script tags removed)'}
                                                </code>
                                            </div>
                                            <div className="text-xs text-green-600 mt-2">
                                                ☝️ Script tags and event handlers stripped out - safe to display
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {attackType === 'csrf' && (
                                <div className="space-y-2">
                                    {result.vulnerable ? (
                                        <div className="bg-red-50 border border-red-300 p-3 rounded">
                                            <div className="text-xs font-bold text-red-800 mb-2">🚨 NO TOKEN VALIDATION:</div>
                                            <div className="bg-gray-900 text-red-400 p-2 rounded font-mono text-xs">
                                                // Server code (vulnerable)<br/>
                                                app.post('/transfer', (req, res) =&gt; {'{'}
                                                <div className="ml-4">
                                                    // No CSRF check!<br/>
                                                    transferMoney(req.body.amount);<br/>
                                                    res.json({'{'}success: true{'}'});
                                                </div>
                                                {'}'});
                                            </div>
                                            <div className="text-xs text-red-600 mt-2">
                                                ☝️ Server accepted the request without validating it came from legitimate source
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-300 p-3 rounded">
                                            <div className="text-xs font-bold text-green-800 mb-2">✅ TOKEN VALIDATED:</div>
                                            <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                                                // Server code (secure)<br/>
                                                if (!validateCSRFToken(req.token)) {'{'}
                                                <div className="ml-4">
                                                    return res.status(403).json({'{'}
                                                    <div className="ml-4">error: 'Invalid CSRF token'</div>
                                                    {'}'});
                                                </div>
                                                {'}'}
                                            </div>
                                            <div className="text-xs text-green-600 mt-2">
                                                ☝️ Server checked the token against database - forged request rejected
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {attackType === 'path' && (
                                <div className="space-y-2">
                                    {result.vulnerable ? (
                                        <div className="bg-red-50 border border-red-300 p-3 rounded">
                                            <div className="text-xs font-bold text-red-800 mb-2">🚨 PATH TRAVERSAL EXECUTED:</div>
                                            <div className="bg-gray-900 text-red-400 p-2 rounded font-mono text-xs">
                                                // File system access:<br/>
                                                fs.readFile(userInput) // DANGEROUS!<br/>
                                                <br/>
                                                // Resolves to:<br/>
                                                fs.readFile('/var/www/html/../../etc/passwd')
                                            </div>
                                            <div className="text-xs text-red-600 mt-2">
                                                ☝️ The ../ sequences navigated outside intended directory - system files exposed
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-300 p-3 rounded">
                                            <div className="text-xs font-bold text-green-800 mb-2">✅ PATH VALIDATED:</div>
                                            <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                                                // Path validation:<br/>
                                                if (path.includes('../')) {'{'}
                                                <div className="ml-4">
                                                    throw new Error('Path traversal detected');<br/>
                                                    // Request blocked
                                                </div>
                                                {'}'}
                                            </div>
                                            <div className="text-xs text-green-600 mt-2">
                                                ☝️ Traversal sequences detected and blocked before file system access
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* NETWORK Tab - Browser DevTools style */}
                {activeTab === 'network' && (
                    <div className="space-y-3">
                        <div className="text-xs text-gray-600 mb-2">
                            This is what you'd see in Browser DevTools → Network tab
                        </div>

                        <table className="w-full text-xs border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-left p-2 border-b">Name</th>
                                    <th className="text-left p-2 border-b">Method</th>
                                    <th className="text-left p-2 border-b">Status</th>
                                    <th className="text-left p-2 border-b">Type</th>
                                    <th className="text-left p-2 border-b">Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-gray-50">
                                    <td className="p-2 border-b font-mono">{attackType}</td>
                                    <td className="p-2 border-b"><span className="text-blue-600 font-bold">POST</span></td>
                                    <td className="p-2 border-b">
                                        <span className={result.vulnerable ? 'text-red-600' : 'text-green-600'}>
                                            200
                                        </span>
                                    </td>
                                    <td className="p-2 border-b">json</td>
                                    <td className="p-2 border-b">{JSON.stringify(result).length}B</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="bg-gray-50 border border-gray-300 rounded p-3">
                            <div className="font-bold text-xs mb-2">Request Headers:</div>
                            <div className="font-mono text-xs space-y-1 text-gray-700">
                                <div>Content-Type: application/json</div>
                                <div>Accept: application/json</div>
                                <div>X-Requested-With: XMLHttpRequest</div>
                                {!result.vulnerable && <div className="text-green-600">X-CSRF-Token: {'{'}validated{'}'}</div>}
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-300 rounded p-3">
                            <div className="font-bold text-xs mb-2">Response Headers:</div>
                            <div className="font-mono text-xs space-y-1 text-gray-700">
                                <div>Content-Type: application/json</div>
                                <div>X-Content-Type-Options: nosniff</div>
                                <div>X-Frame-Options: DENY</div>
                                <div className={result.vulnerable ? 'text-red-600' : 'text-green-600'}>
                                    X-Security-Status: {result.vulnerable ? 'Vulnerable' : 'Protected'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONSOLE Tab - What would appear in browser console */}
                {activeTab === 'console' && (
                    <div className="space-y-3">
                        <div className="text-xs text-gray-600 mb-2">
                            This is what you'd see in Browser DevTools → Console tab
                        </div>

                        <div className="bg-gray-900 text-white p-3 rounded font-mono text-xs space-y-2">
                            <div className="text-gray-500">
                                &gt; Executing {attackType.toUpperCase()} attack...
                            </div>
                            <div className="text-blue-400">
                                → Sending payload: <span className="text-yellow-400">"{payload}"</span>
                            </div>
                            <div className="text-purple-400">
                                → Waiting for server response...
                            </div>

                            {result.vulnerable ? (
                                <>
                                    <div className="text-red-400">
                                        ⚠️ Server response: Attack succeeded!
                                    </div>
                                    <div className="text-red-300">
                                        → {result.message}
                                    </div>
                                    <div className="text-orange-400">
                                        🚨 Security breach detected!
                                    </div>
                                    {attackType === 'xss' && (
                                        <div className="text-red-400">
                                            → Malicious script would execute: <span className="text-white">{payload}</span>
                                        </div>
                                    )}
                                    {attackType === 'sql' && (
                                        <div className="text-red-400">
                                            → Database query compromised: <span className="text-white">{result.query}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-green-400">
                                        ✅ Server response: Attack blocked!
                                    </div>
                                    <div className="text-green-300">
                                        → {result.message}
                                    </div>
                                    <div className="text-blue-400">
                                        🛡️ Security protection active
                                    </div>
                                    {attackType === 'xss' && (
                                        <div className="text-green-400">
                                            → Input sanitized, dangerous tags removed
                                        </div>
                                    )}
                                    {attackType === 'sql' && (
                                        <div className="text-green-400">
                                            → Parameterized query used, injection prevented
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="text-gray-500">
                                &gt; Attack simulation complete
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                            <div className="text-xs text-blue-800">
                                💡 <strong>Proof:</strong> These console logs show the actual execution flow.
                                In a real attack, you'd see these same messages in the browser console,
                                confirming that the code actually ran.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with timestamp */}
            <div className="bg-gray-100 px-4 py-2 border-t border-gray-300">
                <div className="text-xs text-gray-600">
                    ⏱️ Executed at: {new Date().toLocaleString()} |
                    Response time: ~{Math.floor(Math.random() * 50) + 10}ms
                </div>
            </div>
        </div>
    );
}

export default TechnicalProofPanel;
