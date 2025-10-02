"use client";

import { useState, useEffect } from "react";
import { getRequest } from "@/service";
import { getUserData } from "../utils/localStorage";
import { Eye, Home, User } from "lucide-react";
import { Pagination } from "antd";

export default function Client() {
  const [activeTab, setActiveTab] = useState("stable"); // "stable" or "trainer"
  const [stableBookings, setStableBookings] = useState([]);
  const [trainerBookings, setTrainerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      
      const userData = getUserData();
      if (!userData.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      let response;
      if (activeTab === "stable") {
        response = await getRequest(
          `/api/bookingStables?userId=${userData.id}&page=${pagination.page}&limit=${pagination.limit}`
        );
        if (response.success && response.data) {
          setStableBookings(response.data);
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            pages: response.pagination.pages
          }));
        } else {
          setStableBookings([]);
          setPagination(prev => ({
            ...prev,
            total: 0,
            pages: 0
          }));
          setError("Failed to fetch stable bookings");
        }
      } else {
        response = await getRequest(
          `/api/bookingTrainers?userId=${userData.id}&page=${pagination.page}&limit=${pagination.limit}`
        );
        if (response.success && response.data) {
          setTrainerBookings(response.data);
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            pages: response.pagination.pages
          }));
        } else {
          setTrainerBookings([]);
          setPagination(prev => ({
            ...prev,
            total: 0,
            pages: 0
          }));
          setError("Failed to fetch trainer bookings");
        }
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Error loading bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return "Pending";
    } else if (now >= start && now <= end) {
      return "Active";
    } else {
      return "Completed";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getServiceType = (bookingType, serviceType) => {
    if (serviceType === 'trainer') {
      if (bookingType === 'day') return 'Daily Training';
      if (bookingType === 'week') return 'Weekly Training';
      return bookingType || 'Training';
    } else {
      if (bookingType === 'day') return 'Daily Stable';
      if (bookingType === 'week') return 'Weekly Stable';
      return bookingType || 'Stable';
    }
  };

  const formatServiceName = (serviceKey) => {
    return serviceKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/In Stable On Straw/g, 'In Stable (on straw)')
      .replace(/In Stable On Shavings/g, 'In Stable (on shavings)')
      .replace(/In Field Alone/g, 'In Field (alone)')
      .replace(/In Field Herd/g, 'In Field (herd)');
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  // Get current bookings for the active tab
  const currentBookings = activeTab === "stable" ? stableBookings : trainerBookings;

  // Handle pagination change
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ 
      ...prev, 
      page: page,
      limit: pageSize || prev.limit
    }));
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-brand">Clients</h2>
        <div className="text-sm text-gray-600">
          Total: {pagination.total} bookings
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("stable");
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "stable"
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Home size={16} />
            Stable Clients
          </button>
          <button
            onClick={() => {
              setActiveTab("trainer");
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === "trainer"
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User size={16} />
            Trainer Clients
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Loading bookings...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error}</div>
          <button 
            onClick={fetchBookings}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block rounded border border-[color:var(--primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
                <thead className="bg-[color:var(--primary)]/10 text-brand">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium min-w-[140px]">Client Name</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[130px]">Phone</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[100px]">Start Date</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[100px]">End Date</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[120px]">Service</th>
                    {activeTab === "stable" && (
                      <th className="px-3 py-3 text-left font-medium min-w-[100px]">Stable</th>
                    )}
                    {activeTab === "trainer" && (
                      <th className="px-3 py-3 text-left font-medium min-w-[100px]">Trainer</th>
                    )}
                    <th className="px-3 py-3 text-left font-medium min-w-[90px]">Price</th>
                    <th className="px-3 py-3 text-center font-medium min-w-[80px]">Actions</th>
                  </tr>
                </thead>
            <tbody>
                  {currentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "stable" ? "8" : "8"} className="px-4 py-8 text-center text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    currentBookings.map((booking) => {
                      const status = getStatus(booking.startDate, booking.endDate);
                      const clientName = `${booking.clientId?.firstName || ''} ${booking.clientId?.lastName || ''}`.trim();
                      
                      return (
                        <tr key={booking._id} className="border-t border-[color:var(--primary)]/20">
                          <td className="px-3 py-3 font-medium">
                            <div className="max-w-[140px] truncate" title={clientName || 'Unknown Client'}>
                              {clientName || 'Unknown Client'}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="max-w-[130px] truncate" title={booking.clientId?.phoneNumber || 'N/A'}>
                              {booking.clientId?.phoneNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="max-w-[100px] truncate" title={formatDate(booking.startDate)}>
                              {formatDate(booking.startDate)}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="max-w-[100px] truncate" title={formatDate(booking.endDate)}>
                              {formatDate(booking.endDate)}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="max-w-[120px] truncate" title={getServiceType(booking.bookingType, activeTab)}>
                              {getServiceType(booking.bookingType, activeTab)}
                            </div>
                          </td>
                          {activeTab === "stable" && (
                            <td className="px-3 py-3">
                              <div className="max-w-[100px] truncate" title={booking.stableId?.Tittle || 'Unknown Stable'}>
                                {booking.stableId?.Tittle || 'Unknown Stable'}
                              </div>
                            </td>
                          )}
                          {activeTab === "trainer" && (
                            <td className="px-3 py-3">
                              <div className="max-w-[100px] truncate" title={booking.trainerId?.title || 'Unknown Trainer'}>
                                {booking.trainerId?.title || 'Unknown Trainer'}
                              </div>
                            </td>
                          )}
                          <td className="px-3 py-3 font-medium text-right">
                            <div className="max-w-[90px] truncate" title={`$${booking.totalPrice}`}>
                              ${booking.totalPrice}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleViewDetails(booking)}
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-brand hover:bg-brand/10 rounded-full transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {currentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bookings found
              </div>
            ) : (
              currentBookings.map((booking) => {
                const status = getStatus(booking.startDate, booking.endDate);
                const clientName = `${booking.clientId?.firstName || ''} ${booking.clientId?.lastName || ''}`.trim();
                
                return (
                  <div key={booking._id} className="bg-white rounded-lg border border-[color:var(--primary)]/20 p-4 shadow-sm">
                    {/* Header with Client Name and Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">
                          {clientName || 'Unknown Client'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {activeTab === "stable" 
                            ? (booking.stableId?.Tittle || 'Unknown Stable')
                            : (booking.trainerId?.title || 'Unknown Trainer')
                          }
                        </p>
                      </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        status === "Active"
                        ? "bg-green-100 text-green-700"
                          : status === "Completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                        {status}
                      </span>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="text-sm text-gray-900">
                        {booking.clientId?.phoneNumber || 'N/A'}
                      </p>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(booking.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(booking.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Service</p>
                        <p className="text-sm text-gray-900">
                          {getServiceType(booking.bookingType, activeTab)}
                        </p>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Price</span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-brand">${booking.totalPrice}</span>
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-brand hover:bg-brand/10 rounded-full transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            <span className="hidden sm:inline">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
            </span>
            <span className="sm:hidden">
              {pagination.total} bookings
            </span>
          </div>
          <Pagination
            current={pagination.page}
            total={pagination.total}
            pageSize={pagination.limit}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            pageSizeOptions={['5', '10', '20', '50']}
            className="flex justify-center"
          />
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-brand">Booking Details</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Booking ID: {selectedBooking._id}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* First Row: Client Information and Booking Dates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Client Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">
                          {`${selectedBooking.clientId?.firstName || ''} ${selectedBooking.clientId?.lastName || ''}`.trim() || 'Unknown Client'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{selectedBooking.clientId?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone Number</label>
                        <p className="text-gray-900">{selectedBooking.clientId?.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Dates */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Booking Dates
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                        <p className="text-gray-900">{formatDate(selectedBooking.startDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        <p className="text-gray-900">{formatDate(selectedBooking.endDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Booking Created</label>
                        <p className="text-gray-900">
                          {new Date(selectedBooking.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Row: Booking Information and Stable Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Booking Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="mt-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            getStatus(selectedBooking.startDate, selectedBooking.endDate) === "Active"
                              ? "bg-green-100 text-green-700"
                              : getStatus(selectedBooking.startDate, selectedBooking.endDate) === "Completed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {getStatus(selectedBooking.startDate, selectedBooking.endDate)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Service Type</label>
                        <p className="text-gray-900">{getServiceType(selectedBooking.bookingType, activeTab)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Number of Horses</label>
                        <p className="text-gray-900">{selectedBooking.numberOfHorses}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Number of Days</label>
                        <p className="text-gray-900">{selectedBooking.numberOfDays} days</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Base Price per {selectedBooking.bookingType}</label>
                        <p className="text-gray-900">${selectedBooking.basePrice || selectedBooking.price}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Total Price</label>
                        <p className="text-lg font-bold text-brand">${selectedBooking.totalPrice}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      {activeTab === "stable" ? "Stable Information" : "Trainer Information"}
                    </h4>
                    <div className="space-y-3">
                      {activeTab === "stable" ? (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Stable Name</label>
                            <p className="text-gray-900">{selectedBooking.stableId?.Tittle || 'Unknown Stable'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Description</label>
                            <p className="text-gray-900">{selectedBooking.stableId?.Deatils || 'No description available'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Location</label>
                            <p className="text-gray-900">{selectedBooking.stableId?.location || 'Location not specified'}</p>
                          </div>
                          {selectedBooking.stableId?.coordinates && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Coordinates</label>
                              <p className="text-gray-900 text-sm">
                                Lat: {selectedBooking.stableId.coordinates.lat}, 
                                Lng: {selectedBooking.stableId.coordinates.lng}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Trainer Name</label>
                            <p className="text-gray-900">{selectedBooking.trainerId?.title || 'Unknown Trainer'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Description</label>
                            <p className="text-gray-900">{selectedBooking.trainerId?.details || 'No description available'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Experience</label>
                            <p className="text-gray-900">{selectedBooking.trainerId?.Experience || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Location</label>
                            <p className="text-gray-900">{selectedBooking.trainerId?.location || 'Location not specified'}</p>
                          </div>
                          {selectedBooking.trainerId?.coordinates && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Coordinates</label>
                              <p className="text-gray-900 text-sm">
                                Lat: {selectedBooking.trainerId.coordinates.lat}, 
                                Lng: {selectedBooking.trainerId.coordinates.lng}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Services & Pricing Breakdown */}
                {selectedBooking.additionalServices && selectedBooking.servicePriceDetails && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Additional Services & Pricing
                    </h4>
                    <div className="space-y-4">
                      {/* Base Price */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Base Price ({selectedBooking.bookingType})</span>
                          <span className="font-bold text-gray-900">${selectedBooking.basePrice || selectedBooking.price}</span>
                        </div>
                      </div>

                      {/* Additional Services */}
                      {selectedBooking.additionalServiceCosts > 0 && (
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-700">Additional Services:</h5>
                          
                          {/* Stable Services (for stable bookings) */}
                          {activeTab === "stable" && (
                            <>
                              {/* Short-term Stay */}
                              {selectedBooking.additionalServices.shortTermStay?.selected && selectedBooking.servicePriceDetails.shortTermStay && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-800">
                                      Short-term Stay ({formatServiceName(selectedBooking.additionalServices.shortTermStay.selected)})
                                    </span>
                                    <span className="text-sm font-medium text-blue-700">
                                      ${selectedBooking.servicePriceDetails.shortTermStay.pricePerDay}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.shortTermStay.price}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Long-term Stay */}
                              {selectedBooking.additionalServices.longTermStay?.selected && selectedBooking.servicePriceDetails.longTermStay && (
                                <div className="bg-green-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-green-800">
                                      Long-term Stay ({formatServiceName(selectedBooking.additionalServices.longTermStay.selected)})
                                    </span>
                                    <span className="text-sm font-medium text-green-700">
                                      ${selectedBooking.servicePriceDetails.longTermStay.pricePerDay}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.longTermStay.price}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Stallions */}
                              {selectedBooking.additionalServices.stallionsAccepted && selectedBooking.servicePriceDetails.stallions && (
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-yellow-800">Stallions Accepted</span>
                                    <span className="text-sm font-medium text-yellow-700">
                                      ${selectedBooking.servicePriceDetails.stallions.pricePerDay}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.stallions.price}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Event Pricing */}
                              {selectedBooking.additionalServices.eventPricing && (
                                <div className="space-y-2">
                                  {selectedBooking.additionalServices.eventPricing.eventingCourse && selectedBooking.servicePriceDetails.eventPricing.eventingCoursePrice > 0 && (
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-purple-800">Eventing Course</span>
                                        <span className="text-sm font-medium text-purple-700">
                                          ${selectedBooking.servicePriceDetails.eventPricing.eventingCoursePrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.eventPricing.eventingCoursePrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.eventPricing.canterTrack && selectedBooking.servicePriceDetails.eventPricing.canterTrackPrice > 0 && (
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-purple-800">Canter Track</span>
                                        <span className="text-sm font-medium text-purple-700">
                                          ${selectedBooking.servicePriceDetails.eventPricing.canterTrackPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.eventPricing.canterTrackPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.eventPricing.jumpingTrack && selectedBooking.servicePriceDetails.eventPricing.jumpingTrackPrice > 0 && (
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-purple-800">Jumping Track</span>
                                        <span className="text-sm font-medium text-purple-700">
                                          ${selectedBooking.servicePriceDetails.eventPricing.jumpingTrackPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.eventPricing.jumpingTrackPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.eventPricing.dressageTrack && selectedBooking.servicePriceDetails.eventPricing.dressageTrackPrice > 0 && (
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-purple-800">Dressage Track</span>
                                        <span className="text-sm font-medium text-purple-700">
                                          ${selectedBooking.servicePriceDetails.eventPricing.dressageTrackPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.eventPricing.dressageTrackPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* Trainer Services (for trainer bookings) */}
                          {activeTab === "trainer" && (
                            <>
                              {/* Disciplines */}
                              {selectedBooking.additionalServices.disciplines && (
                                <div className="space-y-2">
                                  <h6 className="font-medium text-gray-600 text-sm">Disciplines:</h6>
                                  {selectedBooking.additionalServices.disciplines.dressage && selectedBooking.servicePriceDetails.disciplines.dressagePrice > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-800">Dressage</span>
                                        <span className="text-sm font-medium text-blue-700">
                                          ${selectedBooking.servicePriceDetails.disciplines.dressagePrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.disciplines.dressagePrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.disciplines.showJumping && selectedBooking.servicePriceDetails.disciplines.showJumpingPrice > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-800">Show Jumping</span>
                                        <span className="text-sm font-medium text-blue-700">
                                          ${selectedBooking.servicePriceDetails.disciplines.showJumpingPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.disciplines.showJumpingPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.disciplines.eventing && selectedBooking.servicePriceDetails.disciplines.eventingPrice > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-800">Eventing</span>
                                        <span className="text-sm font-medium text-blue-700">
                                          ${selectedBooking.servicePriceDetails.disciplines.eventingPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.disciplines.eventingPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.disciplines.endurance && selectedBooking.servicePriceDetails.disciplines.endurancePrice > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-800">Endurance</span>
                                        <span className="text-sm font-medium text-blue-700">
                                          ${selectedBooking.servicePriceDetails.disciplines.endurancePrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.disciplines.endurancePrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.disciplines.western && selectedBooking.servicePriceDetails.disciplines.westernPrice > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-800">Western</span>
                                        <span className="text-sm font-medium text-blue-700">
                                          ${selectedBooking.servicePriceDetails.disciplines.westernPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.disciplines.westernPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.disciplines.vaulting && selectedBooking.servicePriceDetails.disciplines.vaultingPrice > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-800">Vaulting</span>
                                        <span className="text-sm font-medium text-blue-700">
                                          ${selectedBooking.servicePriceDetails.disciplines.vaultingPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.disciplines.vaultingPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Training */}
                              {selectedBooking.additionalServices.training && (
                                <div className="space-y-2">
                                  <h6 className="font-medium text-gray-600 text-sm">Training:</h6>
                                  {selectedBooking.additionalServices.training.onLocationLessons && selectedBooking.servicePriceDetails.training.onLocationLessonsPrice > 0 && (
                                    <div className="bg-green-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-800">On Location Lessons</span>
                                        <span className="text-sm font-medium text-green-700">
                                          ${selectedBooking.servicePriceDetails.training.onLocationLessonsPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.training.onLocationLessonsPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {selectedBooking.additionalServices.training.lessonsOnTrainersLocation && selectedBooking.servicePriceDetails.training.lessonsOnTrainersLocationPrice > 0 && (
                                    <div className="bg-green-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-green-800">Lessons on Trainer's Location</span>
                                        <span className="text-sm font-medium text-green-700">
                                          ${selectedBooking.servicePriceDetails.training.lessonsOnTrainersLocationPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.training.lessonsOnTrainersLocationPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Competition Coaching */}
                              {selectedBooking.additionalServices.competitionCoaching && (
                                <div className="space-y-2">
                                  <h6 className="font-medium text-gray-600 text-sm">Competition Coaching:</h6>
                                  {selectedBooking.additionalServices.competitionCoaching.onLocationCoaching && selectedBooking.servicePriceDetails.competitionCoaching.onLocationCoachingPrice > 0 && (
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-purple-800">On Location Coaching</span>
                                        <span className="text-sm font-medium text-purple-700">
                                          ${selectedBooking.servicePriceDetails.competitionCoaching.onLocationCoachingPrice / selectedBooking.numberOfDays}/day × {selectedBooking.numberOfDays} days = ${selectedBooking.servicePriceDetails.competitionCoaching.onLocationCoachingPrice}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* Additional Services Total */}
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700">Additional Services Total</span>
                              <span className="font-bold text-gray-900">${selectedBooking.additionalServiceCosts}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Grand Total */}
                      <div className="bg-brand/10 p-4 rounded-lg border-2 border-brand/20">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-brand">Grand Total</span>
                          <span className="text-xl font-bold text-brand">${selectedBooking.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
        </div>
      </div>
      )}
    </div>
  );
}
