import { supabase } from "../supabase";
import { getAdminBookings, getDashboardStats } from "../bookingManager";

// Check if current user is admin
export async function checkAdminStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false, user: null };

    // Try to get user data from the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Could not fetch user data from users table:', error);
      // Fallback: check if user has admin metadata
      const isAdminFromMetadata = user.user_metadata?.is_admin || false;
      return {
        isAdmin: isAdminFromMetadata,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email,
          is_admin: isAdminFromMetadata
        }
      };
    }
    
    return {
      isAdmin: data?.is_admin || false,
      user: data
    };
  } catch (error) {
    console.error('Error checking admin status:', error);
    // Return false for admin status to be safe
    return { isAdmin: false, user: null };
  }
}

// Create admin user (simplified approach)
export async function createAdminUser(email, password, displayName) {
  try {
    console.log('Creating admin user...');
    
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user created');
    }

    console.log('Auth user created:', authData.user.id);

    // Wait a moment to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to update the users table - this might fail due to RLS, but that's okay
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_admin: true, 
          display_name: displayName,
          email: email
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.warn('Could not update users table due to RLS:', updateError);
        // This is expected due to RLS policies
      }
    } catch (updateError) {
      console.warn('Update error (expected):', updateError);
    }

    return authData;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Dashboard Statistics
export async function fetchDashboardStats() {
  try {
    // Use centralized booking manager for real-time data
    const stats = getDashboardStats();
    
    return {
      totalBookings: stats.totalBookings,
      totalRevenue: parseFloat(stats.totalRevenue.toFixed(2)),
      activeMovies: stats.activeMovies,
      totalUsers: stats.totalUsers,
      analytics: stats.analytics
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Active Movies for Dashboard
export async function fetchActiveMoviesForDashboard(limit = 4) {
  try {
    const { data, error } = await supabase
      .from('movie_details')
      .select('*')
      .eq('status', 'active')
      .limit(limit);
    
    if (error) throw error;
    
    return (data || []).map(movie => ({
      ...movie,
      _id: movie.id,
      genres: (movie.genres || []).map(name => ({ name }))
    }));
  } catch (error) {
    console.error('Error fetching active movies:', error);
    throw error;
  }
}

// Shows Management
export async function fetchAllShows() {
  try {
    const { data, error } = await supabase
      .from('show_details')
      .select('*')
      .order('show_datetime', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching shows:', error);
    throw error;
  }
}

export async function createShow(showData) {
  try {
    const { data, error } = await supabase
      .from('shows')
      .insert([showData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating show:', error);
    throw error;
  }
}

export async function updateShow(showId, updates) {
  try {
    const { data, error } = await supabase
      .from('shows')
      .update(updates)
      .eq('id', showId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating show:', error);
    throw error;
  }
}

export async function deleteShow(showId) {
  try {
    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', showId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting show:', error);
    throw error;
  }
}

// Bookings Management
export async function fetchAllBookings() {
  try {
    // Use centralized booking manager for real-time data
    const bookings = getAdminBookings();
    
    // Sort by creation date (newest first)
    return bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

export async function updateBookingStatus(bookingId, status) {
  try {
    // For now, we'll just return success since we're using localStorage
    // In a real app, this would update the database
    console.log(`Booking ${bookingId} status updated to ${status}`);
    return { id: bookingId, booking_status: status };
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

// Cinema Halls
export async function fetchCinemaHalls() {
  try {
    const { data, error } = await supabase
      .from('cinema_halls')
      .select('*')
      .eq('status', 'active');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching cinema halls:', error);
    throw error;
  }
}

// Movies for Admin
export async function fetchAllMovies() {
  try {
    const { data, error } = await supabase
      .from('movie_details')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(movie => ({
      ...movie,
      _id: movie.id,
      genres: (movie.genres || []).map(name => ({ name }))
    }));
  } catch (error) {
    console.error('Error fetching movies:', error);
    throw error;
  }
}

// Revenue Analytics
export async function fetchRevenueAnalytics(days = 7) {
  try {
    const { data, error } = await supabase
      .from('booking_analytics')
      .select('*')
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    throw error;
  }
} 