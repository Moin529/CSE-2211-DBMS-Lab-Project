import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {

    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-start justify-center gap-6 px-6 md:px-16 lg:px-36 bg-center h-screen text-white" style={{backgroundImage: `url(${assets.backgroundImage})`, backgroundSize: '120%'}}>
            
            <img src={assets.marvelLogo} alt="" className="max-h-11 lg:h-11 mt-20" />
            
            <h1 className="text-5xl md:text-[70px] md:leading-[5rem] font-semibold max-w-4xl bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                The Amazing <br /> Spiderman
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-lg font-medium">
                <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Action | Adventure | Sci-Fi</span>
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-red-500" />
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">2012</span>
                </div>
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-red-500" />
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">2h 16m</span>
                </div>
            </div>
            <p className="max-w-md text-grey-300">Peter Parker, an outcast high school student, gets bitten by a radioactive spider and attains superpowers. While unravelling his parents' disappearance, he must fight against the Lizard.</p>
            <button onClick={()=> navigate('/movies')} className="flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer">
                Explore Movies
                <ArrowRight className="w-5 h-5"/>
            </button>
        </div>
    );
};

export default HeroSection;
