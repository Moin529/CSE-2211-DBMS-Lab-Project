import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Eye, Calendar, Clock, MapPin, DollarSign, User, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { fetchAllBookings, updateBookingStatus } from "../../lib/api/admin";
import toast from 'react-hot-toast';

const ListBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAllBookings();
      setBookings(data);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking status updated to ${newStatus}`);
      loadBookings(); // Reload the list
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error("Failed to update booking status");
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = filterStatus === "all" 
    ? bookings 
    : bookings.filter(booking => booking.booking_status === filterStatus);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading bookings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            List <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">Bookings</span>
          </h1>
        </div>

        {/* Filter Controls */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-4">
            <label className="text-white text-sm font-medium">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span className="text-gray-400 text-sm">
              {filteredBookings.length} of {bookings.length} bookings
            </span>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-500 to-red-500">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Movie & Show</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Seats</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Payment</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking, index) => {
                    const { date, time } = formatDateTime(booking.show_datetime);
                    return (
                      <tr 
                        key={booking.id} 
                        className={`border-b border-gray-700 ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{booking.user_name}</div>
                              <div className="text-gray-400 text-sm">{booking.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={booking.poster_path} 
                              alt={booking.movie_title}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div>
                              <div className="text-white font-medium">{booking.movie_title}</div>
                              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>{date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{booking.hall_name}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">
                            {Array.isArray(booking.booked_seats) 
                              ? booking.booked_seats.join(', ')
                              : 'N/A'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="font-semibold">${booking.total_amount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                            {booking.booking_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {booking.booking_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors"
                                  title="Confirm Booking"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                  title="Cancel Booking"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            {booking.booking_status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                                title="Mark as Completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div 
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Booking Details</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Booking ID</label>
                    <div className="text-gray-300 text-sm">{selectedBooking.booking_reference}</div>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Booking Date</label>
                    <div className="text-gray-300 text-sm">
                      {new Date(selectedBooking.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-1">User Information</label>
                  <div className="text-gray-300 text-sm">
                    {selectedBooking.user_name} ({selectedBooking.user_email})
                  </div>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Movie & Show</label>
                  <div className="text-gray-300 text-sm">
                    {selectedBooking.movie_title} - {formatDateTime(selectedBooking.show_datetime).date} at {formatDateTime(selectedBooking.show_datetime).time}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    Hall: {selectedBooking.hall_name}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Seats</label>
                    <div className="text-gray-300 text-sm">
                      {Array.isArray(selectedBooking.booked_seats) 
                        ? selectedBooking.booked_seats.join(', ')
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Total Amount</label>
                    <div className="text-gray-300 text-sm font-semibold">
                      ${selectedBooking.total_amount}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Booking Status</label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedBooking.booking_status)}`}>
                      {selectedBooking.booking_status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Payment Status</label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(selectedBooking.payment_status)}`}>
                      {selectedBooking.payment_status}
                    </span>
                  </div>
                </div>
                
                {selectedBooking.special_requests && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Special Requests</label>
                    <div className="text-gray-300 text-sm">{selectedBooking.special_requests}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ListBookings; 