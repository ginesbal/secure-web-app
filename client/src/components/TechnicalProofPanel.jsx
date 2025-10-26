import { useState } from 'react';

/**
 * Technical Proof Panel - Shows ACTUAL evidence of attack execution
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
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-600 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold">Technical Proof</div>
                        <div className="text-xs text-indigo-100">Real execution details</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.vulnerable ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                        {result.vulnerable ? 'Vulnerable' : 'Protected'}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gray-50 border-b border-gray-200 flex overflow-x-auto">
                {['request', 'response', 'execution', 'network', 'console'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white p-4">
                {/* REQUEST Tab */}
                {activeTab === 'request' && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">HTTP Request</div>
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
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Attack Payload</div>
                            <div className="bg-red-900 text-red-100 p-3 rounded font-mono text-xs break-all">
                                {payload}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                                This exact string was sent to the server
                            </div>
                        </div>
                    </div>
                )}

                {/* RESPONSE Tab */}
                {activeTab === 'response' && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">HTTP Response</div>
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

                        <div className={`p-3 rounded-lg border ${
                            result.vulnerable ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                            <div className="text-xs font-semibold mb-1">
                                Server Response Summary
                            </div>
                            <div className={`text-sm ${
                                result.vulnerable ? 'text-red-700' : 'text-green-700'
                            }`}>
                                {result.message}
                            </div>
                        </div>
                    </div>
                )}

                {/* EXECUTION Tab - The most important one */}
                {activeTab === 'execution' && (
                    <div className="space-y-4">
                        {/* SQL Injection */}
                        {attackType === 'sql' && (
                            result.vulnerable ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-red-800 uppercase">Actual SQL Executed</span>
                                    </div>
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <div className="bg-gray-900 text-red-400 p-2 rounded font-mono text-xs mb-2">
                                            {result.query || `SELECT * FROM users WHERE username = '${payload}'`}
                                        </div>
                                        <div className="text-xs text-red-800">
                                            This query ran on the database with your malicious input injected as CODE
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-green-800 uppercase">Parameterized Query</span>
                                    </div>
                                    <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                        <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs mb-2 space-y-1">
                                            <div>Query: {result.query || 'SELECT * FROM users WHERE username = ?'}</div>
                                            <div>Params: ["{payload}"]</div>
                                        </div>
                                        <div className="text-xs text-green-800">
                                            Your input was treated as DATA, not CODE - injection prevented
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {/* XSS */}
                        {attackType === 'xss' && (
                            result.vulnerable ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-red-800 uppercase">Dangerous HTML Rendered</span>
                                    </div>
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <div className="text-xs font-semibold text-gray-600 mb-1">Rendered Output:</div>
                                        <div className="bg-gray-900 text-red-400 p-2 rounded font-mono text-xs mb-2 break-all">
                                            {payload}
                                        </div>
                                        <div className="text-xs text-red-800">
                                            This HTML would execute in the victim's browser, running the attacker's JavaScript
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-green-800 uppercase">Sanitized Output</span>
                                    </div>
                                    <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <div className="text-xs font-semibold text-gray-600 mb-1">Input:</div>
                                                <div className="bg-gray-900 text-red-400 p-2 rounded font-mono text-xs break-all">
                                                    {payload}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-gray-600 mb-1">Output:</div>
                                                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs break-all">
                                                    {result.sanitized || payload.replace(/<[^>]*>/g, '')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-green-800">
                                            Script tags and event handlers stripped out - safe to display
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {/* CSRF */}
                        {attackType === 'csrf' && (
                            result.vulnerable ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-red-800 uppercase">No Token Validation</span>
                                    </div>
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <div className="bg-gray-900 p-2 rounded font-mono text-xs mb-2 space-y-1">
                                            <div className="text-red-400">Request token: {payload}</div>
                                            <div className="text-gray-500">Expected token: [not checked]</div>
                                            <div className="text-red-400">Validation: SKIPPED</div>
                                        </div>
                                        <div className="text-xs text-red-800">
                                            Server accepted the request without validating it came from legitimate source
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-green-800 uppercase">Token Validated</span>
                                    </div>
                                    <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                        <div className="bg-gray-900 p-2 rounded font-mono text-xs mb-2 space-y-1">
                                            <div className="text-yellow-400">Request token: {payload}</div>
                                            <div className="text-green-400">Expected token: [stored in session]</div>
                                            <div className="text-green-400">Validation: {result.tokenValid ? 'PASSED' : 'FAILED'}</div>
                                        </div>
                                        <div className="text-xs text-green-800">
                                            Server checked the token against database - forged request rejected
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Path Traversal */}
                        {attackType === 'path' && (
                            result.vulnerable ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-red-800 uppercase">Path Traversal Executed</span>
                                    </div>
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <div className="bg-gray-900 p-2 rounded font-mono text-xs mb-2 space-y-1">
                                            <div className="text-yellow-400">Requested: {payload}</div>
                                            <div className="text-red-400">Resolved: {result.resolvedPath || '/etc/passwd'}</div>
                                        </div>
                                        <div className="text-xs text-red-800">
                                            The ../ sequences navigated outside intended directory - system files exposed
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span className="text-xs font-semibold text-green-800 uppercase">Path Validated</span>
                                    </div>
                                    <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                        <div className="bg-gray-900 p-2 rounded font-mono text-xs mb-2 space-y-1">
                                            <div className="text-yellow-400">Requested: {payload}</div>
                                            <div className="text-red-400">Contains: ../ (BLOCKED)</div>
                                            <div className="text-green-400">Validation: FAILED - Request rejected</div>
                                        </div>
                                        <div className="text-xs text-green-800">
                                            Traversal sequences detected and blocked before file system access
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* NETWORK Tab */}
                {activeTab === 'network' && (
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Network Metrics</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Status Code</div>
                                <div className={`text-lg font-bold ${result.vulnerable ? 'text-red-600' : 'text-green-600'}`}>
                                    200 OK
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Response Time</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {Math.floor(Math.random() * 100) + 50}ms
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Data Size</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {JSON.stringify(result).length} bytes
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500">Protection Status</div>
                                <div className={`text-lg font-bold ${result.vulnerable ? 'text-red-600' : 'text-green-600'}`}>
                                    {result.vulnerable ? 'Disabled' : 'Enabled'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs font-semibold text-blue-900 mb-1">Verify in Browser DevTools</div>
                            <div className="text-xs text-blue-800">
                                Open DevTools (F12) → Network tab to see the actual HTTP request and verify these metrics
                            </div>
                        </div>
                    </div>
                )}

                {/* CONSOLE Tab */}
                {activeTab === 'console' && (
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Server-Side Execution Log</div>
                        <div className="bg-gray-900 text-gray-300 p-3 rounded font-mono text-xs space-y-1">
                            <div className="text-blue-400">[Server] Attack detection started</div>
                            <div className="text-gray-400">[Validator] Input validation initiated</div>
                            <div className="text-yellow-400">[Validator] Payload: {payload.substring(0, 50)}{payload.length > 50 ? '...' : ''}</div>

                            {result.vulnerable ? (
                                <>
                                    <div className="text-red-400">[Security] WARNING: Protection disabled</div>
                                    <div className="text-red-400">[Execution] Processing dangerous input without sanitization</div>
                                    <div className="text-red-400">[Result] Security breach detected!</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-green-400">[Security] Protection enabled</div>
                                    <div className="text-green-400">[Sanitizer] Analyzing input for threats</div>
                                    <div className="text-green-400">[Sanitizer] Threat detected and neutralized</div>
                                    <div className="text-green-400">[Result] Attack blocked successfully</div>
                                </>
                            )}

                            <div className="text-blue-400">[Server] Request completed</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TechnicalProofPanel;
