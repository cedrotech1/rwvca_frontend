import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api/authService';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const sendCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message || 'If this email is registered, you will receive a code shortly.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not send reset code');
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authService.verifyCode({ email: email.trim(), code: code.trim() });
      setMessage(res.message || 'Code verified. Choose a new password.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid reset code');
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        code: code.trim(),
        password,
      });
      setMessage(res.message || 'Password updated. You can sign in now.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message || 'If this email is registered, you will receive a code shortly.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full space-y-4">
        <div className="flex items-center gap-3">
          <img src="/rwvca-logo.png" alt="RWVCA" className="h-10" />
          <div>
            <h1 className="text-xl font-bold text-[#2f5d31]">Reset password</h1>
            <p className="text-xs text-gray-500">
              {step === 1 && 'Enter your account email to receive a code'}
              {step === 2 && 'Enter the 6-digit code from your email'}
              {step === 3 && 'Choose a new password'}
            </p>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">{message}</div>}

        {step === 1 && (
          <form onSubmit={sendCode} className="space-y-4">
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            <button type="submit" disabled={loading} className="w-full bg-[#2f5d31] text-white py-2 rounded disabled:opacity-50">
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={checkCode} className="space-y-4">
            <input className="w-full border rounded px-3 py-2 bg-gray-50" type="email" value={email} readOnly />
            <input
              className="w-full border rounded px-3 py-2 tracking-[0.3em] text-center text-lg"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter code"
              autoFocus
            />
            <button type="submit" disabled={loading || code.length < 4} className="w-full bg-[#2f5d31] text-white py-2 rounded disabled:opacity-50">
              {loading ? 'Checking...' : 'Verify code'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-gray-500" onClick={() => { setStep(1); setCode(''); setError(''); setMessage(''); }}>
                Change email
              </button>
              <button type="button" className="text-[#2f5d31]" disabled={loading} onClick={resendCode}>
                Resend code
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={savePassword} className="space-y-4">
            <div className="relative">
              <input
                className="w-full border rounded px-3 py-2 pr-16"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              className="w-full border rounded px-3 py-2"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <button type="submit" disabled={loading} className="w-full bg-[#2f5d31] text-white py-2 rounded disabled:opacity-50">
              {loading ? 'Saving...' : 'Update password'}
            </button>
          </form>
        )}

        <Link to="/login" className="inline-block text-sm text-[#2f5d31]">Back to login</Link>
      </div>
    </div>
  );
};
