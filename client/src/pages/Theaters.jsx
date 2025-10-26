import React from 'react';
import { MapPin, Users, Star } from 'lucide-react';
import BlurCircle from '../components/BlurCircle';

const Theaters = () => {
  const theaters = [
    {
      id: 1,
      name: "Star Cineplex",
      image: "https://cdn.risingbd.com/media/imgAll/2020August/en/Star_Cineplex2-2009011145.jpg",
      capacity: 1600,
      location: "https://www.google.com/maps/place/Star+Cineplex+-+Mirpur+1/data=!4m7!3m6!1s0x3755c15c3cfca391:0x18c46f2e75c2f64c!8m2!3d23.8002945!4d90.3554802!16s%2Fg%2F11j8vz8hlt!19sChIJkaP8PFzBVTcRTPbCdS5vxBg?authuser=0&hl=en&rclk=1",
      description: "Experience premium cinema at Star Cineplex with state-of-the-art sound systems, comfortable seating, and the latest blockbuster movies. Located in the heart of Mirpur, this modern cinema hall offers an unforgettable movie-watching experience.",
      rating: 4.5,
      features: ["IMAX Screen", "Dolby Atmos", "Premium Seating", "Food Court"]
    },
    {
      id: 2,
      name: "Blockbuster Cinema",
      image: "https://upload.wikimedia.org/wikipedia/commons/3/32/Blockbuster-cinemas_JFP.jpg",
      capacity: 1800,
      location: "https://www.google.com/maps/place/Blockbuster%2BCinemas/data%3D!4m2!3m1!1s0x0:0xa1937d99fb2a1ae1%3Fsa%3DX%26ved%3D1t:2428%26ictx%3D111&ved=2ahUKEwjNlJ_x-LyQAxXd4zgGHcdGOa4Q_BJ6BAg7EAw&usg=AOvVaw05clDEadb24E7yLyEaTz4O",
      description: "Blockbuster Cinema brings you the ultimate movie experience with multiple screens, advanced projection technology, and spacious auditoriums. Perfect for families and movie enthusiasts looking for comfort and quality entertainment.",
      rating: 4.3,
      features: ["Multiple Screens", "3D Projection", "Family Packages", "Parking Available"]
    },
    {
      id: 3,
      name: "Shimanto Shambhar",
      image: "https://observerbd.com/2019/01/25/observerbd.com_1548437196.jpg",
      capacity: 800,
      location: "https://www.google.com/maps/place/Shimanto%2BShambhar%2B-%2BShopping%2BComplex/data%3D!4m2!3m1!1s0x0:0x67e5710fa650f8c0%3Fsa%3DX%26ved%3D1t:2428%26ictx%3D111&ved=2ahUKEwi99Kal-ryQAxULzjgGHUCOGz0Q_BJ6BAgZEAw&usg=AOvVaw2LjFZYXUBaUA34kFZwpTwB",
      description: "Located within the Shimanto Shambhar Shopping Complex, this cinema hall offers a cozy and intimate movie experience. With modern amenities and comfortable seating, it's perfect for enjoying the latest releases in a relaxed environment.",
      rating: 4.1,
      features: ["Shopping Complex", "Food Court", "Air Conditioning", "Easy Access"]
    },
    {
      id: 4,
      name: "Sony Cinema Hall",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCqZLSsd9O5WOdDhAiw-CN3VBZGeYEz57Dgg&s",
      capacity: 770,
      location: "https://www.google.com/maps/place/Sony+Cinema+Hall/data=!4m7!3m6!1s0x3755c135b300e601:0x4e91dba279841654!8m2!3d23.8003906!4d90.3553414!16s%2Fg%2F11h3jgzybv!19sChIJAeYAszXBVTcRVBaEeaLbkU4?authuser=0&hl=en&rclk=1",
      description: "Sony Cinema Hall features cutting-edge Sony projection technology and premium sound systems. This modern facility provides an exceptional viewing experience with crystal-clear picture quality and immersive audio.",
      rating: 4.4,
      features: ["Sony Technology", "Premium Sound", "HD Projection", "Comfortable Seats"]
    },
    {
      id: 5,
      name: "Lions Cinema",
      image: "https://pbs.twimg.com/media/FL9AbvWacAA614p?format=jpg&name=4096x4096",
      capacity: 800,
      location: "https://www.google.com/maps/place/Lion+Cinemas/@23.7033538,90.3976135,17z/data=!3m1!4b1!4m6!3m5!1s0x3755b9cbfd437cc5:0x905356c82ffdf958!8m2!3d23.7033538!4d90.3976135!16s%2Fg%2F11gm8sgpbh?entry=ttu&g_ep=EgoyMDI1MTAyMC4wIKXMDSoASAFQAw%3D%3D",
      description: "Lions Cinema offers a classic movie-going experience with modern amenities. Known for its friendly service and comfortable atmosphere, it's a favorite destination for movie lovers seeking quality entertainment at affordable prices.",
      rating: 4.2,
      features: ["Affordable Pricing", "Friendly Service", "Modern Amenities", "Convenient Location"]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 py-20 relative overflow-hidden">
        <BlurCircle top="10%" right="-10%" />
        <BlurCircle top="60%" left="-5%" />
        <div className="px-6 md:px-16 lg:px-36">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Our Cinema Halls
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Discover our premium cinema halls across the city, each offering unique experiences with state-of-the-art technology and comfortable seating.
          </p>
        </div>
      </div>

      {/* Cinema Halls Section */}
      <div className="px-6 md:px-16 lg:px-36 py-16 relative">
      <BlurCircle top="50px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {theaters.map((theater) => (
            <div key={theater.id} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10">
              <div className="flex gap-6">
                {/* Image Section */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-xl overflow-hidden">
                    <img 
                      src={theater.image} 
                      alt={theater.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjMzMzMzMzIi8+CjxwYXRoIGQ9Ik00OCA0OEg4MFY4MEg0OFY0OFoiIGZpbGw9IiM2NjY2NjYiLz4KPHN2Zz4K';
                      }}
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-bold text-white">{theater.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-300">{theater.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {theater.description}
                  </p>

                  {/* Capacity and Location */}
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-300">{theater.capacity} seats</span>
                    </div>
                    <a 
                      href={theater.location} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>View on Map</span>
                    </a>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {theater.features.map((feature, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
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
            Ready to Book Your Movie?
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Choose from our selection of premium cinema halls and enjoy the latest blockbusters in comfort and style.
          </p>
          <button 
            onClick={() => window.location.href = '/movies'}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Browse Movies
          </button>
        </div>
      </div>
    </div>
  );
};

export default Theaters;
