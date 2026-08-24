import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api/authService';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    const res = await authService.forgotPassword(email);
    setMessage(res.message || 'If this email is registered, you will receive a code shortly.');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow max-w-md w-full space-y-4">
        <h1 className="text-xl font-bold text-[#2f5d31]">Reset password</h1>
        <input className="w-full border rounded px-3 py-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <button className="w-full bg-[#2f5d31] text-white py-2 rounded">Send code</button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
        <Link to="/login" className="text-sm text-[#2f5d31]">Back to login</Link>
      </form>
    </div>
  );
};
