import React, { useState } from 'react';
import { setupAdminUser } from '../utils/createAdminUser';
import toast from 'react-hot-toast';

const AdminSetup = () => {
  const [formData, setFormData] = useState({
    email: 'admin@cineverse.com',
    password: 'admin123456',
    name: 'Admin User'
  });
  const [loading, setLoading] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await setupAdminUser();
      toast.success('Admin user created successfully! Check console for details.');
    } catch (error) {
      console.error('Setup error:', error);
      if (error.message?.includes('14 seconds')) {
        toast.error('Rate limited. Please wait 14 seconds and try again, or use the SQL method below.');
      } else if (error.message?.includes('invalid')) {
        toast.error('Email validation failed. Try a different email or use the SQL method.');
      } else {
        toast.error('Failed to create admin user. Use the SQL method below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const sqlInstructions = `
-- STEP 1: First, sign up normally with your email at the main site
-- Go to http://localhost:5173 and create a regular account
-- Use any valid email (e.g., your real email or admin@example.com)

-- STEP 2: Run this SQL in your Supabase SQL Editor to make yourself admin:

UPDATE public.users 
SET is_admin = true, 
    display_name = '${formData.name}'
WHERE email = '${formData.email}';

-- STEP 3: Log in with your account and navigate to /admin
`;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center font-sans">
          Create Admin User
        </h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Method 1: Automatic */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 font-sans">Method 1: Automatic (May have issues)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2 font-sans">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Use a valid email like admin@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-pink-500 font-sans text-base"
                  required
                />
                <p className="text-gray-400 text-xs mt-1 font-sans">Try: admin@example.com or your real email</p>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2 font-sans">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-pink-500 font-sans text-base"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2 font-sans">
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-pink-500 font-sans text-base"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50 font-sans font-medium"
              >
                {loading ? 'Creating Admin User...' : 'Try Automatic Creation'}
              </button>
            </form>
          </div>

          {/* Method 2: Manual SQL */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 font-sans">Method 2: Manual SQL (Recommended)</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-700 rounded">
                <h3 className="text-white font-medium mb-2 font-sans">Instructions:</h3>
                <ol className="text-gray-300 text-sm space-y-1 font-sans">
                  <li>1. Go to your main site and sign up normally</li>
                  <li>2. Use any valid email (your real email works fine)</li>
                  <li>3. Copy the SQL below</li>
                  <li>4. Go to Supabase Dashboard → SQL Editor</li>
                  <li>5. Paste and run the SQL (update email in SQL)</li>
                  <li>6. Log in and navigate to /admin</li>
                </ol>
              </div>
              
              <button
                onClick={() => setShowSQL(!showSQL)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-sans font-medium"
              >
                {showSQL ? 'Hide SQL' : 'Show SQL Code'}
              </button>
              
              {showSQL && (
                <div className="p-4 bg-gray-900 rounded border border-gray-600">
                  <pre className="text-green-400 text-sm whitespace-pre-wrap overflow-x-auto font-mono">
                    {sqlInstructions}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(sqlInstructions)}
                    className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors font-sans"
                  >
                    Copy SQL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded">
          <h3 className="text-yellow-400 font-medium mb-2 font-sans">⚠️ Important Notes:</h3>
          <ul className="text-yellow-300 text-sm space-y-1 font-sans">
            <li>• If automatic signup fails, use the SQL method</li>
            <li>• You can use your real email for admin account</li>
            <li>• Method 2 (SQL) is more reliable and recommended</li>
            <li>• After setup, delete this page for security</li>
            <li>• Only admin users can access /admin routes</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded">
          <h3 className="text-blue-400 font-medium mb-2 font-sans">💡 Quick Setup:</h3>
          <ol className="text-blue-300 text-sm space-y-1 font-sans">
            <li>1. Go to <a href="http://localhost:5173" className="underline">http://localhost:5173</a> and sign up with your email</li>
            <li>2. Go to Supabase Dashboard → SQL Editor</li>
            <li>3. Run: <code className="bg-gray-700 px-1 rounded font-mono">UPDATE public.users SET is_admin = true WHERE email = 'your-email@example.com';</code></li>
            <li>4. Log in and go to /admin</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup; 