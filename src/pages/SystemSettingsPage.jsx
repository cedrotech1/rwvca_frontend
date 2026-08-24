import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  Globe,
  Mail,
  Server,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Database,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import { systemSettingsService } from '../services/api/systemSettingsService';
import { academicYearService } from '../services/api/academicYearService';
import { PageHeading } from '../components/PageHeading';

const TIMEZONE_OPTIONS = [
  'Africa/Kigali',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'UTC',
  'Europe/London',
  'America/New_York'
];

const emptyForm = {
  systemName: '',
  emailNotification: 'enabled',
  systemStatus: 'live',
  maintenanceMessage: '',
  timezone: 'Africa/Kigali'
};

const inputClass = (enabled) =>
  `block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2f5d31] focus:border-transparent ${
    enabled ? '' : 'bg-gray-50 text-gray-500 cursor-not-allowed'
  }`;

const StatusPreview = ({ formData }) => (
  <div className="bg-white shadow rounded-lg border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-gray-500">Current status</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{formData.systemName || '—'}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
          formData.systemStatus === 'live'
            ? 'bg-green-100 text-green-800'
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        {formData.systemStatus === 'live' ? (
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
        ) : (
          <Wrench className="h-3.5 w-3.5 mr-1" />
        )}
        {formData.systemStatus === 'live' ? 'Live' : 'Maintenance'}
      </span>
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
          formData.emailNotification === 'enabled'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        <Mail className="h-3.5 w-3.5 mr-1" />
        Email {formData.emailNotification}
      </span>
    </div>
  </div>
);

const SectionHeader = ({ icon, title, description }) => (
  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  </div>
);

