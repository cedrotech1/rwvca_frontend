import React from 'react';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page not found</h2>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for. Perhaps you've mistyped the URL? Be sure to check your spelling.
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f5d31]"
          >
            Go back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-[#2f5d31] hover:bg-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f5d31]"
          >
            Go to home
          </button>
        </div>
      </div>
    </div>
  );
};
