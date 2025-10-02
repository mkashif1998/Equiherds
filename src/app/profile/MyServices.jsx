"use client";

import { useState, useEffect } from "react";
import { getRequest, postRequest } from "@/service";
import { getUserData } from "../utils/localStorage";
import { Eye, Star, Home, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { Pagination } from "antd";

export default function MyServices() {
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Fetch bookings when page or tab changes
  useEffect(() => {
    fetchMyBookings();
    // eslint-disable-next-line
  }, [pagination.page, activeTab]);

  // Fetch bookings with pagination
  const fetchMyBookings = async () => {
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
          `/api/bookingStables?clientId=${userData.id}&page=${pagination.page}&limit=${pagination.limit}`
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
          `/api/bookingTrainers?clientId=${userData.id}&page=${pagination.page}&limit=${pagination.limit}`
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

  const formatPrice = (value) => `$${value.toLocaleString()}`;

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleRatingClick = (booking) => {
    setSelectedBooking(booking);
    setIsRatingModalOpen(true);
    setRating(0);
    setHoverRating(0);
  };

  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setSelectedBooking(null);
    setRating(0);
    setHoverRating(0);
  };

  const handleRatingSubmit = async () => {
    if (!selectedBooking) {
      return;
    }

    try {
      setRatingLoading(true);

      let response;
      if (activeTab === "stable") {
        if (!selectedBooking.stableId?._id) {
          toast.error('Stable information not available');
          setRatingLoading(false);
          return;
        }
        response = await postRequest('/api/stables/rating', {
          stableId: selectedBooking.stableId._id,
          rating: rating
        });
      } else {
        if (!selectedBooking.trainerId?._id) {
          toast.error('Trainer information not available');
          setRatingLoading(false);
          return;
        }
        response = await postRequest('/api/trainer/rating', {
          trainerId: selectedBooking.trainerId._id,
          rating: rating
        });
      }

      if (response.success) {
        toast.success('Rating submitted successfully!');
        closeRatingModal();
      } else {
        toast.error('Failed to submit rating. Please try again.');
      }
    } catch (error) {
      toast.error('Error submitting rating. Please try again.');
    } finally {
      setRatingLoading(false);
    }
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
        <h2 className="text-2xl font-semibold text-brand">My Services</h2>
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
            Stable Bookings
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
            Trainer Bookings
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
            onClick={fetchMyBookings}
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
                    <th className="px-3 py-3 text-left font-medium min-w-[120px]">Service Type</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[100px]">Start Date</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[100px]">End Date</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[80px]">Status</th>
                    <th className="px-3 py-3 text-left font-medium min-w-[90px]">Price</th>
                    <th className="px-3 py-3 text-center font-medium min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    currentBookings.map((booking) => {
                      const status = getStatus(booking.startDate, booking.endDate);

                      return (
                        <tr key={booking._id} className="border-t border-[color:var(--primary)]/20">
                          <td className="px-3 py-3 font-medium">
                            <div className="max-w-[120px] truncate" title={getServiceType(booking.bookingType, activeTab)}>
                              {getServiceType(booking.bookingType, activeTab)}
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
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              status === "Active"
                                ? "bg-green-100 text-green-700"
                                : status === "Completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-medium text-right">
                            <div className="max-w-[90px] truncate" title={formatPrice(booking.totalPrice)}>
                              {formatPrice(booking.totalPrice)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetails(booking)}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-brand hover:bg-brand/10 rounded-full transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleRatingClick(booking)}
                                className="inline-flex items-center justify-center w-8 h-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-full transition-colors"
                                title="Rate Service"
                              >
                                <Star size={16} />
                              </button>
                            </div>
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

                return (
                  <div key={booking._id} className="bg-white rounded-lg border border-[color:var(--primary)]/20 p-4 shadow-sm">
                    {/* Header with Service Type and Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base">
                          {getServiceType(booking.bookingType, activeTab)}
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

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
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
                    </div>

                    {/* Price and Action */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Price</span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-brand">{formatPrice(booking.totalPrice)}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(booking)}
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-brand hover:bg-brand/10 rounded-full transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleRatingClick(booking)}
                              className="inline-flex items-center justify-center w-8 h-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-full transition-colors"
                              title="Rate Service"
                            >
                              <Star size={16} />
                            </button>
                          </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Provider Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    Service Provider
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900">
                        {`${selectedBooking.userId?.firstName || ''} ${selectedBooking.userId?.lastName || ''}`.trim() || 'Unknown Provider'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedBooking.userId?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone Number</label>
                      <p className="text-gray-900">{selectedBooking.userId?.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

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
                      <label className="text-sm font-medium text-gray-600">Price per {selectedBooking.bookingType}</label>
                      <p className="text-gray-900">${selectedBooking.price}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Price</label>
                      <p className="text-lg font-bold text-brand">${selectedBooking.totalPrice}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
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

                {/* Service Provider Information */}
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

      {/* Rating Modal */}
      {isRatingModalOpen && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRatingModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-brand">Rate Service</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {activeTab === "stable" 
                    ? (selectedBooking.stableId?.Tittle || 'Unknown Stable')
                    : (selectedBooking.trainerId?.title || 'Unknown Trainer')
                  }
                </p>
              </div>
              <button
                onClick={closeRatingModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <p className="text-gray-700 mb-6">
                  How would you rate your experience with this service?
                </p>
                
                {/* Star Rating */}
                <div className="flex justify-center items-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-colors"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        } hover:text-yellow-400 hover:fill-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>

                {/* Rating Display */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    {rating === 0 ? 'Select a rating' : `${rating} star${rating > 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Service Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Service:</span> {getServiceType(selectedBooking.bookingType, activeTab)}</p>
                    <p><span className="font-medium">Duration:</span> {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}</p>
                    <p><span className="font-medium">Total Price:</span> {formatPrice(selectedBooking.totalPrice)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeRatingModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={ratingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0 || ratingLoading}
                className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {ratingLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
