import { ArrowRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import MovieCard from "./MovieCard";
import { fetchActiveMovies } from "../lib/api/movies";

const FeaturedSection = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await fetchActiveMovies(4);
                setMovies(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden">
      
      <div className="relative flex items-center justify-between pt-20 pb-10">
        <BlurCircle top='0' right="-80px"/>
        <p className="text-gray-300 font-medium text-lg">Now Showing</p>
        <button onClick={()=> navigate('/movies')} className="group flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            View All 
            <ArrowRight className="group-hover:translate-x-0.5 transition w-4.5 h-4.5"/>
        </button>
      </div>
      
      <div className="flex flex-wrap max-sm:justify-center gap-8 mt-8">
        {(loading ? [] : movies).map((show)=> (
            <MovieCard key={show._id} movie={show}/>
        ))}
      </div>
      
      <div className="flex justify-center mt-20">
        <button onClick={()=> {navigate('/movies'); scrollTo(0, 0);}}
        className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer">Show More</button>
      </div>
    </div>
  );
}

export default FeaturedSection;