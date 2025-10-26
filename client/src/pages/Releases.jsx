import React, { useState } from 'react';
import { Calendar, Clock, Star, Play, ArrowRight } from 'lucide-react';
import BlurCircle from '../components/BlurCircle';

const Releases = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const upcomingReleases = [
    {
      id: 1,
      title: "Avatar: The Way of Water",
      releaseDate: "2024-12-15",
      poster: "https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
      genre: "Sci-Fi",
      duration: "192 min",
      rating: 8.2,
      description: "Set more than a decade after the events of the first film, Avatar: The Way of Water begins to tell the story of the Sully family.",
      category: "blockbuster",
      status: "now-playing"
    },
    {
      id: 2,
      title: "Black Panther: Wakanda Forever",
      releaseDate: "2024-11-11",
      poster: "https://image.tmdb.org/t/p/original/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
      genre: "Action",
      duration: "161 min",
      rating: 7.3,
      description: "Queen Ramonda, Shuri, M'Baku, Okoye and the Dora Milaje fight to protect their nation from intervening world powers.",
      category: "marvel",
      status: "coming-soon"
    },
    {
      id: 3,
      title: "Top Gun: Maverick",
      releaseDate: "2024-10-20",
      poster: "https://image.tmdb.org/t/p/original/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
      genre: "Action",
      duration: "131 min",
      rating: 8.3,
      description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past.",
      category: "action",
      status: "coming-soon"
    },
    {
      id: 4,
      title: "The Batman",
      releaseDate: "2024-09-15",
      poster: "https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
      genre: "Crime",
      duration: "176 min",
      rating: 7.8,
      description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate.",
      category: "dc",
      status: "coming-soon"
    },
    {
      id: 5,
      title: "Jurassic World: Dominion",
      releaseDate: "2024-08-10",
      poster: "https://image.tmdb.org/t/p/original/kAVRgw7GgK1CfYEJq8ME6EvRIgU.jpg",
      genre: "Adventure",
      duration: "147 min",
      rating: 6.0,
      description: "Four years after the destruction of Isla Nublar, dinosaurs now live and hunt alongside humans all over the world.",
      category: "adventure",
      status: "coming-soon"
    },
    {
      id: 6,
      title: "Spider-Man: No Way Home",
      releaseDate: "2024-07-05",
      poster: "https://image.tmdb.org/t/p/original/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
      genre: "Action",
      duration: "148 min",
      rating: 8.2,
      description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes arrive.",
      category: "marvel",
      status: "now-playing"
    },
    {
      id: 7,
      title: "Dune",
      releaseDate: "2024-06-20",
      poster: "https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      genre: "Sci-Fi",
      duration: "155 min",
      rating: 8.0,
      description: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet.",
      category: "sci-fi",
      status: "coming-soon"
    },
    {
      id: 8,
      title: "Encanto",
      releaseDate: "2024-05-25",
      poster: "https://image.tmdb.org/t/p/original/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg",
      genre: "Animation",
      duration: "102 min",
      rating: 7.3,
      description: "The tale of an extraordinary family, the Madrigals, who live hidden in the mountains of Colombia, in a magical house.",
      category: "animation",
      status: "coming-soon"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Releases' },
    { id: 'coming-soon', name: 'Coming Soon' },
    { id: 'now-playing', name: 'Now Playing' },
    { id: 'blockbuster', name: 'Blockbusters' },
    { id: 'marvel', name: 'Marvel' },
    { id: 'dc', name: 'DC Comics' },
    { id: 'action', name: 'Action' },
    { id: 'sci-fi', name: 'Sci-Fi' },
    { id: 'animation', name: 'Animation' }
  ];

  const filteredReleases = selectedCategory === 'all' 
    ? upcomingReleases 
    : upcomingReleases.filter(movie => 
        selectedCategory === 'coming-soon' || selectedCategory === 'now-playing'
          ? movie.status === selectedCategory
          : movie.category === selectedCategory
      );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'coming-soon': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'now-playing': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'marvel': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'dc': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'blockbuster': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'action': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'sci-fi': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'animation': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'adventure': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 py-20 relative overflow-hidden">
        <BlurCircle top="10%" right="-10%" />
        <BlurCircle top="60%" left="-5%" />
        <div className="px-6 md:px-16 lg:px-36">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
            New Releases
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Discover the latest movies hitting theaters. From blockbuster hits to indie gems, stay ahead of the curve with our comprehensive release calendar.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-6 md:px-16 lg:px-36 py-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="px-6 md:px-16 lg:px-36 py-8 relative">
        <BlurCircle top="50px" left="0px" />
        <BlurCircle bottom="50px" right="50px" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReleases.map((movie) => (
            <div key={movie.id} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 group">
              {/* Movie Poster */}
              <div className="relative">
                <img 
                  src={movie.poster} 
                  alt={movie.title}
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik0xMjAgMTgwSDIwMFYyNzBIMTIwVjE4MFoiIGZpbGw9IiM2NjY2NjYiLz4KPHN2Zz4K';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(movie.status)}`}>
                    {movie.status === 'coming-soon' ? 'Coming Soon' : 'Now Playing'}
                  </span>
                </div>
              </div>

              {/* Movie Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white line-clamp-2">{movie.title}</h3>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-300">{movie.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(movie.releaseDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{movie.duration}</span>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{movie.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(movie.category)}`}>
                    {movie.genre}
                  </span>
                  <button className="flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors text-sm font-medium">
                    View Details
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-6 md:px-16 lg:px-36 py-16 relative">
        <BlurCircle top="30%" right="-8%" />
        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl p-8 text-center border border-red-500/20">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            Stay Updated with Latest Releases
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Never miss a movie premiere! Subscribe to our newsletter and get notified about upcoming releases, exclusive screenings, and special offers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Releases;
