import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api/config';
import { getMediaUrl } from '../utils/mediaUrl';
import { getReportCampusLabel, canEditReportContent, canPublishReport } from '../utils/reportPermissions';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft,
  User,
  Calendar,
  Activity,
  Eye,
  Edit,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Hash,
  Building,
  Type,
  Upload,
  Briefcase,
  Tag,
  MessageSquare,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useReports } from '../contexts/ReportsContext';
import { useNotification } from '../contexts/NotificationContext';
import { ViewReportHeading } from '../components/PageHeading';
import { 
  detectReportType, 
  getReportTypeDisplayName, 
  getReportTypeBadgeColor, 
  getReportTypeIcon,
  getReportContentDescription 
} from '../utils/reportTypeDetector';
import {
  getReportTableColumns,
  getReportCellValue,
  exportReportTableToExcel,
} from '../utils/reportTableUtils';
import { sanitizeHtml } from '../utils/sanitize';
import ReportComments from '../components/ReportComments';
import { commentService } from '../services/api/commentService';
import { formatUserRole } from '../utils/userRoleLabels';

const getReportServiceCategory = (service) =>
  service?.category || service?.serviceCategory || null;

const getReportServiceCategoryName = (service) => {
  const name = getReportServiceCategory(service)?.name;
  return name ? String(name).replace(/_/g, ' ') : null;
};

