import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { canPublishReport } from '../utils/reportPermissions';

export const CreateReportModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false,
  campuses = []
}) => {
  const { user: currentUser } = useAuth();
  const canPublish = canPublishReport(currentUser?.role);
  const [reportType, setReportType] = useState('data'); // 'data' or 'file'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    campus: '',
    file: null
  });
  const [headers, setHeaders] = useState(['Column 1']);
  const [rows, setRows] = useState([['']]);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'draft',
      campus: '',
      file: null
    });
    setHeaders(['Column 1']);
    setRows([['']]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.campus) {
      newErrors.campus = 'Campus is required';
    }
    if (reportType === 'data') {
      if (headers.some(h => !h.trim())) {
        newErrors.headers = 'All headers must have names';
      }
      if (rows.length === 0) {
        newErrors.rows = 'At least one row of data is required';
      }
    }
    if (reportType === 'file' && !formData.file) {
      newErrors.file = 'File is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const reportData = {
      ...formData,
      status: canPublish ? formData.status : 'draft',
      headers: reportType === 'data' ? headers : [],
      data: reportType === 'data' ? rows : [],
      isFileReport: reportType === 'file'
    };

    onSubmit(reportData);
  };

  const addHeader = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setRows(rows.map(row => [...row, '']));
  };

  const removeHeader = (index) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map(row => row.filter((_, i) => i !== index));
    setHeaders(newHeaders);
    setRows(newRows);
  };

  const updateHeader = (index, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const addRow = () => {
    setRows([...rows, new Array(headers.length).fill('')]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Report</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Report Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setReportType('data')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    reportType === 'data' 
                      ? 'border-[#2f5d31] bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">Data Report</div>
                  <div className="text-sm text-gray-500">Create table with data</div>
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('file')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    reportType === 'file' 
                      ? 'border-[#2f5d31] bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">File Report</div>
                  <div className="text-sm text-gray-500">Upload CSV/Excel file</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31] ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter report title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campus *</label>
                  <select
                    value={formData.campus}
                    onChange={(e) => setFormData(prev => ({ ...prev, campus: e.target.value }))}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31] ${
                      errors.campus ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Campus</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                  {errors.campus && (
                    <p className="mt-1 text-sm text-red-600">{errors.campus}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31]"
                  placeholder="Enter report description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                {canPublish ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-[#2f5d31] focus:border-[#2f5d31]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                ) : (
                  <div className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50">
                    Draft
                    <p className="text-xs text-gray-500 mt-1">
                      Campus welfare will publish after review (Headquarters notified).
                    </p>
                  </div>
                )}
              </div>

              {/* Data Report Section */}
              {reportType === 'data' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Report Data</h4>
                    <button
                      type="button"
                      onClick={addHeader}
                      className="flex items-center px-3 py-1 bg-[#2f5d31] text-white rounded-md text-sm hover:bg-[#004a6b]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Column
                    </button>
                  </div>

                  {/* Headers */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      {headers.map((header, index) => (
                        <div key={index} className="flex-1">
                          <input
                            type="text"
                            value={header}
                            onChange={(e) => updateHeader(index, e.target.value)}
                            className={`w-full px-2 py-1 text-sm border rounded ${
                              errors.headers ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={`Column ${index + 1}`}
                          />
                          {headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHeader(index)}
                              className="ml-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.headers && (
                      <p className="mt-1 text-sm text-red-600">{errors.headers}</p>
                    )}
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-2">
                    {rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex items-center space-x-2">
                        {row.map((cell, colIndex) => (
                          <input
                            key={colIndex}
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                          />
                        ))}
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(rowIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {errors.rows && (
                      <p className="text-sm text-red-600">{errors.rows}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center justify-center w-full py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </button>
                </div>
              )}

              {/* File Report Section */}
              {reportType === 'file' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">File Upload</h4>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {formData.file ? formData.file.name : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-xs text-gray-500">Any file type — max 50MB</span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.file && (
                    <p className="mt-2 text-sm text-red-600">{errors.file}</p>
                  )}
                </div>
              )}

              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                  {errors.general}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-[#2f5d31] text-white rounded-md hover:bg-[#004a6b] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