export const SystemSettingsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { refreshSettings } = useSystemSettings();

  const canManageSettings = user?.role === 'admin' || user?.role === 'head_quarter';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [newAcademicYearLabel, setNewAcademicYearLabel] = useState('');
  const [activeAcademicYearId, setActiveAcademicYearId] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await systemSettingsService.getSystemSettings();

      if (response.success && response.data) {
        const { id, systemName, emailNotification, systemStatus, maintenanceMessage, timezone, updatedAt } =
          response.data;

        setSettingsId(id);
        setFormData({
          systemName: systemName || '',
          emailNotification: emailNotification || 'enabled',
          systemStatus: systemStatus || 'live',
          maintenanceMessage: maintenanceMessage || '',
          timezone: timezone || 'Africa/Kigali'
        });
        setLastUpdated(updatedAt);
        setActiveAcademicYearId(response.data.activeAcademicYearId ? String(response.data.activeAcademicYearId) : '');
      }

      const yearsResponse = await academicYearService.getAcademicYears();
      if (yearsResponse.success) {
        setAcademicYears(yearsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      showError(error.response?.data?.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canManageSettings) {
      showError('You do not have permission to update system settings');
      return;
    }

    if (!formData.systemName.trim()) {
      showError('System name is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        systemName: formData.systemName.trim(),
        emailNotification: formData.emailNotification,
        systemStatus: formData.systemStatus,
        maintenanceMessage:
          formData.systemStatus === 'maintenance'
            ? formData.maintenanceMessage.trim() || null
            : null,
        timezone: formData.timezone,
        activeAcademicYearId: activeAcademicYearId ? Number(activeAcademicYearId) : null,
      };

      const response = await systemSettingsService.updateSystemSettings(payload);

      if (response.success) {
        showSuccess(response.message || 'System settings updated successfully');
        await refreshSettings();
        if (response.data) {
          setSettingsId(response.data.id);
          setLastUpdated(response.data.updatedAt);
          setFormData({
            systemName: response.data.systemName || '',
            emailNotification: response.data.emailNotification || 'enabled',
            systemStatus: response.data.systemStatus || 'live',
            maintenanceMessage: response.data.maintenanceMessage || '',
            timezone: response.data.timezone || 'Africa/Kigali'
          });
        }
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      showError(error.response?.data?.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      setExporting(true);
      const response = await systemSettingsService.exportDatabase();

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const disposition = response.headers['content-disposition'] || '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] || `wars-database-export-${Date.now()}.zip`;

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess('Database exported successfully (JSON + SQL in ZIP)');
    } catch (error) {
      console.error('Error exporting database:', error);

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          showError(parsed.message || 'Failed to export database');
          return;
        } catch {
          // fall through
        }
      }

      showError(error.response?.data?.message || 'Failed to export database');
    } finally {
      setExporting(false);
    }
  };

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h2>
          <p className="text-gray-600">
            Only admin and head quarter users can manage system settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeading
        variant="management"
        title="System Settings"
        subtitle="Configure global application name, notifications, maintenance mode, and timezone"
        icon={<Settings className="h-6 w-6" />}
        showBack
        backTo="/dashboard"
        backText="Back to Dashboard"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2f5d31] border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <StatusPreview formData={formData} />

            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
              <SectionHeader
                icon={<Server className="h-5 w-5 text-[#2f5d31] mt-0.5" />}
                title="General"
                description="Core identity and availability of the platform"
              />

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.systemName}
                    onChange={(e) => handleChange('systemName', e.target.value)}
                    className={inputClass(true)}
                    placeholder="e.g. SWARS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.systemStatus}
                    onChange={(e) => handleChange('systemStatus', e.target.value)}
                    className={inputClass(true)}
                  >
                    <option value="live">Live</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Maintenance mode shows a notice on the login page.
                  </p>
                </div>

                <div />

                {formData.systemStatus === 'maintenance' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance message
                    </label>
                    <textarea
                      value={formData.maintenanceMessage}
                      onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                      rows={3}
                      className={inputClass(true)}
                      placeholder="Message shown to users during maintenance..."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
              <SectionHeader
                icon={<Mail className="h-5 w-5 text-[#2f5d31] mt-0.5" />}
                title="Notifications & region"
                description="Email delivery and default timezone"
              />

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email notifications <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.emailNotification}
                    onChange={(e) => handleChange('emailNotification', e.target.value)}
                    className={inputClass(true)}
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className={`${inputClass(true)} pl-10`}
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
              <SectionHeader
                icon={<Globe className="h-5 w-5 text-[#2f5d31] mt-0.5" />}
                title="Academic Years"
                description="Manage academic years and set the default active year for reports and filters"
              />

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Active academic year
                  </label>
                  <select
                    value={activeAcademicYearId}
                    onChange={(e) => setActiveAcademicYearId(e.target.value)}
                    className={inputClass(true)}
                  >
                    <option value="">Select active academic year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {academicYears.map((year) => (
                    <div key={year.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{year.label}</p>
                        {year.isActive && (
                          <span className="text-xs text-green-700">Active</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await academicYearService.activateAcademicYear(year.id);
                            if (response.success) {
                              setActiveAcademicYearId(String(year.id));
                              showSuccess(`Activated academic year ${year.label}`);
                              await loadSettings();
                            }
                          } catch (error) {
                            showError(error.response?.data?.message || 'Failed to activate academic year');
                          }
                        }}
                        className="text-sm text-[#2f5d31] hover:underline"
                      >
                        Set active
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAcademicYearLabel}
                    onChange={(e) => setNewAcademicYearLabel(e.target.value)}
                    placeholder="e.g. 2026/2027"
                    className={inputClass(true)}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newAcademicYearLabel.trim()) {
                        showError('Enter an academic year label');
                        return;
                      }
                      try {
                        const response = await academicYearService.createAcademicYear({
                          label: newAcademicYearLabel.trim(),
                        });
                        if (response.success) {
                          showSuccess('Academic year created');
                          setNewAcademicYearLabel('');
                          await loadSettings();
                        }
                      } catch (error) {
                        showError(error.response?.data?.message || 'Failed to create academic year');
                      }
                    }}
                    className="px-4 py-2 bg-[#2f5d31] text-white rounded-lg text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
              <SectionHeader
                icon={<Database className="h-5 w-5 text-[#2f5d31] mt-0.5" />}
                title="Database backup"
                description="Download a full export of all system data"
              />

              <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Download a ZIP file containing both JSON and SQL exports of all database tables.
                </p>
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  disabled={exporting || loading}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#2f5d31] hover:bg-[#004a6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f5d31] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {exporting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Export database
                    </>
                  )}
                </button>
              </div>
            </div>

            {settingsId && lastUpdated && (
              <p className="text-xs text-gray-500 text-right">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-[#2f5d31] hover:bg-[#004a6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f5d31] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
