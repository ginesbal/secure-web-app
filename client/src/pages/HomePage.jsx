// FILE: client/src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      title: 'Website Hijacking Protection',
      description: 'Learn how hackers inject malicious code and how websites defend against it',
      icon: '🛡️',
      technical: 'XSS Protection'
    },
    {
      title: 'Database Security',
      description: 'See how attackers try to steal data and how modern systems prevent it',
      icon: '🔒',
      technical: 'SQL Injection Defense'
    },
    {
      title: 'Fake Request Blocking',
      description: 'Understand how websites verify that requests come from real users',
      icon: '🔑',
      technical: 'CSRF Protection'
    },
    {
      title: 'Too Many Attempts Protection',
      description: 'Discover how websites prevent automated attacks and password guessing',
      icon: '⏱️',
      technical: 'Rate Limiting'
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Choose a Security Feature',
      description: 'Pick any security topic you want to explore'
    },
    {
      step: '2',
      title: 'Turn Protection On or Off',
      description: 'Toggle security features to see the difference'
    },
    {
      step: '3',
      title: 'Try an Attack',
      description: 'Use safe, simulated attacks to test the system'
    },
    {
      step: '4',
      title: 'See Results Instantly',
      description: 'Watch how the system responds differently with protection'
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-50 to-white py-16 md:py-24">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Interactive Learning Platform
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Learn How Websites
              <span className="text-indigo-600"> Stay Safe</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Ever wondered how websites protect your data from hackers?
              Explore real security features through hands-on examples - no technical knowledge required!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/playground" className="btn-primary">
                Start Learning →
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">
              Learning about web security is as easy as 1-2-3-4
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You'll Learn</h2>
            <p className="text-lg text-gray-600">
              Explore common security features that protect millions of websites
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card hover-lift">
                <div className="p-6">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {feature.description}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium">
                    Technical term: {feature.technical}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try It Section */}
      <section className="section">
        <div className="container-narrow text-center">
          <div className="card-flat p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to See It in Action?</h2>
            <p className="text-lg text-gray-600 mb-8">
              No downloads, no setup, no technical knowledge needed.
              Learn at your own pace.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/playground" className="btn-primary">
                Try the Interactive Demo
              </Link>
              {!user && (
                <Link to="/register" className="btn-secondary">
                  Create Free Account
                </Link>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-6">
              100% free and no credit card required because I have not implemented payments yet. :P
            </p>
          </div>
        </div>
      </section>

      {/* Test Accounts */}
      <section className="section bg-gray-50">
        <div className="container-narrow">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Want to Try Different Access Levels?</h2>
            <p className="text-gray-600">Use these demo accounts to explore.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-4 border border-gray-300">
              <div className="badge badge-primary mb-3">Basic User</div>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Username:</span> <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">user</code></p>
                <p><span className="text-gray-500">Password:</span> <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">user123</code></p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-300">
              <div className="badge badge-danger mb-3">Administrator</div>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Username:</span> <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">admin</code></p>
                <p><span className="text-gray-500">Password:</span> <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">admin123</code></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section">
        <div className="container-narrow">
          <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>

          <div className="space-y-4">
            <div className="card">
              <div className="p-6">
                <h3 className="font-semibold mb-2">Do I need to know how to code?</h3>
                <p className="text-gray-600">
                  Not at all! This is a website designed by a recent graduate student (me) to help beginners understand
                  basic web security concepts through simple, interactive examples.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="p-6">
                <h3 className="font-semibold mb-2">Is it safe to try the "attacks"?</h3>
                <p className="text-gray-600">
                  Absolutely! All demonstrations happen in a controlled environment. You're not actually
                  attacking anything - just seeing simulations of how attacks work and how they're prevented.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="p-6">
                <h3 className="font-semibold mb-2">Why did you make a web security website?</h3>
                <p className="text-gray-600">
                  Understanding basic web security helps you say safer online, make better decisions about
                  which websites to trust, and appreciate the technology that protects your data every day. Plus,
                  it's a good way for me to practice my development skills!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;