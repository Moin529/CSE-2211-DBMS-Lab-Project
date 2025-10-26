import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyDateTimeData } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon, StarsIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { fetchActiveMovies, fetchMovieById, fetchMovieCasts } from "../lib/api/movies";
import { fetchMovieReviews, fetchMyReview, upsertMyReview, getCurrentUserInfo } from "../lib/api/reviews";
import { supabase } from "../lib/supabase";
import { isMovieFavorited, toggleFavorite } from "../lib/favoritesManager";
import { getTrailerUrl, hasTrailer } from "../lib/trailerMapping";
import TrailerModal from "../components/TrailerModal";
import toast from 'react-hot-toast';

const MovieDetails = () => {

  const navigate = useNavigate()
  const {id} = useParams()
  const [show, setShow] = useState(null)
  const [related, setRelated] = useState([])
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [myReview, setMyReview] = useState(null)
  const [myRating, setMyRating] = useState(0)
  const [myText, setMyText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [trailerModal, setTrailerModal] = useState({ isOpen: false, url: null })

  const getShow = async () => {
    try {
      const movie = await fetchMovieById(id);
      const casts = await fetchMovieCasts(id);
      setShow({
        movie: { ...movie, casts },
        dateTime: dummyDateTimeData
      });
      const rel = await fetchActiveMovies(4);
      setRelated(rel.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      setShow(null);
    }
  }

  useEffect(() => {
    getShow();
  }, [id]);

  // Load auth user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const info = await getCurrentUserInfo();
        setUserInfo(info);
      }
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const info = await getCurrentUserInfo();
        setUserInfo(info);
      } else {
        setUserInfo(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check if movie is favorited when user or movie changes
  useEffect(() => {
    if (user && show?.movie?._id) {
      const favorited = isMovieFavorited(user.id, show.movie._id);
      setIsFavorited(favorited);
    } else {
      setIsFavorited(false);
    }
  }, [user, show?.movie?._id]);

  // Load reviews data
  useEffect(() => {
    (async () => {
      if (!id || !show?.movie?._id) return;
      
      console.log('Loading reviews for movie:', { routeId: id, movieId: show.movie._id });
      
      try {
        const { averageRating, reviews } = await fetchMovieReviews(show.movie._id);
        console.log('Fetched reviews:', { averageRating, reviews });
        setAverageRating(averageRating);
        setReviews(reviews);
      } catch (e) {
        console.error('Error fetching reviews:', e);
      }
      try {
        const mine = await fetchMyReview(show.movie._id);
        console.log('Fetched my review:', mine);
        if (mine) {
          setMyReview(mine);
          setMyRating(mine.rating);
          setMyText(mine.review || "");
        } else {
          setMyReview(null);
          setMyRating(0);
          setMyText("");
        }
      } catch (e) {
        console.error('Error fetching my review:', e);
      }
    })();
  }, [id, user?.id, show?.movie?._id]);

  const roundedAverage = useMemo(() => Math.round((averageRating || 0) * 10) / 10, [averageRating]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to submit a review");
      return;
    }
    if (!myRating) return;
    setSubmitting(true);
    
    const movieKey = show?.movie?._id;
    if (!movieKey) {
      alert('Movie data not loaded yet. Please wait and try again.');
      setSubmitting(false);
      return;
    }
    
    console.log('Submitting review for movie:', movieKey);
    
    try {
      const saved = await upsertMyReview(movieKey, { rating: myRating, review: myText });
      console.log('Review saved:', saved);

      // Optimistically update local list
      setReviews((prev) => {
        const existingIdx = prev.findIndex(r => r.user_id === user?.id);
        const newReview = {
          id: saved?.id || Math.random().toString(36),
          rating: myRating,
          review: myText,
          created_at: saved?.created_at || new Date().toISOString(),
          user_id: user?.id,
          users: userInfo
        };
        
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], ...newReview };
          return next;
        }
        return [newReview, ...prev];
      });

      // Update my review state
      setMyReview(saved);
      
      // Recompute average locally
      setAverageRating((prevAvg) => {
        const all = reviews && reviews.length ? reviews : [];
        const withMine = (() => {
          const idx = all.findIndex(r => r.user_id === user?.id);
          if (idx >= 0) { 
            const n = [...all]; 
            n[idx] = { ...n[idx], rating: myRating }; 
            return n; 
          }
          return [{ rating: myRating, user_id: user?.id }, ...all];
        })();
        const sum = withMine.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        return withMine.length ? sum / withMine.length : myRating;
      });

      // Reset input controls after successful submit
      setMyRating(0);
      setMyText("");

      // Background refetch to stay in sync
      setTimeout(async () => {
        try {
          console.log('Background refetching reviews for movie:', movieKey);
          const fresh = await fetchMovieReviews(movieKey);
          console.log('Background refetch result:', fresh);
          setAverageRating(fresh.averageRating);
          setReviews(fresh.reviews);
        } catch (err) {
          console.error('Background refetch failed:', err);
        }
      }, 1000);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to add movies to favorites");
      return;
    }
    
    if (!show?.movie) {
      toast.error("Movie data not loaded");
      return;
    }

    try {
      const newFavoriteStatus = toggleFavorite(user.id, show.movie);
      setIsFavorited(newFavoriteStatus);
      
      if (newFavoriteStatus) {
        toast.success("Added to favorites!");
      } else {
        toast.success("Removed from favorites!");
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorites");
    }
  };

  const handleWatchTrailer = () => {
    if (!show?.movie) {
      toast.error("Movie data not loaded");
      return;
    }

    const trailerUrl = getTrailerUrl(show.movie.title);
    
    if (trailerUrl) {
      // Open trailer in modal
      setTrailerModal({ isOpen: true, url: trailerUrl });
    } else {
      toast.error("Trailer not available for this movie");
    }
  };

  const handleCloseTrailerModal = () => {
    setTrailerModal({ isOpen: false, url: null });
  };

  return show? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
       <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img src={show.movie.poster_path} alt="" className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"/>

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">{show.movie.title}</h1>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-primary fill-primary"/>
              {show.movie.vote_average.toFixed(1)}
              <span className="text-gray-500">TMDB</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
              {roundedAverage.toFixed(1)}
              <span className="text-gray-500">User</span>
            </div>
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>
          
          <p>
            {timeFormat(show.movie.runtime)} • {show.movie.genres.map(genre => genre.name).join(" | ")} • {show.movie.release_date.split("-")[0]}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button 
              onClick={handleWatchTrailer}
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              <PlayCircleIcon className="w-6 h-6"/>
              Watch Trailer
            </button>
            <a href="#dateSelect" className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95">Buy Tickets</a>
            <button 
              onClick={handleToggleFavorite}
              className={`p-2.5 rounded-full transition cursor-pointer active:scale-95 ${
                isFavorited 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${
                isFavorited 
                  ? 'text-white fill-white' 
                  : 'text-gray-300'
              }`}/>
            </button>
          </div>
        </div>
       </div>

       <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
       <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts.slice(0,12).map((cast, index)=> 
          (
            <div key={index} className="flex flex-col items-center text-center">
              <img src={cast.profile_path} alt="" className="rounded-full h-20 md:h-20 aspect-square object-cover"/>
              <p className="font-medium text-xs mt-3">{cast.name}</p>
            </div>
          ))}
        </div>
       </div>

       {/* Reviews Section */}
       <div className="mt-12">
        <p className="text-lg font-medium mb-4">Ratings & Reviews</p>
        {/* Write Review */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
          <BlurCircle top='-80px' left='-80px' />
          <BlurCircle top='60px' right='-20px' />
          <form onSubmit={handleSubmitReview} className="flex-1 w-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {[1,2,3,4,5].map((n)=> (
                <button type="button" key={n} onClick={()=> setMyRating(n)} className="active:scale-95">
                  <StarIcon className={`w-6 h-6 ${myRating >= n ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`}/>
                </button>
              ))}
              <span className="text-sm text-gray-300 ml-1">{myRating ? `${myRating}/5` : "Select rating"}</span>
            </div>
            <textarea value={myText} onChange={(e)=> setMyText(e.target.value)} placeholder={user? "Share your thoughts (optional)" : "Sign in to write a review"} className="w-full bg-transparent border border-primary/20 rounded-md px-3 py-3 text-sm outline-none focus:border-primary/60" disabled={!user}></textarea>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
                <span>{roundedAverage.toFixed(1)} average • {reviews.length} reviews</span>
              </div>
            </div>
          </form>
          <button disabled={!user || !myRating || submitting} className="bg-primary text-white px-8 py-2 mt-4 md:mt-0 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50" onClick={handleSubmitReview}>
            {myReview ? (submitting ? "Updating..." : "Update Review") : (submitting ? "Submitting..." : "Submit Review")}
          </button>
        </div>
 
        {/* Reviews List */}
        <div className="mt-6 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-xs">
                    {(r.users?.display_name?.[0] || r.users?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.users?.display_name || r.users?.email || "User"}</p>
                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((n)=> (
                    <StarIcon key={n} className={`w-4 h-4 ${r.rating >= n ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`}/>
                  ))}
                </div>
              </div>
              {r.review && <p className="text-sm text-gray-300 mt-3">{r.review}</p>}
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-sm text-gray-500">No reviews yet. Be the first to review this movie.</p>
          )}
        </div>
       </div>

       <DateSelect dateTime={show.dateTime} id={id}/>

       <p className="text-lg font-medium mt-20 mb-8">You may also like</p>
       <div className="flex flex-wrap max-sm:justify-center gap-8">
          {related.map((movie, index)=> (
            <MovieCard key={index} movie={movie}/>
          ))}
       </div>
       <div className="flex justify-center mt-20">
          <button onClick={()=> navigate('/movies')} className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer">
            Show More
          </button>
       </div>

       {/* Trailer Modal */}
       <TrailerModal
         isOpen={trailerModal.isOpen}
         onClose={handleCloseTrailerModal}
         trailerUrl={trailerModal.url}
         movieTitle={show?.movie?.title}
       />

    </div>
  ) : <Loading />
}

export default MovieDetails;