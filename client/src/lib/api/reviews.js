import { supabase } from "../supabase";

// Fetch aggregate rating and latest reviews for a movie
export async function fetchMovieReviews(movieId, { limit = 10 } = {}) {
  console.log('fetchMovieReviews called with movieId:', movieId);
  
  try {
    // First get the reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("movie_reviews")
      .select("id, rating, review, created_at, user_id")
      .eq("movie_id", movieId)
      .order("created_at", { ascending: false })
      .limit(limit);

    console.log('Reviews query result:', { reviews, reviewsError });
    if (reviewsError) throw reviewsError;

    // Then get the average rating using a separate query
    const { data: avgData, error: avgError } = await supabase
      .from("movie_reviews")
      .select("rating")
      .eq("movie_id", movieId);

    console.log('Average query result:', { avgData, avgError });
    if (avgError) throw avgError;

    // Calculate average manually
    let average = 0;
    if (avgData && avgData.length > 0) {
      const sum = avgData.reduce((acc, item) => acc + (item.rating || 0), 0);
      average = sum / avgData.length;
    }

    // If we have reviews, fetch user info for each one
    let reviewsWithUsers = reviews || [];
    if (reviewsWithUsers.length > 0) {
      try {
        const userIds = [...new Set(reviewsWithUsers.map(r => r.user_id))];
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, display_name, email')
          .in('id', userIds);
        
        if (!usersError && usersData) {
          const usersMap = usersData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});
          
          reviewsWithUsers = reviewsWithUsers.map(review => ({
            ...review,
            users: usersMap[review.user_id] || { email: 'Unknown User' }
          }));
        }
      } catch (userFetchError) {
        console.warn('Could not fetch user info for reviews:', userFetchError);
        // Fallback: add basic user info
        reviewsWithUsers = reviewsWithUsers.map(review => ({
          ...review,
          users: { email: 'User' }
        }));
      }
    }

    console.log('Final result:', { averageRating: average, reviews: reviewsWithUsers });
    return {
      averageRating: average,
      reviews: reviewsWithUsers
    };
  } catch (error) {
    console.error('Error in fetchMovieReviews:', error);
    throw error;
  }
}

// Fetch the current user's review (if any) for this movie
export async function fetchMyReview(movieId) {
  console.log('fetchMyReview called with movieId:', movieId);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from("movie_reviews")
    .select("id, rating, review, created_at, user_id")
    .eq("movie_id", movieId)
    .eq("user_id", user.id)
    .single();
    
  console.log('My review query result:', { data, error });
  
  if (error && error.code !== "PGRST116") throw error; // not found is ok
  return data || null;
}

// Create or update a review for the current user
export async function upsertMyReview(movieId, { rating, review }) {
  console.log('upsertMyReview called with:', { movieId, rating, review });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const payload = { movie_id: movieId, user_id: user.id, rating, review };

  console.log('Review payload:', payload);

  // Use explicit update/insert to avoid onConflict issues across PostgREST versions
  const existing = await supabase
    .from("movie_reviews")
    .select("id")
    .eq("movie_id", movieId)
    .eq("user_id", user.id)
    .maybeSingle();

  console.log('Existing review check:', existing);

  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    console.log('Updating existing review with ID:', existing.data.id);
    const { data, error } = await supabase
      .from("movie_reviews")
      .update({ rating, review })
      .eq("id", existing.data.id)
      .select()
      .single();
    if (error) throw error;
    console.log('Update result:', data);
    return data;
  } else {
    console.log('Inserting new review');
    const { data, error } = await supabase
      .from("movie_reviews")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    console.log('Insert result:', data);
    return data;
  }
}

// Get current user's display info
export async function getCurrentUserInfo() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Try to get from users table first
  const { data: userData } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .single();
  
  return {
    id: user.id,
    display_name: userData?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
    email: user.email
  };
}

