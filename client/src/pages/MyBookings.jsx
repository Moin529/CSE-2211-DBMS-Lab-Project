import React, { useState, useEffect } from "react";
import { CalendarIcon, ClockIcon, MapPinIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import PaymentModal from "../components/PaymentModal";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { supabase } from "../lib/supabase";
import { getUserBookings, updateBookingPayment, cancelBooking, clearAllBookings } from "../lib/bookingManager";

const MyBookings = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, booking: null });

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Load bookings using centralized booking manager
    const loadBookings = () => {
      try {
        const userBookings = getUserBookings(user.id);
        
        // Sort bookings by show date (newest first)
        const sortedBookings = userBookings.sort((a, b) => 
          new Date(b.show.showDateTime) - new Date(a.show.showDateTime)
        );
        
        setBookings(sortedBookings);
      } catch (error) {
        console.error('Error loading bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  const handleCancelBooking = (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        // Cancel booking using centralized system
        cancelBooking(bookingId);
        
        // Update state
        setBookings(prev => prev.filter(booking => booking._id !== bookingId));
        
        toast.success("Booking cancelled successfully!");
      } catch (error) {
        console.error('Error cancelling booking:', error);
        toast.error("Failed to cancel booking");
      }
    }
  };

  const handlePayNow = (booking) => {
    setPaymentModal({ isOpen: true, booking });
  };

  const handlePaymentSuccess = (bookingId) => {
    try {
      // Update booking payment status using centralized system
      updateBookingPayment(bookingId, true);
      
      // Update state
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, isPaid: true }
          : booking
      ));
      
      setPaymentModal({ isOpen: false, booking: null });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error("Failed to process payment");
    }
  };

  const handleClosePaymentModal = () => {
    setPaymentModal({ isOpen: false, booking: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Please Login</h2>
            <p className="text-gray-400 mb-8">You need to be logged in to view your bookings.</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-primary hover:bg-primary-dull transition rounded-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 pb-20">
      <div className="max-w-4xl mx-auto">
        <BlurCircle top="-50px" left="-100px" />
        <BlurCircle bottom="-50px" right="-100px" />
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">My Bookings</h1>
          <div className="flex gap-3">
            {bookings.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Clear all bookings? This action cannot be undone.")) {
                    clearAllBookings();
                    setBookings([]);
                    toast.success("All bookings cleared");
                  }
                }}
                className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-lg text-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => navigate('/movies')}
              className="px-6 py-2 bg-primary hover:bg-primary-dull transition rounded-lg"
            >
              Book More Movies
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">No Bookings Yet</h2>
            <p className="text-gray-400 mb-8">You haven't made any bookings yet. Start by exploring our movies!</p>
            <button
              onClick={() => navigate('/movies')}
              className="px-8 py-3 bg-primary hover:bg-primary-dull transition rounded-lg"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Movie Poster */}
                  <img 
                    src={booking.show.movie.poster_path} 
                    alt={booking.show.movie.title}
                    className="w-24 h-36 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/240x360/1f2937/ffffff?text=No+Poster';
                    }}
                  />
                  
                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold">{booking.show.movie.title}</h3>
                          <span className="text-xs text-gray-500">ID: {booking._id.slice(-8)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{new Date(booking.show.showDateTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{booking.show.cinemaHall ? booking.show.cinemaHall.name : 'Star Cineplex'}</span>
                          </div>
                          <span>Seats: {booking.bookedSeats.join(", ")}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Booked on: {new Date(booking.bookingDate).toLocaleDateString()} at {new Date(booking.bookingDate).toLocaleTimeString()}
                        </div>
                        {booking.show.cinemaHall && (
                          <div className="text-xs text-gray-400">
                            <span className="text-primary">{booking.show.cinemaHall.capacity} seats</span> • {booking.show.cinemaHall.features.slice(0, 2).join(", ")}
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {booking.isPaid ? (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Paid</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <XCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">${booking.amount}</p>
                        <p className="text-sm text-gray-400">Total Amount</p>
                      </div>
                      
                      <div className="flex gap-3">
                        {!booking.isPaid && (
                          <button
                            onClick={() => handlePayNow(booking)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-lg"
                          >
                            <CreditCardIcon className="w-4 h-4" />
                            Pay Now
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={handleClosePaymentModal}
        booking={paymentModal.booking}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default MyBookings;