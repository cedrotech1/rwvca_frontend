import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeRedirectPath } from '../utils/appPaths';

export const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login({ email, password });
      if (result.success) {
        const redirect = sanitizeRedirectPath(searchParams.get('redirect'));
        navigate(redirect || '/dashboard', { replace: true });
      } else setError(result.message || 'Login failed');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <section className="w-full lg:w-1/2 bg-white flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <img src="/rwvca-logo.png" alt="RWVCA" className="h-12" />
            <div>
              <h4 className="m-0 text-sm font-bold text-[#2f5d31]">RWVCA</h4>
              <p className="m-0 text-xs text-gray-500">Staff dashboard</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Sign in</h1>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              className="block w-full px-4 py-3.5 bg-[#eceff3] rounded-[10px]"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full px-4 py-3.5 pr-12 bg-[#eceff3] rounded-[10px]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 text-sm text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex justify-between text-sm">
              <Link to="/" className="text-gray-500">Public website</Link>
              <Link to="/forgot-password" className="text-[#2f5d31]">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-[10px] text-sm font-semibold text-white bg-[#2f5d31] disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
      <aside className="hidden lg:flex w-1/2 items-center justify-center bg-[#2f5d31] text-white px-10">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="mt-4 text-white/90">
            Sign in to manage requisitions, documents, membership, assets, and website content.
          </p>
        </div>
      </aside>
    </div>
  );
};
