import React from 'react';

export const Product = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Product Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your product catalog and inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-[#2f5d31] flex items-center justify-center">
              <span className="text-gray-500">Product Image {item}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">Product {item}</h3>
              <p className="text-sm text-gray-600 mt-1">Description for product {item}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-[#2f5d31]">${item * 99}</span>
                <span className="text-sm text-green-600">In Stock</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