export const ViewReportPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { getReportById, exportReport, changeReportStatus } = useReports();
  const { showSuccess, showError } = useNotification();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('data'); // 'data', 'details', 'history', 'comments'
  const [expandedUsers, setExpandedUsers] = useState({}); // Track which user groups are expanded
  const [commentCount, setCommentCount] = useState(0);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [filePreviewLoading, setFilePreviewLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const reportLoadedRef = useRef(false);

  const role = currentUser?.role;
  const permissions = {
    canView: ['admin', 'head_quarter', 'warefare', 'it', 'wadden', 'dvc'].includes(role),
    canEdit: canEditReportContent(role, report),
    canExport: ['admin', 'head_quarter', 'warefare', 'it', 'wadden', 'dvc'].includes(role),
    canPublish: canPublishReport(role) && role !== 'head_quarter',
  };
  const showPublishButton = permissions.canPublish && report?.status === 'draft';

  useEffect(() => {
    reportLoadedRef.current = false;
    setReport(null);
    setError(null);
    setLoading(true);
    setFilePreviewUrl((prev) => {
      if (prev) window.URL.revokeObjectURL(prev);
      return null;
    });

    if (authLoading) {
      return;
    }

    if (!currentUser) {
      setLoading(false);
      setError('Please sign in to view this report.');
      return;
    }

    if (!permissions.canView) {
      setLoading(false);
      setError('You do not have permission to view this report.');
      return;
    }

    const loadReport = async () => {
      if (reportLoadedRef.current) return;
      try {
        reportLoadedRef.current = true;
        const reportData = await getReportById(id);
        setReport(reportData);
      } catch (err) {
        console.error('Error loading report:', err);
        const apiMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load report';
        setError(apiMessage);
        reportLoadedRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    loadReport();

    return () => {
      reportLoadedRef.current = false;
    };
  }, [id, currentUser?.id, currentUser?.role, authLoading]); // reload when auth/role ready

  useEffect(() => {
    let cancelled = false;

    const loadCommentCount = async () => {
      if (!id || !currentUser || !permissions.canView) {
        setCommentCount(0);
        return;
      }

      try {
        const response = await commentService.getReportCommentCount(id);
        if (!cancelled) {
          setCommentCount(response.data?.count ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setCommentCount(0);
        }
      }
    };

    loadCommentCount();

    return () => {
      cancelled = true;
    };
  }, [id, currentUser?.id, currentUser?.role, permissions.canView]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const loadPreview = async () => {
      if (!report?.id || !(report?.fileName || report?.filePath)) {
        setFilePreviewUrl(null);
        return;
      }

      const mime = String(report.fileType || '').toLowerCase();
      const name = String(report.fileName || report.filePath || '').toLowerCase();
      const canPreview =
        mime.startsWith('image/') ||
        mime === 'application/pdf' ||
        /\.(png|jpe?g|gif|webp|pdf)$/i.test(name);

      if (!canPreview) {
        setFilePreviewUrl(null);
        return;
      }

      setFilePreviewLoading(true);
      try {
        // Prefer authenticated export (works behind API proxy)
        const response = await apiClient.get(`/reports/${report.id}/export`, {
          responseType: 'blob',
        });
        if (cancelled) return;

        const contentType = response.headers?.['content-type'] || '';
        if (contentType.includes('application/json')) {
          throw new Error('Export returned JSON instead of file');
        }

        objectUrl = window.URL.createObjectURL(
          new Blob([response.data], {
            type: report.fileType || response.data.type || 'application/octet-stream',
          })
        );
        setFilePreviewUrl(objectUrl);
      } catch (err) {
        console.error('Error loading file preview via export, trying media URL:', err);
        // Fallback: direct /uploads URL with auth token (report.fileUrl or filePath)
        const media =
          getMediaUrl(report.fileUrl) ||
          getMediaUrl(report.filePath) ||
          getMediaUrl(
            report.filePath
              ? `uploads/reports/${String(report.filePath).split(/[/\\]/).pop()}`
              : ''
          );
        if (!cancelled) {
          setFilePreviewUrl(media || null);
        }
      } finally {
        if (!cancelled) setFilePreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [report?.id, report?.fileName, report?.fileType, report?.filePath, report?.fileUrl]);

  const handleExport = async () => {
    try {
      await exportReport(id, report);
      showSuccess('Report exported successfully!');
    } catch (error) {
      showError('Failed to export report');
    }
  };

  const handleQuickPublish = async () => {
    if (!report) return;

    setPublishLoading(true);
    try {
      const response = await changeReportStatus(report.id, 'published');
      if (response.success) {
        showSuccess('Report published. Headquarters has been notified.');
        setShowPublishModal(false);
        const updated = await getReportById(report.id);
        setReport(updated);
      } else {
        showError(response.message || 'Failed to publish report');
      }
    } catch (err) {
      console.error('Error publishing report:', err);
      showError(err?.response?.data?.message || err?.message || 'Failed to publish report');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleDownloadFile = async (filePath, fileName) => {
    try {
      // Use the same endpoint as the main download button
      const response = await apiClient.get(`/reports/${report.id}/export`, {
        responseType: 'blob'
      });
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: report.fileType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a download link
      const fileLink = document.createElement('a');
      fileLink.setAttribute('href', url);
      fileLink.setAttribute('download', fileName);
      fileLink.style.visibility = 'hidden';
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Downloading ${fileName}...`);
    } catch (error) {
      console.error('Error downloading file:', error);
      showError('Failed to download file');
    }
  };

  // Group activity logs by user
  const groupActivityLogsByUser = () => {
    if (!report || !report.activityLogs) return {};
    
    return report.activityLogs.reduce((groups, log) => {
      const userId = log.user?.id || 'unknown';
      const userName = log.user?.names || 'Unknown User';
      const userRole = log.user?.role || 'unknown';
      
      if (!groups[userId]) {
        groups[userId] = {
          id: userId,
          name: userName,
          role: userRole,
          logs: []
        };
      }
      
      groups[userId].logs.push(log);
      return groups;
    }, {});
  };

  const groupedLogs = groupActivityLogsByUser();
  const userLogEntries = Object.values(groupedLogs);

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const exportActivityLogs = () => {
    if (!report?.activityLogs) return;
    
    const csvContent = [
      ['User', 'Action', 'Details', 'Date', 'Time', 'Role'].join(','),
      ...report.activityLogs.map(log => [
        log.user?.names || 'N/A',
        log.action,
        log.actionDetails,
        formatDate(log.timestamp),
        formatTime(log.timestamp),
        log.user?.role || 'N/A'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${id}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Activity logs exported successfully!');
  };

  const exportTableData = () => {
    const result = exportReportTableToExcel(report, report.title);

    if (result.success) {
      showSuccess('Data exported successfully!');
    } else {
      showError(result.message || 'No table data available to export');
    }
  };

  // Export text report to Word document
  const exportTextReportToWord = () => {
    if (!report.text_report) {
      showError('No text content available to export');
      return;
    }

    // Create Word document HTML structure
    const wordContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title || 'Report'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #2f5d31; margin-bottom: 10px; }
          .metadata { margin-bottom: 30px; }
          .metadata-item { margin-bottom: 8px; }
          .metadata-label { font-weight: bold; color: #333; }
          .content { margin-top: 20px; line-height: 1.6; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${report.title || 'Report'}</div>
          <div class="subtitle">${report.description || ''}</div>
        </div>
        
        <div class="metadata">
          <div class="metadata-item">
            <span class="metadata-label">Created by:</span> ${report.uploader?.names || 'Unknown'}
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Campus:</span> ${getReportCampusLabel(report)}
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Created Date:</span> ${formatDate(report.createdAt)}
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Updated Date:</span> ${formatDate(report.updatedAt)}
          </div>
          ${report.service ? `
            <div class="metadata-item">
              <span class="metadata-label">Service:</span> ${report.service.name}
            </div>
          ` : ''}
          ${getReportServiceCategory(report.service) ? `
            <div class="metadata-item">
              <span class="metadata-label">Category:</span> ${getReportServiceCategoryName(report.service) || ''}
            </div>
          ` : ''}
          <div class="metadata-item">
            <span class="metadata-label">Status:</span> ${report.status || ''}
          </div>
        </div>
        
        <div class="content">
          ${report.text_report}
        </div>
      </body>
      </html>
    `;

    // Create blob and download as .doc file
    const blob = new Blob([wordContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.title || 'text_report'}_${formatDate(new Date()).replace(/[/:]/g, '-')}.doc`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Text report exported to Word successfully!');
  };

  // Download original file only
  const downloadOriginalFile = async () => {
    if (!report.fileName && !report.filePath) {
      showError('No file available to download');
      return;
    }

    try {
      const response = await apiClient.get(`/reports/${report.id}/export`, {
        responseType: 'blob'
      });
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: report.fileType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a download link
      const fileLink = document.createElement('a');
      fileLink.setAttribute('href', url);
      fileLink.setAttribute('download', report.fileName);
      fileLink.style.visibility = 'hidden';
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      showSuccess('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to existing export function
      handleExport();
    }
  };

  // Export metadata only
  const exportFileMetadata = () => {
    if (!report.fileName) {
      showError('No file available to export metadata');
      return;
    }

    try {
      // Create a metadata document
      const metadataContent = `
REPORT METADATA
================

Title: ${report.title || 'Untitled Report'}
Description: ${report.description || 'No description'}
Created by: ${report.uploader?.names || 'Unknown'}
Campus: ${getReportCampusLabel(report)}
Created Date: ${formatDate(report.createdAt)}
Updated Date: ${formatDate(report.updatedAt)}
Service: ${report.service?.name || 'N/A'}
Category: ${getReportServiceCategoryName(report.service) || 'N/A'}
Status: ${report.status || 'Unknown'}

FILE INFORMATION
================
Original File Name: ${report.fileName}
File Path: ${report.filePath || 'N/A'}
File Size: ${report.fileSize ? `${(report.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}
File Type: ${report.fileType || 'Unknown'}

NOTES
=====
This file was exported from the WARS reporting system.
Exported on: ${formatDate(new Date())}

${report.challenge ? `
CHALLENGES
==========
${report.challenge}
` : ''}

${report.wayForward ? `
WAY FORWARD
===========
${report.wayForward}
` : ''}
      `;

      // Download metadata file
      const metadataBlob = new Blob([metadataContent], { type: 'text/plain;charset=utf-8;' });
      const metadataLink = document.createElement('a');
      const metadataUrl = URL.createObjectURL(metadataBlob);
      const metadataFileName = `${report.title || 'report'}_metadata_${formatDate(new Date()).replace(/[/:]/g, '-')}.txt`;
      
      metadataLink.setAttribute('href', metadataUrl);
      metadataLink.setAttribute('download', metadataFileName);
      metadataLink.style.visibility = 'hidden';
      document.body.appendChild(metadataLink);
      metadataLink.click();
      document.body.removeChild(metadataLink);
      
      showSuccess('Metadata exported successfully!');
    } catch (error) {
      console.error('Error exporting metadata:', error);
      showError('Failed to export metadata');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeIconComponent = (report) => {
    const type = detectReportType(report);
    const iconName = getReportTypeIcon(type);
    
    switch (iconName) {
      case 'Type':
        return Type;
      case 'Upload':
        return Upload;
      case 'FileSpreadsheet':
        return FileSpreadsheet;
      default:
        return FileText;
    }
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'status_changed':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'viewed':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColorClass = (colorClass) => {
    switch (colorClass) {
      case 'field-change':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'header-change':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'file-change':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'data-modified':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'data-added':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'data-deleted':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f5d31] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Report not found'}</p>
          <button
            onClick={() => navigate('/reports')}
            className="mt-4 px-4 py-2 bg-[#2f5d31] text-white rounded hover:bg-[#004a6b]"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <ViewReportHeading 
        reportTitle={report?.title}
        actions={[
          ...(permissions.canEdit
            ? [{
                variant: 'outline',
                label: 'Edit',
                icon: <Edit className="h-4 w-4" />,
                onClick: () => navigate(`/reports/edit/${report.id}`),
              }]
            : []),
          ...(showPublishButton
            ? [{
                variant: 'success',
                label: publishLoading ? 'Publishing...' : 'Publish',
                icon: <CheckCircle className="h-4 w-4" />,
                onClick: () => setShowPublishModal(true),
                disabled: publishLoading,
              }]
            : []),
        ]}
      />

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h2>
              <p className="text-gray-600">{report.description}</p>
            </div>
            <div className="flex items-center flex-wrap gap-2 justify-end">
              {showPublishButton && (
                <button
                  type="button"
                  onClick={() => setShowPublishModal(true)}
                  disabled={publishLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  {publishLoading ? 'Publishing...' : 'Quick Publish'}
                </button>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                report.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {report.status}
              </span>
              {(() => {
                const IconComponent = getReportTypeIconComponent(report);
                return <IconComponent className="h-5 w-5 text-blue-600" />;
              })()}
            </div>
          </div>

          {/* Report Meta Info - Important Information */}

          {/* Report Meta Info - Important Information */}
          <div className="bg-gray-200 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Important Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center bg-white rounded-md px-3 py-2 ">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <span className="ml-2 text-gray-900">{report.uploader?.names || 'Unknown'}</span>
                </div>
              </div>
              <div className="flex items-center bg-white rounded-md px-3 py-2 ">
                <Building className="h-4 w-4 mr-2 text-blue-600" />
                <div>
                  <span className="font-medium text-gray-700">Campus:</span>
                  <span className="ml-2 text-gray-900">{getReportCampusLabel(report)}</span>
                </div>
              </div>
              <div className="flex items-center bg-white rounded-md px-3 py-2">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-900">{formatDate(report.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center bg-white rounded-md px-3 py-2 ">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                <div>
                  <span className="font-medium text-gray-700">Updated:</span>
                  <span className="ml-2 text-gray-900">{formatDate(report.updatedAt)}</span>
                </div>
              </div>
              {report.service && (
                <div className="flex items-center bg-white rounded-md px-3 py-2">
                  <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <span className="font-medium text-gray-700">Service:</span>
                    <span className="ml-2 text-gray-900 font-medium">{report.service.name}</span>
                  </div>
                </div>
              )}
              {report.academicYear && (
                <div className="flex items-center bg-white rounded-md px-3 py-2">
                  <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <span className="font-medium text-gray-700">Academic Year:</span>
                    <span className="ml-2 text-gray-900 font-medium">{report.academicYear.label}</span>
                  </div>
                </div>
              )}
              {getReportServiceCategory(report.service) && (
                <div className="flex items-center bg-white rounded-md px-3 py-2 ">
                  <Tag className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-900 font-medium capitalize">
                      {getReportServiceCategoryName(report.service) || 'No category'}
                    </span>
                  </div>
                </div>
              )}
              {report.fileName && (
                <div className="flex items-center bg-white rounded-md px-3 py-2 ">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <span className="font-medium text-gray-700">File:</span>
                    <span className="ml-2 text-gray-900">{report.fileName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white  rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('data')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-[#2f5d31] text-[#2f5d31]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {(() => {
                const type = detectReportType(report);
                const IconComponent = getReportTypeIconComponent(report);
                const typeName = getReportTypeDisplayName(type);
                return (
                  <>
                    <IconComponent className="h-4 w-4 inline mr-2" />
                    {typeName.replace(' Report', '')}
                  </>
                );
              })()}
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-[#2f5d31] text-[#2f5d31]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Info className="h-4 w-4 inline mr-2" />
                Details
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-[#2f5d31] text-[#2f5d31]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Comments ({commentCount})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-[#2f5d31] text-[#2f5d31]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-2" />
                Activity History ({report.activityLogs?.length || 0})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Data/File Tab */}
            {activeTab === 'data' && (
              <div>
                {(report.fileName || report.filePath) ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">File Information</h3>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <FileSpreadsheet className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{report.fileName || 'Uploaded file'}</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {report.fileSize ? `File size: ${(report.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        File type: {report.fileType || 'Unknown'}
                      </p>
                      <div className="flex justify-center space-x-3 mb-6">
                        <button
                          onClick={downloadOriginalFile}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </button>
                        <button
                          onClick={exportFileMetadata}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export Metadata
                        </button>
                      </div>

                      {filePreviewLoading && (
                        <p className="text-sm text-gray-500">Loading preview…</p>
                      )}
                      {!filePreviewLoading && filePreviewUrl && (
                        <div className="mt-2 text-left">
                          {String(report.fileType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(report.fileName || '') ? (
                            <a
                              href={filePreviewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                              title="Open image in new tab"
                            >
                              <img
                                src={filePreviewUrl}
                                alt={report.fileName || 'Report file'}
                                className="max-h-[70vh] mx-auto rounded border border-gray-200 bg-white cursor-zoom-in"
                              />
                            </a>
                          ) : (
                            <iframe
                              title={report.fileName || 'Report preview'}
                              src={filePreviewUrl}
                              className="w-full h-[70vh] rounded border border-gray-200 bg-white"
                            />
                          )}
                        </div>
                      )}
                      {!filePreviewLoading && !filePreviewUrl && (
                        <p className="text-sm text-gray-500">
                          Preview is not available for this file type. Use Download File to open it.
                        </p>
                      )}
                    </div>
                  </div>
                ) : report.text_report ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Text Report Content</h3>
                      <button
                        onClick={exportTextReportToWord}
                        className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export to Word
                      </button>
                    </div>
                    <div className="border border-gray-300 rounded-lg">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Rich Text Content</span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <FileText className="h-4 w-4" />
                            <span>Text Report</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-white">
                        <div className="rich-text-editor max-w-none">
                          {sanitizeHtml(report.text_report) ? (
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(report.text_report) }} />
                          ) : (
                            <div className="text-gray-400 italic">No content available</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Data Table</h3>
                      <button
                        onClick={exportTableData}
                        className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                        disabled={!report.data?.length}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export to Excel
                      </button>
                    </div>
                    {(!report.data || !Array.isArray(report.data) || report.data.length === 0 || getReportTableColumns(report).length === 0) ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium">No report content to display</p>
                        <p className="text-sm text-gray-500 mt-1">
                          This report has no file, text content, or table rows yet.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-gray-300 rounded-lg">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {getReportTableColumns(report).map((field, index) => (
                                <th key={index} className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-300 border-r">
                                  {field.label} {field.required && <span className="text-red-500 text-xs">*</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {report.data?.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                {getReportTableColumns(report).map((field, colIndex) => {
                                  const cellValue = getReportCellValue(row, field, colIndex);

                                  return (
                                    <td key={colIndex} className="px-4 py-2 border-b border-gray-200 border-r text-sm text-gray-900">
                                      {cellValue}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Report Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Details</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Title:</dt>
                          <dd className="text-sm font-medium text-gray-900">{report.title}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Status:</dt>
                          <dd className="text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {report.status}
                            </span>
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Type:</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {report.fileName ? 'File Report' : report.text_report ? 'Text Report' : 'Table Report'}
                          </dd>
                        </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Academic Year:</dt>
                        <dd className="text-sm font-medium text-gray-900">{report.academicYear?.label || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Total Rows:</dt>
                          <dd className="text-sm font-medium text-gray-900">{report.totalRows || report.data?.length || 0}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">User Information</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Created by:</dt>
                          <dd className="text-sm font-medium text-gray-900">{report.uploader?.names || 'Unknown'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Email:</dt>
                          <dd className="text-sm text-gray-900">{report.uploader?.email || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Role:</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {formatUserRole(report.uploader?.role) || 'Unknown'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Campus:</dt>
                          <dd className="text-sm font-medium text-gray-900">{getReportCampusLabel(report)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {report.fileName && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">File Information</h4>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">File Name:</dt>
                        <dd className="text-sm font-medium text-gray-900">{report.fileName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">File Size:</dt>
                        <dd className="text-sm font-medium text-gray-900">{report.fileSize ? `${(report.fileSize / 1024).toFixed(2)} KB` : 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">File Type:</dt>
                        <dd className="text-sm font-medium text-gray-900">{report.fileType || 'Unknown'}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {report.description || 'No description provided'}
                  </p>
                </div>

                {/* Service Information */}
                {report.service && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Service Information</h4>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Service Name:</dt>
                        <dd className="text-sm font-medium text-gray-900">{report.service.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Category:</dt>
                        <dd className="text-sm font-medium text-gray-900 capitalize">
                          {getReportServiceCategoryName(report.service) || 'No category'}
                        </dd>
                      </div>
                      {report.service.description && (
                        <div className="md:col-span-2">
                          <dt className="text-sm text-gray-600">Service Description:</dt>
                          <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">
                            {report.service.description}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Challenge Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Challenge</h4>
                  <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {report.challenge ? (
                      <p className="whitespace-pre-wrap">{report.challenge}</p>
                    ) : (
                      <p className="text-gray-400 italic">No challenges reported</p>
                    )}
                  </div>
                </div>

                {/* Way Forward Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Way Forward</h4>
                  <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {report.wayForward ? (
                      <p className="whitespace-pre-wrap">{report.wayForward}</p>
                    ) : (
                      <p className="text-gray-400 italic">No way forward specified</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Comments & Replies</h3>
                </div>
                <ReportComments
                  reportId={id}
                  currentUser={currentUser}
                  onCountChange={setCommentCount}
                />
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Activity History</h3>
                  <button
                    onClick={exportActivityLogs}
                    className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export Logs
                  </button>
                </div>
                <div className="space-y-3">
                  {userLogEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No activity logs available</p>
                    </div>
                  ) : (
                    userLogEntries.map((userGroup) => {
                      const isExpanded = expandedUsers[userGroup.id] || false;
                      const viewLogs = userGroup.logs.filter(log => log.action === 'viewed');
                      const otherLogs = userGroup.logs.filter(log => log.action !== 'viewed');
                      
                      return (
                        <div key={userGroup.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* User Header - Always Visible */}
                          <button
                            onClick={() => toggleUserExpansion(userGroup.id)}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <User className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900">{userGroup.name}</p>
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Hash className="h-3 w-3 mr-1" />
                                    {userGroup.logs.length} activities
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {userGroup.role}
                                  </span>
                                  {viewLogs.length > 0 && (
                                    <span className="flex items-center">
                                      <Eye className="h-3 w-3 mr-1" />
                                      {viewLogs.length} views
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {isExpanded ? 'Click to collapse' : 'Click to expand'}
                              </span>
                              <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </button>
                          
                          {/* Collapsible Content */}
                          {isExpanded && (
                            <div className="border-t border-gray-200">
                              {/* Summary Card for View Activities */}
                              {viewLogs.length > 0 && (
                                <div className="p-4 bg-blue-50 border-b border-gray-200">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Eye className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-medium text-blue-900">View Activity Summary</h4>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {viewLogs.length} view{viewLogs.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <div className="text-sm text-blue-800">
                                    <p>First viewed: {formatDate(viewLogs[viewLogs.length - 1].timestamp)}</p>
                                    <p>Last viewed: {formatDate(viewLogs[0].timestamp)}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Other Activities */}
                              <div className="p-4 space-y-3">
                                {otherLogs.map((log) => (
                                  <div key={log.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        {getChangeIcon(log.action)}
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{log.actionDetails}</p>
                                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center">
                                              <Calendar className="h-3 w-3 mr-1" />
                                              {formatDate(log.timestamp)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Change Details */}
                                    {log.newValues?.changes && (
                                      <div className="mt-2 space-y-2">
                                        {log.newValues.changes.map((change, changeIndex) => (
                                          <div key={changeIndex} className={`text-sm p-2 rounded border ${getChangeColorClass(change.colorClass)}`}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-medium text-xs">{change.displayText}</span>
                                              <span className="text-xs opacity-75">{change.changeType}</span>
                                            </div>
                                            
                                            {/* Field Changes */}
                                            {change.type === 'field' && (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                <div>
                                                  <span className="font-medium">Previous:</span>
                                                  <div className="bg-white rounded p-1 mt-1">
                                                    {change.previous || 'N/A'}
                                                  </div>
                                                </div>
                                                <div>
                                                  <span className="font-medium">New:</span>
                                                  <div className="bg-white rounded p-1 mt-1">
                                                    {change.new || 'N/A'}
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* Header Changes */}
                                            {change.type === 'headers' && change.details && (
                                              <div className="space-y-1 text-xs">
                                                {change.details.added?.length > 0 && (
                                                  <div>
                                                    <span className="font-medium text-green-600">Added:</span>
                                                    <div className="bg-white rounded p-1 mt-1">
                                                      {change.details.added.join(', ')}
                                                    </div>
                                                  </div>
                                                )}
                                                {change.details.removed?.length > 0 && (
                                                  <div>
                                                    <span className="font-medium text-red-600">Removed:</span>
                                                    <div className="bg-white rounded p-1 mt-1">
                                                      {change.details.removed.join(', ')}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {/* File Changes */}
                                            {change.type === 'file' && (
                                              <div className="space-y-2 text-xs">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  <div>
                                                    <span className="font-medium">Previous File:</span>
                                                    <div className="bg-white rounded p-1 mt-1">
                                                      <div className="space-y-1">
                                                        <div className="flex justify-between">
                                                          <span className="font-medium">Name:</span>
                                                          <span>{change.previous?.fileName || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="font-medium">Size:</span>
                                                          <span>{change.previous?.fileSize ? `${(change.previous.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</span>
                                                        </div>
                                                        {change.previous?.filePath && (
                                                          <div className="mt-1">
                                                            <button
                                                              onClick={() => handleDownloadFile(change.previous.filePath, change.previous.fileName)}
                                                              className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                                                              title="Download previous file"
                                                            >
                                                              <Download className="h-3 w-3" />
                                                              <span>Download Previous</span>
                                                            </button>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <span className="font-medium">New File:</span>
                                                    <div className="bg-white rounded p-1 mt-1">
                                                      <div className="space-y-1">
                                                        <div className="flex justify-between">
                                                          <span className="font-medium">Name:</span>
                                                          <span>{change.new?.fileName || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                          <span className="font-medium">Size:</span>
                                                          <span>{change.new?.fileSize ? `${(change.new.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</span>
                                                        </div>
                                                        {change.new?.filePath && (
                                                          <div className="mt-1">
                                                            <button
                                                              onClick={() => handleDownloadFile(change.new.filePath, change.new.fileName)}
                                                              className="flex items-center space-x-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
                                                              title="Download new file"
                                                            >
                                                              <Download className="h-3 w-3" />
                                                              <span>Download Current</span>
                                                            </button>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* Data Changes */}
                                            {change.type === 'data' && change.details && (
                                              <div className="space-y-1 text-xs">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  <div>
                                                    <span className="font-medium">Previous:</span>
                                                    <div className="bg-white rounded p-1 mt-1 max-h-24 overflow-y-auto">
                                                      {Object.entries(change.details.previous || {}).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between py-1">
                                                          <span className="font-medium">{key}:</span>
                                                          <span>{value || 'N/A'}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <span className="font-medium">New:</span>
                                                    <div className="bg-white rounded p-1 mt-1 max-h-24 overflow-y-auto">
                                                      {Object.entries(change.details.new || {}).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between py-1">
                                                          <span className="font-medium">{key}:</span>
                                                          <span>{value || 'N/A'}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                {/* Field-level changes */}
                                                {change.details.fieldChanges?.length > 0 && (
                                                  <div>
                                                    <span className="font-medium">Field Changes:</span>
                                                    <div className="bg-white rounded p-1 mt-1">
                                                      {change.details.fieldChanges.map((fieldChange, fieldIndex) => (
                                                        <div key={fieldIndex} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                                                          <span className="font-medium">{fieldChange.field}:</span>
                                                          <span className="text-red-600 line-through">{fieldChange.oldValue || 'N/A'}</span>
                                                          <span className="text-green-600">→</span>
                                                          <span className="text-green-600">{fieldChange.newValue || 'N/A'}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Simple previous/new values for non-detailed changes */}
                                    {log.previousValues && !log.newValues?.changes && (
                                      <div className="mt-2 text-xs">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <div>
                                            <span className="font-medium">Previous:</span>
                                            <div className="bg-red-50 border border-red-200 rounded p-1 mt-1">
                                              {JSON.stringify(log.previousValues, null, 2)}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="font-medium">New:</span>
                                            <div className="bg-green-50 border border-green-200 rounded p-1 mt-1">
                                              {JSON.stringify(log.newValues, null, 2)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {otherLogs.length === 0 && viewLogs.length > 0 && (
                                  <div className="text-center py-4 text-gray-500 text-sm">
                                    Only view activities recorded for this user
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showPublishModal && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Publish Report
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to publish &quot;{report?.title}&quot;? Headquarters will be notified.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={publishLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickPublish}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                disabled={publishLoading}
              >
                {publishLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewReportPage;
