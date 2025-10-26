import React, { useEffect, useState } from "react";
import { useLayoutEffect } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { fetchActiveMovies } from "../lib/api/movies";

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    console.log("Scrolling to top...");
    // Delay slightly to ensure content is rendered
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchActiveMovies();
        setMovies(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load movies.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-center text-3xl font-bold mt-20">Loading...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-center text-3xl font-bold mt-20">{error}</h1>
      </div>
    );
  }

  return movies.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
       
       <BlurCircle top="150px" left="0px" />
       <BlurCircle bottom="50px" right="50px" />

       <h1 className="text-lg font-medium my-4">Now Showing</h1>
       <div className="flex flex-wrap max-sm:justify-center gap-8">
        {movies.map((movie) => (
          <MovieCard movie={movie} key={movie._id}/>
        ))}
       </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-center text-3xl font-bold mt-20">
        No Movies Available
      </h1>
      <p className="text-center text-gray-500 mt-4">
        Please check back later for updates.
      </p>
    </div>
  )
}

export default Movies;