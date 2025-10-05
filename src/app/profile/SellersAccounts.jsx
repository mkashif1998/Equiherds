"use client";

import { useEffect, useState } from "react";
import { getRequest, putRequest, deleteRequest } from "@/service";
import { Edit, X, Save, User, Trash2 } from "lucide-react";

export default function SellersAccounts() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingSeller, setEditingSeller] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingSeller, setDeletingSeller] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      // Fetch real data from API using correct endpoint
      const res = await getRequest('/api/users');
      const sellersData = res.users || [];
      
        // Filter only sellers and transform the data
        const transformedSellers = sellersData
          .filter(seller => seller.accountType === 'seller')
          .map(seller => ({
            id: seller._id,
            _id: seller._id, // Keep original _id for API calls
            firstName: seller.firstName || '',
            lastName: seller.lastName || '',
            email: seller.email || '',
            phoneNumber: seller.phoneNumber || '',
            companyName: seller.companyName || '',
            companyInfo: seller.companyInfo || '',
            accountType: seller.accountType || 'seller',
            subscriptionStatus: seller.subscriptionStatus || 'Pending',
            subscriptionExpiry: seller.subscriptionExpiry || '',
            registrationDate: seller.createdAt || new Date().toISOString(),
            status: seller.status || 'active'
          }));
      
      setSellers(transformedSellers);
    } catch (error) {
      console.error("Error loading sellers:", error);
      // Fallback to empty array on error
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSeller = (seller) => {
    setEditingSeller({ ...seller });
    setIsEditModalOpen(true);
  };

  const handleSaveSeller = async () => {
    if (!editingSeller) return;
    
    try {
      setSaving(true);
      await putRequest(`/api/users?id=${editingSeller._id}`, editingSeller);
      await loadSellers(); // Reload sellers after update
      setIsEditModalOpen(false);
      setEditingSeller(null);
    } catch (error) {
      console.error("Error updating seller:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeller = (seller) => {
    setDeletingSeller(seller);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSeller = async () => {
    if (!deletingSeller) return;
    
    try {
      setDeleting(true);
      await deleteRequest(`/api/users?id=${deletingSeller._id}`);
      await loadSellers(); // Reload sellers after deletion
      setIsDeleteModalOpen(false);
      setDeletingSeller(null);
    } catch (error) {
      console.error("Error deleting seller:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getSubscriptionStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Expired":
        return "bg-red-100 text-red-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getUserStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-red-100 text-red-700";
      case "suspended":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Filter sellers based on search term and status
  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = 
      seller.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || seller.subscriptionStatus.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-brand">Sellers Accounts</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-brand">Loading sellers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-brand">Sellers Accounts</h2>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-[color:var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-[color:var(--primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="text-sm text-brand/70">
          Total: {filteredSellers.length} sellers
        </div>
      </div>

      {/* Sellers Table */}
      <div className="rounded border border-[color:var(--primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--primary)]/10 text-brand">
              <tr>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Seller</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Company</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Contact</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Subscription Status</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">User Status</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Joined</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-brand/60">
                    No sellers found
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => (
                  <tr key={seller.id} className="border-t border-[color:var(--primary)]/20 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{seller.firstName} {seller.lastName}</div>
                        <div className="text-xs text-brand/60">{seller.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{seller.companyName}</div>
                        <div className="text-xs text-brand/60 max-w-xs truncate">{seller.companyInfo}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-brand/60">{seller.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSubscriptionStatusColor(seller.subscriptionStatus)}`}>
                        {seller.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getUserStatusColor(seller.status)}`}>
                        {seller.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-brand/60">
                        {new Date(seller.registrationDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSeller(seller)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                          title="Edit Seller"
                        >
                          <Edit size={16} />
                        </button>
                        {/* <button
                          onClick={() => handleDeleteSeller(seller)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Delete Seller"
                        >
                          <Trash2 size={16} />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-brand">Edit Seller</h3>
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
                    value={editingSeller.firstName || ''}
                    onChange={(e) => setEditingSeller({...editingSeller, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingSeller.lastName || ''}
                    onChange={(e) => setEditingSeller({...editingSeller, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingSeller.email || ''}
                    onChange={(e) => setEditingSeller({...editingSeller, email: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingSeller.phoneNumber || ''}
                    onChange={(e) => setEditingSeller({...editingSeller, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Subscription Status</label>
                  <select
                    value={editingSeller.subscriptionStatus || 'Pending'}
                    onChange={(e) => setEditingSeller({...editingSeller, subscriptionStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Status</label>
                  <select
                    value={editingSeller.status || 'active'}
                    onChange={(e) => setEditingSeller({...editingSeller, status: e.target.value})}
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
                    value={editingSeller.companyName || ''}
                    onChange={(e) => setEditingSeller({...editingSeller, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-brand/80 mb-1">Company Info</label>
                  <textarea
                    rows={3}
                    value={editingSeller.companyInfo || ''}
                    onChange={(e) => setEditingSeller({...editingSeller, companyInfo: e.target.value})}
                    className="w-full px-3 py-2 border border-[color:var(--primary)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand/80 mb-1">Subscription Expiry</label>
                  <input
                    type="date"
                    value={editingSeller.subscriptionExpiry ? editingSeller.subscriptionExpiry.split('T')[0] : ''}
                    onChange={(e) => setEditingSeller({...editingSeller, subscriptionExpiry: e.target.value})}
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
                  onClick={handleSaveSeller}
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-brand">Delete Seller</h3>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this seller?
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{deletingSeller.firstName} {deletingSeller.lastName}</p>
                  <p className="text-sm text-gray-600">{deletingSeller.email}</p>
                  <p className="text-sm text-gray-600">{deletingSeller.companyName}</p>
                </div>
                <p className="text-red-600 text-sm mt-2">
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSeller}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  {deleting ? 'Deleting...' : 'Delete Seller'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
