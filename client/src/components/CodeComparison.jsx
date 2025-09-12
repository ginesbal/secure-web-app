function CodeComparison({ title, description, vulnerable, secure }) {
    return (
        <div className="card">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-600 mb-4">{description}</p>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-500">✗</span>
                            <span className="text-sm font-medium text-gray-700">Vulnerable Code</span>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs text-gray-300 font-mono">
                                <code>{vulnerable}</code>
                            </pre>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-500">✓</span>
                            <span className="text-sm font-medium text-gray-700">Secure Code</span>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs text-gray-300 font-mono">
                                <code>{secure}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CodeComparison;