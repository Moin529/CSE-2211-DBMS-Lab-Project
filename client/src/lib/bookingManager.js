// Centralized booking management system
// This handles both localStorage and admin dashboard updates

const BOOKING_STORAGE_KEY = 'userBookings';
const ADMIN_BOOKINGS_KEY = 'adminBookings';

// Generate unique booking ID
const generateBookingId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Get all bookings from localStorage
export const getAllBookings = () => {
  try {
    return JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error getting bookings:', error);
    return [];
  }
};

// Get bookings for a specific user
export const getUserBookings = (userId) => {
  const allBookings = getAllBookings();
  return allBookings.filter(booking => booking.user.id === userId);
};

// Get all bookings for admin (includes all users)
export const getAdminBookings = () => {
  const allBookings = getAllBookings();
  
  // Transform to admin format
  return allBookings.map(booking => ({
    id: booking._id,
    booking_reference: booking._id.slice(-8),
    user_name: booking.user.name,
    user_email: booking.user.email,
    movie_title: booking.show.movie.title,
    poster_path: booking.show.movie.poster_path,
    show_datetime: booking.show.showDateTime,
    hall_name: booking.show.cinemaHall?.name || 'Star Cineplex',
    booked_seats: booking.bookedSeats,
    total_amount: parseFloat(booking.amount),
    booking_status: booking.isPaid ? 'confirmed' : 'pending',
    payment_status: booking.isPaid ? 'paid' : 'pending',
    created_at: booking.bookingDate,
    special_requests: booking.specialRequests || null
  }));
};

// Create a new booking
export const createBooking = (bookingData) => {
  try {
    const booking = {
      _id: generateBookingId(),
      user: bookingData.user,
      show: bookingData.show,
      amount: bookingData.amount,
      bookedSeats: bookingData.bookedSeats,
      isPaid: false,
      bookingDate: new Date().toISOString(),
      specialRequests: bookingData.specialRequests || null
    };

    // Get existing bookings
    const existingBookings = getAllBookings();
    
    // Add new booking
    const updatedBookings = [...existingBookings, booking];
    
    // Save to localStorage
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(updatedBookings));
    
    // Update admin analytics
    updateAdminAnalytics();
    
    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// Update booking payment status
export const updateBookingPayment = (bookingId, isPaid) => {
  try {
    const allBookings = getAllBookings();
    
    const updatedBookings = allBookings.map(booking => 
      booking._id === bookingId 
        ? { ...booking, isPaid }
        : booking
    );
    
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(updatedBookings));
    
    // Update admin analytics
    updateAdminAnalytics();
    
    return true;
  } catch (error) {
    console.error('Error updating booking payment:', error);
    throw error;
  }
};

// Cancel a booking
export const cancelBooking = (bookingId) => {
  try {
    const allBookings = getAllBookings();
    
    const updatedBookings = allBookings.filter(booking => booking._id !== bookingId);
    
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(updatedBookings));
    
    // Update admin analytics
    updateAdminAnalytics();
    
    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

// Update admin analytics for dashboard
const updateAdminAnalytics = () => {
  try {
    const allBookings = getAllBookings();
    
    // Calculate total bookings
    const totalBookings = allBookings.length;
    
    // Calculate total revenue (only paid bookings)
    const totalRevenue = allBookings
      .filter(booking => booking.isPaid)
      .reduce((sum, booking) => sum + parseFloat(booking.amount), 0);
    
    // Calculate daily analytics for the last 7 days
    const analytics = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.bookingDate).toISOString().split('T')[0];
        return bookingDate === dateStr;
      });
      
      const dayRevenue = dayBookings
        .filter(booking => booking.isPaid)
        .reduce((sum, booking) => sum + parseFloat(booking.amount), 0);
      
      analytics.push({
        date: dateStr,
        total_bookings: dayBookings.length,
        total_revenue: dayRevenue
      });
    }
    
    // Store analytics
    localStorage.setItem('adminAnalytics', JSON.stringify({
      totalBookings,
      totalRevenue,
      analytics
    }));
    
  } catch (error) {
    console.error('Error updating admin analytics:', error);
  }
};

// Get admin analytics
export const getAdminAnalytics = () => {
  try {
    const analytics = JSON.parse(localStorage.getItem('adminAnalytics') || '{}');
    return {
      totalBookings: analytics.totalBookings || 0,
      totalRevenue: analytics.totalRevenue || 0,
      analytics: analytics.analytics || []
    };
  } catch (error) {
    console.error('Error getting admin analytics:', error);
    return {
      totalBookings: 0,
      totalRevenue: 0,
      analytics: []
    };
  }
};

// Get dashboard stats
export const getDashboardStats = () => {
  try {
    const analytics = getAdminAnalytics();
    const allBookings = getAllBookings();
    
    // Count unique users
    const uniqueUsers = new Set(allBookings.map(booking => booking.user.id)).size;
    
    // Get active movies (this would normally come from a database)
    // For now, we'll count unique movies from bookings
    const uniqueMovies = new Set(allBookings.map(booking => booking.show.movie.title)).size;
    
    return {
      totalBookings: analytics.totalBookings,
      totalRevenue: analytics.totalRevenue,
      activeMovies: uniqueMovies,
      totalUsers: uniqueUsers,
      analytics: analytics.analytics
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      totalBookings: 0,
      totalRevenue: 0,
      activeMovies: 0,
      totalUsers: 0,
      analytics: []
    };
  }
};

// Clear all bookings (for testing)
export const clearAllBookings = () => {
  localStorage.removeItem(BOOKING_STORAGE_KEY);
  localStorage.removeItem('adminAnalytics');
};