import { Link } from 'react-router-dom';

export const AccessDenied = () => (
  <div className="bg-white rounded-xl shadow-sm p-10 text-center">
    <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
    <p className="mt-3 text-gray-600">Your role does not have access to this page in the PHP staff menu.</p>
    <Link to="/dashboard" className="inline-block mt-6 bg-[#2f5d31] text-white px-5 py-2 rounded-lg">
      Back to dashboard
    </Link>
  </div>
);
