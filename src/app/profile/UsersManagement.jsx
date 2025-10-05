"use client";

import { useEffect, useState } from "react";
import { getRequest, putRequest } from "@/service";
import { Eye, Edit, X, Save, User } from "lucide-react";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccountType, setFilterAccountType] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getRequest('/api/users');
      setUsers(res.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      await putRequest(`/api/users?id=${editingUser._id}`, editingUser);
      await loadUsers(); // Reload users after update
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setSaving(false);
    }
  };

  const getAccountTypeColor = (accountType) => {
    switch (accountType) {
      case "superAdmin":
        return "bg-purple-100 text-purple-700";
      case "seller":
        return "bg-blue-100 text-blue-700";
      case "buyer":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status) => {
    if (status === "active") {
      return "bg-green-100 text-green-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  // Filter users based on search term and account type
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAccountType = filterAccountType === "all" || user.accountType === filterAccountType;
    
    return matchesSearch && matchesAccountType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-brand">Users Management</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-brand">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-brand">Users Management</h2>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-[color:var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
            />
          </div>
          <select
            value={filterAccountType}
            onChange={(e) => setFilterAccountType(e.target.value)}
            className="px-4 py-2 border border-[color:var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
          >
            <option value="all">All Account Types</option>
            <option value="superAdmin">Super Admin</option>
            <option value="seller">Seller</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>
        <div className="text-sm text-brand/70">
          Total: {filteredUsers.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded border border-[color:var(--primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--primary)]/10 text-brand">
              <tr>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">User</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Account Type</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Company</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Contact</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Status</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Joined</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-brand/60">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-t border-[color:var(--primary)]/20 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[color:var(--primary)]/10 flex items-center justify-center">
                          <User size={16} className="text-[color:var(--primary)]" />
                        </div>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-brand/60">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getAccountTypeColor(user.accountType)}`}>
                        {user.accountType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{user.companyName || 'N/A'}</div>
                        <div className="text-xs text-brand/60 max-w-xs truncate">{user.companyInfo || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-brand/60">{user.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-brand/60">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="View User"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-brand">User Details</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Name</label>
                    <div className="text-sm">{selectedUser.firstName} {selectedUser.lastName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Email</label>
                    <div className="text-sm">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Phone</label>
                    <div className="text-sm">{selectedUser.phoneNumber}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Account Type</label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAccountTypeColor(selectedUser.accountType)}`}>
                      {selectedUser.accountType}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Company Name</label>
                    <div className="text-sm">{selectedUser.companyName || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Company Info</label>
                    <div className="text-sm">{selectedUser.companyInfo || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status || 'active'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand/80 mb-1">Joined</label>
                    <div className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-brand">Edit User</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName || ''}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName || ''}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingUser.phoneNumber || ''}
                    onChange={(e) => setEditingUser({...editingUser, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Account Type</label>
                  <select
                    value={editingUser.accountType || ''}
                    onChange={(e) => setEditingUser({...editingUser, accountType: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="superAdmin">Super Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Status</label>
                  <select
                    value={editingUser.status || 'active'}
                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand/80 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={editingUser.companyName || ''}
                    onChange={(e) => setEditingUser({...editingUser, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand/80 mb-1">Company Info</label>
                  <textarea
                    rows={3}
                    value={editingUser.companyInfo || ''}
                    onChange={(e) => setEditingUser({...editingUser, companyInfo: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={saving}
                  className="px-4 py-2 bg-[color:var(--primary)] text-white rounded hover:bg-[color:var(--primary)]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
