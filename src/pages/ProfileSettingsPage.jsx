import { useState, useRef } from 'react';
import { UserCog, Camera, Upload, CheckCircle2, User, Phone, PenLine, Mail, Shield, Lock, Eye, EyeOff, Briefcase, MapPin, Calendar, Globe, IdCard, FileText } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api/authService';
import { fileUrl } from '../services/api/config';

const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara', 'Huye', 'Kamonyi',
  'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu',
  'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango',
  'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana',
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'edit', label: 'Edit Profile' },
  { id: 'password', label: 'Change Password' },
];

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2">
      <span className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value || '—'}</span>
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [names, setNames] = useState(user?.names || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [personalEmail, setPersonalEmail] = useState(user?.personal_email || '');
  const [otherPhone, setOtherPhone] = useState(user?.other_phone || '');
  const [workingArea, setWorkingArea] = useState(user?.working_area || '');
  const [livingDistrict, setLivingDistrict] = useState(user?.living_district || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [nationality, setNationality] = useState(user?.nationality || '');
  const [employeeId, setEmployeeId] = useState(user?.employee_id_number || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [gender, setGender] = useState(user?.gender || '');

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [saving, setSaving] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const photoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const resolveImage = (path, auth = false) => {
    if (!path) return null;
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return fileUrl(path, { auth });
  };

  const avatarSrc = photoPreview || resolveImage(user?.image);
  const signatureSrc = signaturePreview || resolveImage(user?.signature_url, true);
  const isSignatureApproved = String(user?.signature_approved ?? '0') === '1';

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('names', names);
      data.append('phone', phone);
      data.append('personal_email', personalEmail);
      data.append('other_phone', otherPhone);
      data.append('working_area', workingArea);
      data.append('living_district', livingDistrict);
      data.append('dob', dob);
      data.append('nationality', nationality);
      data.append('employee_id_number', employeeId);
      data.append('bio', bio);
      data.append('gender', gender);
      const image = photoInputRef.current?.files?.[0];
      if (image) data.append('image', image);
      const res = await authService.updateProfile(data);
      if (res.success) {
        updateUser(res.data);
        showMessage('Profile updated successfully');
        setPhotoPreview(null);
      } else {
        showMessage(res.message || 'Failed to update profile', 'error');
      }
    } catch {
      showMessage('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveSignature = async (event) => {
    event.preventDefault();
    setSavingSignature(true);
    try {
      const data = new FormData();
      const file = signatureInputRef.current?.files?.[0];
      if (!file) { setSavingSignature(false); return; }
      data.append('signature', file);
      const res = await authService.updateSignature(data);
      if (res.success !== false) {
        showMessage(res.message || 'Signature uploaded successfully');
        setSignaturePreview(null);
        if (res.data) updateUser({ ...user, ...res.data });
      } else {
        showMessage(res.message || 'Failed to upload signature', 'error');
      }
    } catch {
      showMessage('Failed to upload signature', 'error');
    } finally {
      setSavingSignature(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await authService.changePassword({ current_password: currentPassword, new_password: newPassword });
      if (res.success !== false) {
        showMessage(res.message || 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage(res.message || 'Failed to change password', 'error');
      }
    } catch (err) {
      showMessage(err?.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSignaturePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Profile Settings"
        subtitle="Update your personal details, profile photo, and signature"
        icon={<UserCog className="h-6 w-6" />}
      />

      {message && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition-all ${
          messageType === 'success'
            ? 'bg-[#2f5d31]/10 text-[#2f5d31] border border-[#2f5d31]/20'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile overview sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#2f5d31]/20 bg-gray-100">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2f5d31] to-[#1e3a1e]">
                      <User className="h-12 w-12 text-white/80" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { photoInputRef.current?.click(); setActiveTab('edit'); }}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#2f5d31] text-white shadow-lg hover:bg-[#1e3a1e] transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{user?.names || 'User'}</h3>
              <p className="mt-1 text-sm text-gray-500">{user?.email || ''}</p>
              {user?.role && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#2f5d31]/10 px-3 py-1 text-xs font-medium text-[#2f5d31]">
                  <Shield className="h-3 w-3" />
                  {user.role}
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
              {user?.email && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-[#6b4423]" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {(user?.phone || phone) && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-[#6b4423]" />
                  <span>{user?.phone || phone}</span>
                </div>
              )}
              {user?.department?.name && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 text-[#6b4423]" />
                  <span>{user.department.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signature status card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <PenLine className="h-4 w-4 text-[#6b4423]" />
              Signature Status
            </h4>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isSignatureApproved
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isSignatureApproved ? 'Approved by HR' : 'Not Approved by HR'}
              </span>
            </div>
            {signatureSrc ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <img src={signatureSrc} alt="Signature" className="max-h-16 object-contain" />
              </div>
            ) : (
              <p className="text-xs text-gray-400">No signature uploaded</p>
            )}
            {!isSignatureApproved && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                <p className="font-semibold mb-1">Signature Requirements:</p>
                <ul className="space-y-0.5 pl-3 list-disc">
                  <li>White background only</li>
                  <li>Clear and legible</li>
                  <li>Professional style</li>
                </ul>
                <p className="mt-2 text-gray-500">Need Help? Contact IT Department and Communication Officer</p>
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tab navigation */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 px-6">
              <nav className="flex gap-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#2f5d31] text-[#2f5d31]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* ─── Overview Tab ─── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-[#2f5d31]" />
                      Personal Information
                    </h3>
                    <div className="divide-y divide-gray-100">
                      <InfoRow label="Full Name" value={user?.names} />
                      <InfoRow label="Email" value={user?.email} />
                      <InfoRow label="Phone" value={user?.phone} />
                      <InfoRow label="Personal Email" value={user?.personal_email} />
                      <InfoRow label="Other Phone" value={user?.other_phone} />
                      <InfoRow label="Gender" value={user?.gender} />
                      <InfoRow label="Working Area" value={user?.working_area} />
                      <InfoRow label="Living District" value={user?.living_district} />
                      <InfoRow label="Date of Birth" value={user?.dob} />
                      <InfoRow label="Nationality" value={user?.nationality} />
                      <InfoRow label="Employee NID" value={user?.employee_id_number} />
                      <InfoRow
                        label="Signature Approved"
                        value={
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            isSignatureApproved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isSignatureApproved ? 'Yes' : 'No'}
                          </span>
                        }
                      />
                    </div>
                  </div>

                  {user?.bio && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#2f5d31]" />
                        About
                      </h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{user.bio}</p>
                    </div>
                  )}

                  {signatureSrc && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <PenLine className="h-4 w-4 text-[#6b4423]" />
                        Signature
                      </h3>
                      <div className="inline-block rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <img src={signatureSrc} alt="Signature" className="max-h-20 object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Edit Profile Tab ─── */}
              {activeTab === 'edit' && (
                <div className="space-y-6">
                  {/* Profile photo + signature */}
                  <form onSubmit={save} className="space-y-6">
                    {/* Photo section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Camera className="h-4 w-4 text-[#2f5d31]" />
                        Profile Photo
                      </h3>
                      <div className="flex items-center gap-5">
                        <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 shrink-0">
                          {(photoPreview || avatarSrc) ? (
                            <img src={photoPreview || avatarSrc} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <input ref={photoInputRef} name="image" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:border-[#6b4423]/40 hover:text-[#6b4423] hover:bg-[#6b4423]/5"
                          >
                            <Upload className="h-4 w-4" />
                            {photoPreview ? 'Change photo' : 'Choose a photo'}
                          </button>
                          {photoPreview && <p className="mt-1 text-xs text-[#2f5d31]">New photo selected — save to apply</p>}
                        </div>
                      </div>
                    </div>

                    {/* Personal details */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#2f5d31]" />
                        Personal Details
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={names} onChange={(e) => setNames(e.target.value)} placeholder="Enter your full name" required />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" required />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 bg-gray-50 cursor-not-allowed" value={user?.email || ''} disabled />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Personal Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="Personal email" type="email" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Other Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={otherPhone} onChange={(e) => setOtherPhone(e.target.value)} placeholder="Other phone number" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                          <select className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm text-gray-900 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={gender} onChange={(e) => setGender(e.target.value)}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Working Area</label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={workingArea} onChange={(e) => setWorkingArea(e.target.value)} placeholder="Working area" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Living District</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                            <select className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={livingDistrict} onChange={(e) => setLivingDistrict(e.target.value)}>
                              <option value="">Select district</option>
                              {RWANDA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input type="date" className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={dob} onChange={(e) => setDob(e.target.value)} />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Rwandan" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee NID</label>
                          <div className="relative">
                            <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee NID number" />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">About / Bio</label>
                          <textarea className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#2f5d31] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/20" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-gray-100 pt-4">
                      <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1e3a1e] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/40 focus:ring-offset-2 disabled:opacity-60">
                        {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle2 className="h-4 w-4" />}
                        {saving ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </form>

                  {/* Signature upload (separate form) */}
                  <form onSubmit={saveSignature} className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <PenLine className="h-4 w-4 text-[#6b4423]" />
                      Signature
                    </h3>

                    {signatureSrc && (
                      <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 inline-block">
                        <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Current Signature</p>
                        <img src={signatureSrc} alt="Signature" className="max-h-16 object-contain" />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <input ref={signatureInputRef} name="signature" type="file" accept="image/*" required className="hidden" onChange={handleSignatureChange} />
                      <button type="button" onClick={() => signatureInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition hover:border-[#6b4423]/40 hover:text-[#6b4423] hover:bg-[#6b4423]/5">
                        <Upload className="h-4 w-4" />
                        {signaturePreview ? 'Change signature' : 'Choose signature file'}
                      </button>
                      {signaturePreview && <p className="text-xs text-[#6b4423]">New signature selected</p>}
                    </div>

                    <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-100">
                      <p className="font-semibold mb-1">Signature Requirements:</p>
                      <ul className="space-y-0.5 pl-3 list-disc">
                        <li><strong>White Background Only:</strong> Pure white background</li>
                        <li><strong>PNG Format:</strong> Save as PNG image</li>
                        <li><strong>Clear & Legible:</strong> Ensure it is readable</li>
                        <li><strong>Professional:</strong> Use your official signature style</li>
                      </ul>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button type="submit" disabled={savingSignature} className="inline-flex items-center gap-2 rounded-lg bg-[#6b4423] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5a381c] focus:outline-none focus:ring-2 focus:ring-[#6b4423]/40 focus:ring-offset-2 disabled:opacity-60">
                        {savingSignature ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Upload className="h-4 w-4" />}
                        {savingSignature ? 'Uploading...' : 'Upload Signature'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ─── Change Password Tab ─── */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="max-w-md mx-auto space-y-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#2f5d31]" />
                    Change Password
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <PasswordInput value={currentPassword} onChange={setCurrentPassword} show={showCurrentPw} onToggle={() => setShowCurrentPw(!showCurrentPw)} placeholder="Enter current password" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <PasswordInput value={newPassword} onChange={setNewPassword} show={showNewPw} onToggle={() => setShowNewPw(!showNewPw)} placeholder="Enter new password (min 6 characters)" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                    <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPw} onToggle={() => setShowConfirmPw(!showConfirmPw)} placeholder="Confirm new password" />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={changingPassword} className="inline-flex items-center gap-2 rounded-lg bg-[#2f5d31] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1e3a1e] focus:outline-none focus:ring-2 focus:ring-[#2f5d31]/40 focus:ring-offset-2 disabled:opacity-60">
                      {changingPassword ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Lock className="h-4 w-4" />}
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
