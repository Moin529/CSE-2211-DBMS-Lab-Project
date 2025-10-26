import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { Heart } from "lucide-react";
import { fetchActiveMovies } from "../lib/api/movies";
import { getUserFavorites, clearUserFavorites } from "../lib/favoritesManager";
import { supabase } from "../lib/supabase";
import toast from 'react-hot-toast';

const Favorite = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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
    const loadFavorites = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          setMovies([]);
          return;
        }

        // Get user's favorite movies
        const favorites = getUserFavorites(user.id);
        
        // Extract movie data from favorites
        const favoriteMovies = favorites.map(favorite => favorite.movie);
        
        setMovies(favoriteMovies);
      } catch (err) {
        console.error('Error loading favorites:', err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  const handleClearFavorites = () => {
    if (!user) {
      toast.error("Please sign in to manage favorites");
      return;
    }

    if (window.confirm("Are you sure you want to clear all your favorites? This action cannot be undone.")) {
      try {
        clearUserFavorites(user.id);
        setMovies([]);
        toast.success("All favorites cleared!");
      } catch (error) {
        console.error('Error clearing favorites:', error);
        toast.error("Failed to clear favorites");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-center text-3xl font-bold mt-20">
          Please Sign In
        </h1>
        <p className="text-center text-gray-500 mt-4">
          You need to be signed in to view your favorite movies.
        </p>
      </div>
    );
  }

  return movies.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
       
       <BlurCircle top="150px" left="0px" />
       <BlurCircle bottom="50px" right="50px" />

       <div className="flex items-center justify-between mb-4">
         <h1 className="text-lg font-medium">Your Favorite Movies</h1>
         <button
           onClick={handleClearFavorites}
           className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition rounded-lg text-sm"
         >
           Clear All Favorites
         </button>
       </div>
       
       <div className="flex flex-wrap max-sm:justify-center gap-8">
        {movies.map((movie) => (
          <MovieCard movie={movie} key={movie._id}/>
        ))}
       </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Heart className="w-12 h-12 text-gray-400" />
      </div>
      <h1 className="text-center text-3xl font-bold mt-20">
        No Favorite Movies Yet
      </h1>
      <p className="text-center text-gray-500 mt-4">
        Start adding movies to your favorites by clicking the heart icon on movie pages.
      </p>
    </div>
  )
}

export default Favorite;