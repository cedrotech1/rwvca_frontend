import React from 'react';

export const Blog = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Blog Posts
        </h1>
        <p className="text-gray-900 mt-2">
          Manage and publish blog content.
        </p>
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-[#2f5d31] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 text-sm">IMG</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Blog Post Title {item}</h3>
                <p className="text-gray-900 mt-2">
                  This is a sample blog post excerpt. The full content would contain detailed information about the topic being discussed...
                </p>
                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Published: {new Date().toLocaleDateString()}</span>
                  <span>•</span>
                  <span>5 min read</span>
                  <span>•</span>
                  <span>1{item}2 views</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
