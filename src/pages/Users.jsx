import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Eye, EyeOff, Trash2, RefreshCw, UsersIcon, UserPlus } from 'lucide-react';
import { useUsers } from '../contexts/UsersContext';
import { useAuth } from '../contexts/AuthContext';
import { AddUserModal } from '../components/AddUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { DeleteModal } from '../components/DeleteModal';
import { StatusModal } from '../components/StatusModal';
import { UserAvatar } from '../components/UserAvatar';
import { UsersManagementHeading } from '../components/PageHeading';
import { formatUserRole } from '../utils/userRoleLabels';
import { isCampusWelfareRole, requiresCampus, isNoCampusRole } from '../utils/roleHelpers';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const { 
    users, 
    loading, 
    error, 
    statistics, 
    campuses,
    fetchUsers, 
    fetchCampuses, 
    fetchStatistics,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    clearError
  } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null); // 'activate' or 'deactivate'
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampus, setFilterCampus] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    names: '',
    email: '',
    phone: '',
    role: 'warefare',
    campus: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check permissions based on user role
  const permissions = {
    canCreate: currentUser?.role === 'admin' || currentUser?.role === 'head_quarter',
    canUpdate: currentUser?.role === 'admin' || currentUser?.role === 'head_quarter',
    canDelete: currentUser?.role === 'admin' || currentUser?.role === 'head_quarter',
    canActivate: currentUser?.role === 'admin' || currentUser?.role === 'head_quarter' || isCampusWelfareRole(currentUser?.role),
    canViewAll: currentUser?.role === 'admin' || currentUser?.role === 'head_quarter' || currentUser?.role === 'wadden',
    canViewCampusOnly: isCampusWelfareRole(currentUser?.role)
  };

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
    fetchCampuses();
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'role' && !requiresCampus(value)) {
        next.campus = '';
      }
      return next;
    });
  };

  const buildUserPayload = (data, isUpdate = false) => {
    const payload = { ...data };

    if (isNoCampusRole(payload.role)) {
      payload.campus = null;
    }

    if (requiresCampus(payload.role) && !payload.campus) {
      return { error: `Campus is required for ${formatUserRole(payload.role)} users` };
    }

    if (isUpdate) {
      if (!payload.password) {
        delete payload.password;
        delete payload.confirmPassword;
      } else if (payload.password !== payload.confirmPassword) {
        return { error: 'Password and confirm password do not match' };
      }
    } else {
      delete payload.password;
      delete payload.confirmPassword;
    }

    return { payload };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrors({});
    clearError();

    try {
      let response;
      if (selectedUser) {
        const { payload, error } = buildUserPayload(formData, true);
        if (error) {
          setErrors({ general: error });
          setSubmitLoading(false);
          return;
        }
        response = await updateUser(selectedUser.id, payload);
      } else {
        const { payload, error } = buildUserPayload(formData, false);
        if (error) {
          setErrors({ general: error });
          setSubmitLoading(false);
          return;
        }
        response = await createUser(payload);
      }
      
      if (response.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({
          names: '',
          email: '',
          phone: '',
          role: 'warefare',
          campus: '',
          password: '',
          confirmPassword: ''
        });
        // Data is automatically updated in context
      } else {
        setErrors(response.message ? { general: response.message } : {});
      }
    } catch (error) {
      setErrors({ general: error.message || 'An error occurred. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      names: user.names,
      email: user.email,
      phone: user.phone,
      role: user.role,
      campus: user.campus,
      password: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const response = await deleteUser(selectedUser.id);
      
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        // Data is automatically updated in context
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = (user, action) => {
    setSelectedUser(user);
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const response = await toggleUserStatus(selectedUser.id, statusAction);
      
      if (response.success) {
        setShowStatusModal(false);
        setSelectedUser(null);
        setStatusAction(null);
        // Data is automatically updated in context
      }
    } catch (error) {
      console.error('Error changing user status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getCampusName = (campusId, campusInfo, role) => {
    if (role === 'admin' || role === 'head_quarter' || role === 'dvc') {
      return '—';
    }
    if (campusInfo && campusInfo.name) {
      return campusInfo.name;
    }
    const campus = campuses.find(c => c.id === parseInt(campusId));
    return campus ? campus.name : 'N/A';
  };

  const filteredUsers = users.filter(user => {
    const campusName = getCampusName(user.campus, user.campusInfo, user.role).toLowerCase();
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch = !search ||
      user.names.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.phone.includes(searchTerm.trim()) ||
      formatUserRole(user.role).toLowerCase().includes(search) ||
      campusName.includes(search);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                       (filterStatus === 'active' && user.active === 1) ||
                       (filterStatus === 'inactive' && user.active === 0);

    const matchesCampus =
      filterCampus === 'all' ||
      (filterCampus === 'none' && (user.campus == null || user.campus === '')) ||
      String(user.campus) === String(filterCampus);

    return matchesSearch && matchesRole && matchesStatus && matchesCampus;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      head_quarter: 'bg-purple-100 text-purple-800',
      dvc: 'bg-amber-100 text-amber-800',
      warefare: 'bg-blue-100 text-blue-800',
      it: 'bg-cyan-100 text-cyan-800',
      wadden: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (active) => {
    return active === 1 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterCampus('all');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    filterRole !== 'all' ||
    filterStatus !== 'all' ||
    filterCampus !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f5d31]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <UsersManagementHeading 
        actions={[
          {
            type: "primary",
            label: "Add User",
            onClick: () => setShowAddModal(true)
          }
        ]}
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold">{statistics.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold">{statistics.activeUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <EyeOff className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-semibold">{statistics.inactiveUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-semibold">0</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, phone, role, campus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-gray-200 rounded-sm focus:ring-2 focus:ring-[#2f5d31]"
                />
              </div>

              {/* Role filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-[#2f5d31]"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="head_quarter">Head Quarter</option>
                <option value="dvc">DVC</option>
                <option value="warefare">Student Director Welfare</option>
                <option value="it">IT</option>
                <option value="wadden">Hostel Warden</option>
              </select>

              {/* Campus filter */}
              <select
                value={filterCampus}
                onChange={(e) => setFilterCampus(e.target.value)}
                className="px-4 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-[#2f5d31]"
              >
                <option value="all">All Campuses</option>
                <option value="none">No Campus (Central)</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-200 rounded-sm focus:ring-2 focus:ring-[#2f5d31]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!permissions.canCreate}
                className="flex items-center gap-2 px-4 py-2 bg-[#2f5d31] text-white rounded-lg hover:bg-[#004a6b] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
              
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2 bg-gray-150 rounded-sm hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <span>
              Showing {filteredUsers.length} of {users.length} users
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[#2f5d31] hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No users match your search or filters.
                  </td>
                </tr>
              ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <UserAvatar 
                          name={user.names || 'User'} 
                          size="md"
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.names}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {formatUserRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCampusName(user.campus, user.campusInfo, user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.active)}`}>
                      {user.active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {permissions.canUpdate && (
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {permissions.canActivate && (
                        <button
                          onClick={() => handleToggleStatus(user, user.active === 1 ? 'deactivate' : 'activate')}
                          className={`${user.active === 1 ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {user.active === 1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                      
                      {permissions.canDelete && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUser(null);
          setFormData({
            names: '',
            email: '',
            phone: '',
            role: 'warefare',
            campus: '',
            password: '',
            confirmPassword: ''
          });
          setErrors({});
        }}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        errors={errors}
        loading={submitLoading}
        campuses={campuses}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          setErrors({});
        }}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        onResetPassword={() => setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }))}
        errors={errors}
        loading={submitLoading}
        userName={selectedUser?.names}
        campuses={campuses}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        userName={selectedUser?.names}
        loading={actionLoading}
      />

      {/* Status Modal */}
      <StatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedUser(null);
          setStatusAction(null);
        }}
        onConfirm={confirmStatusChange}
        title={statusAction === 'activate' ? 'Activate User' : 'Deactivate User'}
        message={`This will ${statusAction} the user's account and ${statusAction === 'activate' ? 'grant' : 'revoke'} access.`}
        type={statusAction}
        userName={selectedUser?.names}
        loading={actionLoading}
      />
    </div>
  );
};
