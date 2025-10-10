import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user } = useAuth();

  // xss demo state
  const [userInput, setUserInput] = useState('');
  const [xssProtectionEnabled, setXssProtectionEnabled] = useState(true);
  const [renderedContent, setRenderedContent] = useState('');
  const [attackDetected, setAttackDetected] = useState(false);

  // sql injection demo state
  const [username, setUsername] = useState('');
  const [sqlProtectionEnabled, setSqlProtectionEnabled] = useState(true);
  const [queryResult, setQueryResult] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');

  // demo payloads
  const xssPayload = `<img src=x onerror="alert('XSS Attack!')">`;
  const sqlPayload = `' OR '1'='1' --`;

  // sanitization function
  const sanitizeHTML = (input) => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe/gi, '&lt;iframe');
  };

  // Handle XSS Demo
  const handleXSSDemo = () => {
    setAttackDetected(false);

    if (xssProtectionEnabled) {
      // Real sanitization
      const cleaned = sanitizeHTML(userInput);
      setRenderedContent(cleaned);

      // Check if attack was blocked
      if (userInput !== cleaned && (userInput.includes('<') || userInput.includes('onerror'))) {
        setAttackDetected(true);
      }
    } else {
      // Unsafe - show what would happen
      setRenderedContent(userInput);
      if (userInput.includes('<script') || userInput.includes('onerror') || userInput.includes('javascript:')) {
        setAttackDetected(true);
      }
    }
  };

  // Handle SQL Demo
  const handleSQLDemo = () => {
    if (sqlProtectionEnabled) {
      // Parameterized query simulation
      setSqlQuery(`SELECT * FROM users WHERE username = ?`);
      setQueryResult(`Query executed safely with parameter: ["${username}"]`);

      if (username.includes("'") || username.includes('--')) {
        setQueryResult(`✓ Injection attempt blocked. Parameter: ["${username}"] treated as data, not SQL code.`);
      }
    } else {
      // Vulnerable query simulation
      const vulnerableQuery = `SELECT * FROM users WHERE username = '${username}'`;
      setSqlQuery(vulnerableQuery);

      if (username.includes("' OR '1'='1")) {
        setSqlQuery(`SELECT * FROM users WHERE username = '' OR '1'='1' --'`);
        setQueryResult('⚠️ SQL Injection successful! This query would return ALL users.');
      } else if (username.includes("'")) {
        setQueryResult('⚠️ SQL syntax error - query structure broken by quotes');
      } else {
        setQueryResult(`Query executed for user: ${username}`);
      }
    }
  };

  // Real-time attack detection
  useEffect(() => {
    if (userInput.includes('<script') || userInput.includes('onerror') || userInput.includes('javascript:')) {
      setAttackDetected(true);
    } else {
      setAttackDetected(false);
    }
  }, [userInput]);

  return (
    <div className="min-h-screen bg-white">
      {/* Main Hero with REAL Demo */}
      <section className="relative pt-8 pb-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8 items-start">

            {/* Left Content */}
            <div className="lg:col-span-5 pt-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-dark_purple-500 mb-6 leading-tight">
                Break things safely.
                <br />
                <span className="text-2xl lg:text-3xl text-gray-600 font-normal">
                  Learn by doing.
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
                Try real XSS and SQL injection attacks in the boxes.
                Toggle protection to see what happens when defenses are disabled.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/playground"
                  className="px-6 py-3 bg-dark_purple-500 text-white rounded-xl font-medium hover:bg-dark_purple-600 transition-all"
                >
                  Full Security Lab
                </Link>
                {!user && (
                  <Link
                    to="/login"
                    className="px-6 py-3 bg-white text-dark_purple-500 rounded-xl font-medium border-2 border-ash_gray-300 hover:border-dark_purple-300 transition-all"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            {/* Right Side - WORKING Demo */}
            <div className="lg:col-span-7 space-y-6">

              {/* XSS Demo */}
              <div className="bg-white rounded-xl border border-ash_gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-dark_purple-500">Live XSS Demo</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-600">Protection</span>
                    <button
                      onClick={() => setXssProtectionEnabled(!xssProtectionEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${xssProtectionEnabled ? 'bg-ash_gray-600' : 'bg-gray-300'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${xssProtectionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type something or paste malicious code..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => setUserInput(xssPayload)}
                      className="mt-2 text-xs text-raspberry-600 hover:text-raspberry-700"
                    >
                      Use attack payload: {`<img src=x onerror="alert()">`}
                    </button>
                  </div>

                  <button
                    onClick={handleXSSDemo}
                    className="w-full py-2 bg-dark_purple-500 text-white rounded-lg text-sm hover:bg-dark_purple-600 transition-colors"
                  >
                    Process Input
                  </button>

                  {/* Status */}
                  {attackDetected && renderedContent && (
                    <div className={`p-3 rounded-lg text-sm ${xssProtectionEnabled
                        ? 'bg-ash_gray-50 text-ash_gray-700 border border-ash_gray-200'
                        : 'bg-vermilion-50 text-vermilion-700 border border-vermilion-200'
                      }`}>
                      {xssProtectionEnabled
                        ? '✓ Attack blocked - Malicious code removed'
                        : '⚠️ Attack successful - Script would execute in browser'}
                    </div>
                  )}

                  {/* Output */}
                  {renderedContent && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Output after processing:</p>
                      <div className="font-mono text-sm text-gray-700 break-all">{renderedContent}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* SQL Injection Demo */}
              <div className="bg-white rounded-xl border border-ash_gray-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-dark_purple-500">Live SQL Injection Demo</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-600">Protection</span>
                    <button
                      onClick={() => setSqlProtectionEnabled(!sqlProtectionEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sqlProtectionEnabled ? 'bg-ash_gray-600' : 'bg-gray-300'
                        }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sqlProtectionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username to search..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => setUsername(sqlPayload)}
                      className="mt-2 text-xs text-raspberry-600 hover:text-raspberry-700"
                    >
                      Use injection payload: ' OR '1'='1' --
                    </button>
                  </div>

                  <button
                    onClick={handleSQLDemo}
                    className="w-full py-2 bg-dark_purple-500 text-white rounded-lg text-sm hover:bg-dark_purple-600 transition-colors"
                  >
                    Execute Query
                  </button>

                  {/* Generated Query */}
                  {sqlQuery && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">SQL Query generated:</p>
                      <code className="text-xs text-gray-700 break-all block font-mono">{sqlQuery}</code>
                    </div>
                  )}

                  {/* Result */}
                  {queryResult && (
                    <div className={`p-3 rounded-lg text-sm ${queryResult.includes('⚠️')
                        ? 'bg-vermilion-50 text-vermilion-700 border border-vermilion-200'
                        : queryResult.includes('✓')
                          ? 'bg-ash_gray-50 text-ash_gray-700 border border-ash_gray-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                      {queryResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Explanation */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-dark_purple-500 mb-8">
            What's happening under the hood
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-dark_purple-500 mb-3">XSS Prevention</h3>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Without protection, HTML and JavaScript in user input executes directly in the browser.
                </p>
                <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                  <span className="text-gray-500">// Vulnerable</span><br />
                  element.innerHTML = userInput;<br /><br />
                  <span className="text-gray-500">// Protected</span><br />
                  element.innerHTML = sanitize(userInput);
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-dark_purple-500 mb-3">SQL Injection Prevention</h3>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Without protection, user input becomes part of the SQL command structure.
                </p>
                <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                  <span className="text-gray-500">// Vulnerable</span><br />
                  query = "SELECT * WHERE user='" + input + "'";<br /><br />
                  <span className="text-gray-500">// Protected</span><br />
                  query = "SELECT * WHERE user=?";<br />
                  params = [input];
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-dark_purple-500 mb-4">
            Explore more attack vectors
          </h2>
          <p className="text-gray-600 mb-8">
            The full playground includes CSRF, rate limiting, path traversal, and more.
          </p>
          <Link
            to="/playground"
            className="inline-block px-8 py-3 bg-dark_purple-500 text-white rounded-xl font-medium hover:bg-dark_purple-600 transition-all"
          >
            Open Full Security Lab
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;