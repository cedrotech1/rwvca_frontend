import { useEffect, useState } from 'react';
import { Database, Download, Mail, Save, Server, Settings, AlertTriangle } from 'lucide-react';
import apiClient from '../../services/api/config';
import { PageHeading } from '../../components/PageHeading';
import { inputClass, labelClass } from '../../components/ui/dataUi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_ROLES = ['admin', 'ed', 'chairman'];

export default function SystemSettingsFormPage() {
  const { user } = useAuth();
  const canManage = ADMIN_ROLES.includes(String(user?.role || '').toLowerCase());
  const [form, setForm] = useState({
    leave_days: 21,
    send_email_notification: 'yes',
    system_status: 'live',
  });
  const [runtime, setRuntime] = useState(null);
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get('/settings');
    const data = res.data || {};
    setForm({
      leave_days: data.leave_days ?? 21,
      send_email_notification: data.send_email_notification || 'yes',
      system_status: data.system_status || 'live',
    });
    setRuntime(data.email_runtime || null);
    if (!testEmail && user?.email) setTestEmail(user.email);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(err.response?.data?.message || 'Could not load settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put('/settings', form);
      await load();
      setMessage('Settings saved. Email notifications follow send_email_notification (same as PHP).');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const exportDatabase = async () => {
    setExporting(true);
    setError('');
    setMessage('');
    try {
      const response = await apiClient.get('/settings/export-database', {
        responseType: 'blob',
        timeout: 180000,
      });
      const blob = new Blob([response.data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rwvca-database-${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Database exported as SQL.');
    } catch (err) {
      let text = err.response?.data?.message || 'Could not export database';
      if (err.response?.data instanceof Blob) {
        try {
          const parsed = JSON.parse(await err.response.data.text());
          if (parsed?.message) text = parsed.message;
        } catch {
          // keep the default message
        }
      }
      setError(text);
    } finally {
      setExporting(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/settings/test-email', { email: testEmail });
      setMessage(res.message || `Test email sent to ${testEmail}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send test email');
    } finally {
      setTesting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center">
        <div>
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold">Access denied</h2>
          <p className="mt-1 text-sm text-gray-600">Only admin, ED, and Chairman can change system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="System Settings"
        subtitle="Configure system settings"
        icon={<Settings className="h-6 w-6" />}
      />

      {loading ? <p className="text-sm text-gray-500">Loading settings...</p> : (
        <form onSubmit={save} className="space-y-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-start gap-3">
              <Server className="mt-0.5 h-5 w-5 text-[#2f5d31]" />
              <div>
                <h2 className="font-semibold text-gray-900">General</h2>
                <p className="text-sm text-gray-500">Availability and HR defaults</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-600">
                System status
                <select className={`mt-1 ${inputClass}`} value={form.system_status} onChange={(e) => setForm((p) => ({ ...p, system_status: e.target.value }))}>
                  <option value="live">Live</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
              <label className="text-sm text-gray-600">
                Default leave days
                <input type="number" min="0" className={`mt-1 ${inputClass}`} value={form.leave_days} onChange={(e) => setForm((p) => ({ ...p, leave_days: Number(e.target.value) }))} />
              </label>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-[#2f5d31]" />
              <div>
                <h2 className="font-semibold text-gray-900">Email notifications</h2>
                <p className="text-sm text-gray-500">
                  Same as PHP <code>send_email_function.php</code>: checks <code>send_email_notification</code> in settings, then sends via <code>mail.rwvca.org.rw:587</code> as <strong>RWVCA MIS</strong> &lt;notification@rwvca.org.rw&gt;.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-600">
                Send email notifications
                <select className={`mt-1 ${inputClass}`} value={form.send_email_notification} onChange={(e) => setForm((p) => ({ ...p, send_email_notification: e.target.value }))}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">SMTP host:</span> {runtime?.host || 'mail.rwvca.org.rw'}:{runtime?.port || 587} ({runtime?.secure || 'tls'})</p>
                <p><span className="font-medium">SMTP ready:</span> {runtime?.smtp_configured ? 'yes' : 'no — set SMTP_PASSWORD in BACKEND/.env'}</p>
                <p><span className="font-medium">From:</span> {runtime?.from_name || 'RWVCA MIS'} &lt;{runtime?.from || 'notification@rwvca.org.rw'}&gt;</p>
                <p><span className="font-medium">Server kill switch:</span> EMAIL_ENABLED={runtime?.env_enabled ? 'true' : 'false'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className={`flex-1 text-sm text-gray-600 ${labelClass}`}>
                Send a test email to
                <input type="email" className={`mt-1 ${inputClass}`} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@rwvca.org.rw" />
              </label>
              <button type="button" disabled={testing} onClick={sendTest} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 disabled:opacity-50">
                {testing ? 'Sending...' : 'Send test email'}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-start gap-3">
              <Database className="mt-0.5 h-5 w-5 text-[#2f5d31]" />
              <div>
                <h2 className="font-semibold text-gray-900">Database export</h2>
                <p className="text-sm text-gray-500">Download the database as it is, in one .sql file.</p>
              </div>
            </div>
            <button type="button" disabled={exporting} onClick={exportDatabase} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export database (.sql)'}
            </button>
          </div>

          <div className="flex justify-end">
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
