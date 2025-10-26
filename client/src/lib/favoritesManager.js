// Centralized favorites management system
// This handles adding/removing movies from favorites

const FAVORITES_STORAGE_KEY = 'userFavorites';

// Get all favorites for a specific user
export const getUserFavorites = (userId) => {
  try {
    const allFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    return allFavorites.filter(favorite => favorite.userId === userId);
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return [];
  }
};

// Check if a movie is favorited by a user
export const isMovieFavorited = (userId, movieId) => {
  try {
    const userFavorites = getUserFavorites(userId);
    return userFavorites.some(favorite => favorite.movieId === movieId);
  } catch (error) {
    console.error('Error checking if movie is favorited:', error);
    return false;
  }
};

// Add a movie to favorites
export const addToFavorites = (userId, movie) => {
  try {
    const allFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    
    // Check if already favorited
    const existingIndex = allFavorites.findIndex(
      favorite => favorite.userId === userId && favorite.movieId === movie._id
    );
    
    if (existingIndex === -1) {
      // Add new favorite
      const newFavorite = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        movieId: movie._id,
        movie: movie,
        addedAt: new Date().toISOString()
      };
      
      allFavorites.push(newFavorite);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(allFavorites));
      return true;
    }
    
    return false; // Already favorited
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

// Remove a movie from favorites
export const removeFromFavorites = (userId, movieId) => {
  try {
    const allFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    
    const updatedFavorites = allFavorites.filter(
      favorite => !(favorite.userId === userId && favorite.movieId === movieId)
    );
    
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

// Toggle favorite status
export const toggleFavorite = (userId, movie) => {
  try {
    const isFavorited = isMovieFavorited(userId, movie._id);
    
    if (isFavorited) {
      removeFromFavorites(userId, movie._id);
      return false; // Removed from favorites
    } else {
      addToFavorites(userId, movie);
      return true; // Added to favorites
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// Clear all favorites for a user
export const clearUserFavorites = (userId) => {
  try {
    const allFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    const updatedFavorites = allFavorites.filter(favorite => favorite.userId !== userId);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));
    return true;
  } catch (error) {
    console.error('Error clearing user favorites:', error);
    throw error;
  }
};

// Clear all favorites (for testing)
export const clearAllFavorites = () => {
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
};