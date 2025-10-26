import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyDateTimeData } from "../assets/assets";
import { Heart, StarIcon, ClockIcon, CalendarIcon, ArrowRightIcon, MapPinIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import BlurCircle from "../components/BlurCircle";
import Loading from "../components/Loading";
import toast from 'react-hot-toast';
import { fetchMovieById } from "../lib/api/movies";
import { supabase } from "../lib/supabase";
import { createBooking } from "../lib/bookingManager";

const SeatLayout = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [movie, setMovie] = useState(null);
  const [selectedDate, setSelectedDate] = useState(date);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [show, setShow] = useState(null);
  const [selectedCinemaHall, setSelectedCinemaHall] = useState(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Clear selected seats when cinema hall changes
  const handleCinemaHallChange = (hall) => {
    setSelectedCinemaHall(hall);
    setSelectedSeats([]); // Clear selected seats when hall changes
  };

  useEffect(() => {
    (async () => {
      try {
        const m = await fetchMovieById(id);
        setMovie(m);
      } catch (err) {
        console.error(err);
      }
      setAvailableDates(Object.keys(dummyDateTimeData));
    })();
  }, [id]);

  const handleSeatClick = (seatId) => {
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 6) {
      toast('You cannot select more than 6 seats.');
      return;
    }
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(seat => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const handleBooking = () => {
    if (!user) {
      alert("Please login to book tickets");
      return;
    }
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat");
      return;
    }
    if (!selectedTime) {
      alert("Please select a show time");
      return;
    }
    if (!selectedCinemaHall) {
      alert("Please select a cinema hall");
      return;
    }
    
    try {
      // Create booking using centralized booking manager
      const bookingData = {
        user: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email,
          email: user.email
        },
        show: {
          _id: selectedTime.showId,
          movie: movie,
          showDateTime: selectedTime.time,
          showPrice: 12.00, // Fixed price per seat
          cinemaHall: selectedCinemaHall
        },
        amount: (selectedSeats.length * 12.00).toFixed(2),
        bookedSeats: selectedSeats,
        specialRequests: null
      };

      // Create booking using centralized system
      createBooking(bookingData);
      
      // Show success message
      toast.success(`Booking confirmed for ${selectedSeats.length} seat(s)!`);
      
      // Navigate to my bookings page
      navigate('/my-bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  // Cinema halls data with seat layout configurations
  const cinemaHalls = [
    {
      id: "hall-1",
      name: "Star Cineplex",
      capacity: 126,
      features: ["Dolby Atmos", "4K Projection", "Recliner Seats"],
      description: "Premium viewing experience with state-of-the-art sound and visual technology",
      seatLayout: {
        rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        seatsPerRow: [18, 18, 18, 18, 18, 18, 18]
      }
    },
    {
      id: "hall-2", 
      name: "Blockbuster Cinema",
      capacity: 98,
      features: ["Dolby Digital", "3D Ready", "Premium Seating"],
      description: "Comfortable mid-size hall perfect for intimate movie experiences",
      seatLayout: {
        rows: ['A', 'B', 'C', 'D', 'E', 'F'],
        seatsPerRow: [16, 16, 16, 16, 17, 17]
      }
    },
    {
      id: "hall-3",
      name: "Shimanto Sambhar", 
      capacity: 156,
      features: ["Dolby Atmos", "4K Laser Projection", "Premium Recliners"],
      description: "Our largest hall with the most advanced technology and maximum comfort",
      seatLayout: {
        rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        seatsPerRow: [20, 20, 20, 20, 20, 20, 20, 16]
      }
    },
    {
      id: "hall-4",
      name: "Sony Cinema Hall",
      capacity: 84,
      features: ["Dolby Digital", "2K Projection", "Standard Seating"],
      description: "Cozy hall with excellent viewing angles and comfortable seating",
      seatLayout: {
        rows: ['A', 'B', 'C', 'D', 'E', 'F'],
        seatsPerRow: [14, 14, 14, 14, 14, 14]
      }
    },
    {
      id: "hall-5",
      name: "Lions Cinema",
      capacity: 112,
      features: ["Dolby Atmos", "4K Projection", "Premium Seating", "3D Ready"],
      description: "Versatile hall supporting both 2D and 3D formats with premium audio",
      seatLayout: {
        rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        seatsPerRow: [16, 16, 16, 16, 16, 16, 16]
      }
    }
  ];

  // Generate occupied seats for all cinema halls - optimized for performance
  const occupiedSeatsMap = useMemo(() => {
    const map = {};
    
    // Generate occupied seats for each cinema hall and each show time
    cinemaHalls.forEach(hall => {
      map[hall.id] = {};
      
      // Generate for each available date and time
      Object.keys(dummyDateTimeData).forEach(date => {
        dummyDateTimeData[date].forEach((show, timeIndex) => {
          // Create a unique key using time string for more reliable lookup
          const timeString = new Date(show.time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          const uniqueKey = `${date}-${timeString}`;
          
          // Create a simple hash for consistent but fast generation
          const hash = `${hall.id}-${date}-${show.time}-${timeIndex}`;
          let seed = 0;
          for (let i = 0; i < hash.length; i++) {
            seed = ((seed << 5) - seed + hash.charCodeAt(i)) & 0xffffffff;
          }
          
          // Simple random function
          const random = (min, max) => {
            seed = (seed * 9301 + 49297) % 233280;
            return Math.floor((seed / 233280) * (max - min + 1)) + min;
          };
          
          // Generate occupied seats based on hall capacity
          const occupiedSeats = [];
          const { rows, seatsPerRow } = hall.seatLayout;
          
          // Scale occupied seats based on hall capacity - ensure minimum 10 seats
          const baseCount = Math.max(10, Math.floor(hall.capacity * 0.15)); // 15% occupancy, min 10
          const targetCount = baseCount + (seed % 8); // Add variation 0-7
          
          // Generate scattered seats
          for (let i = 0; i < targetCount; i++) {
            const randomRowIndex = random(0, rows.length - 1);
            const row = rows[randomRowIndex];
            const maxSeatsInRow = seatsPerRow[randomRowIndex];
            const randomSeatNumber = random(1, maxSeatsInRow);
            const seatId = `${row}${randomSeatNumber}`;
            
            if (!occupiedSeats.includes(seatId)) {
              occupiedSeats.push(seatId);
            }
          }
          
          // Add small clusters for realism
          const clusterCount = Math.min(4, Math.floor(targetCount * 0.25));
          for (let cluster = 0; cluster < clusterCount; cluster++) {
            const clusterRow = random(0, rows.length - 1);
            const row = rows[clusterRow];
            const maxSeatsInRow = seatsPerRow[clusterRow];
            const startSeat = random(1, Math.max(1, maxSeatsInRow - 2));
            
            for (let i = 0; i < 2; i++) {
              const seatNumber = startSeat + i;
              if (seatNumber <= maxSeatsInRow) {
                const seatId = `${row}${seatNumber}`;
                if (!occupiedSeats.includes(seatId)) {
                  occupiedSeats.push(seatId);
                }
              }
            }
          }
          
          // Store with unique key
          map[hall.id][uniqueKey] = occupiedSeats;
          
          // Debug: Log each generation for verification
          console.log(`Generated for ${hall.name} on ${date} at ${timeString}:`, occupiedSeats.length, 'seats');
        });
      });
    });
    
    // Debug: Log the generated occupied seats for verification
    console.log('Generated occupied seats map:', map);
    
    // Debug: Log all available keys for each hall
    Object.keys(map).forEach(hallId => {
      const hall = cinemaHalls.find(h => h.id === hallId);
      console.log(`Available keys for ${hall?.name || hallId}:`, Object.keys(map[hallId]));
    });
    
    // Validation: Check if we have seats for all expected combinations
    const expectedCombinations = [];
    cinemaHalls.forEach(hall => {
      Object.keys(dummyDateTimeData).forEach(date => {
        dummyDateTimeData[date].forEach(show => {
          const timeString = new Date(show.time).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          const key = `${date}-${timeString}`;
          if (!map[hall.id]?.[key]) {
            console.warn(`Missing occupied seats for ${hall.name} on ${date} at ${timeString}`);
            expectedCombinations.push(`${hall.name} - ${date} - ${timeString}`);
          }
        });
      });
    });
    
    if (expectedCombinations.length > 0) {
      console.warn('Missing combinations:', expectedCombinations);
    } else {
      console.log('All expected combinations have occupied seats!');
    }
    
    return map;
  }, []); // Empty dependency array - only generate once

  // Get occupied seats for current selection
  const occupiedSeats = useMemo(() => {
    if (!selectedCinemaHall || !selectedDate || !selectedTime) return [];
    
    // Use the same key format as generation
    const timeString = new Date(selectedTime.time).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const uniqueKey = `${selectedDate}-${timeString}`;
    const seats = occupiedSeatsMap[selectedCinemaHall.id]?.[uniqueKey] || [];
    
    // Debug: Log current occupied seats
    console.log(`Looking up occupied seats for ${selectedCinemaHall.name} on ${selectedDate} at ${timeString}:`, seats);
    console.log(`Using key: ${uniqueKey}`);
    
    // Fallback: If no seats found, generate some basic occupied seats
    if (seats.length === 0 && selectedCinemaHall) {
      console.warn(`No occupied seats found for ${selectedCinemaHall.name} on ${selectedDate} at ${timeString}, generating fallback...`);
      
      const fallbackSeats = [];
      const { rows, seatsPerRow } = selectedCinemaHall.seatLayout;
      
      // Create a hash for consistent fallback generation
      const fallbackHash = `${selectedCinemaHall.id}-${selectedDate}-${timeString}`;
      let seed = 0;
      for (let i = 0; i < fallbackHash.length; i++) {
        seed = ((seed << 5) - seed + fallbackHash.charCodeAt(i)) & 0xffffffff;
      }
      
      const random = (min, max) => {
        seed = (seed * 9301 + 49297) % 233280;
        return Math.floor((seed / 233280) * (max - min + 1)) + min;
      };
      
      // Generate 12-18 occupied seats as fallback
      const fallbackCount = 12 + (seed % 7);
      
      for (let i = 0; i < fallbackCount; i++) {
        const randomRowIndex = random(0, rows.length - 1);
        const row = rows[randomRowIndex];
        const maxSeatsInRow = seatsPerRow[randomRowIndex];
        const randomSeatNumber = random(1, maxSeatsInRow);
        const seatId = `${row}${randomSeatNumber}`;
        
        if (!fallbackSeats.includes(seatId)) {
          fallbackSeats.push(seatId);
        }
      }
      
      console.log(`Generated fallback occupied seats for ${selectedCinemaHall.name}:`, fallbackSeats);
      return fallbackSeats;
    }
    
    return seats;
  }, [occupiedSeatsMap, selectedCinemaHall?.id, selectedDate, selectedTime]);

  // Get dynamic seat layout based on selected cinema hall
  const getSeatLayout = () => {
    if (!selectedCinemaHall) {
      return { rows: [], seatsPerRow: [] };
    }
    return selectedCinemaHall.seatLayout;
  };

  const { rows: seatRows, seatsPerRow } = getSeatLayout();

  // Convert arrays to Sets for faster lookups
  const occupiedSeatsSet = useMemo(() => new Set(occupiedSeats), [occupiedSeats]);
  const selectedSeatsSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  if (!movie) return <div className="flex items-center justify-center h-screen"> <Loading /></div>;



  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 pb-20">
      <div className="max-w-7xl mx-auto">
        <BlurCircle top="-50px" left="-100px" />
        <BlurCircle bottom="-100px" right="50px"/>
        
        {/* Movie Info */}
        <div className="flex items-center gap-4 mb-8">
          <img src={movie.poster_path} alt="" className="w-20 h-28 rounded-lg object-cover"/>
          <div>
            <h1 className="text-2xl font-semibold">{movie.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
              <span>{timeFormat(movie.runtime)}</span>
              <span>•</span>
              <span>{movie.genres.map(g => g.name).join(", ")}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary"/>
                <span>{movie.vote_average.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Left Sidebar - Available Timings */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                Available Timings
              </h2>
              
              {/* Date Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3 text-gray-300">Select Date</h3>
                <div className="space-y-2">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`w-full px-4 py-3 rounded-lg border transition text-left ${
                        selectedDate === date 
                          ? 'bg-primary border-primary text-white' 
                          : 'border-gray-600 hover:border-primary text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <div>
                          <div className="text-sm font-medium">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-xs">
                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cinema Hall Selection - Only show if date is selected */}
              {selectedDate && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3 text-gray-300">Select Cinema Hall</h3>
                  <div className="space-y-2">
                    {cinemaHalls.map((hall) => (
                      <button
                        key={hall.id}
                        onClick={() => handleCinemaHallChange(hall)}
                        className={`w-full px-4 py-3 rounded-lg border transition text-left ${
                          selectedCinemaHall?.id === hall.id 
                            ? 'bg-primary border-primary text-white' 
                            : 'border-gray-600 hover:border-primary text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4" />
                          <div className="text-left">
                            <div className="text-sm font-medium">{hall.name}</div>
                            <div className="text-xs opacity-75">
                              {hall.capacity} seats
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Selection - Only show if date and cinema hall are selected */}
              {selectedDate && selectedCinemaHall && (
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-300">Select Time</h3>
                  <div className="space-y-2">
                    {dummyDateTimeData[selectedDate]?.map((show, index) => (
                      <button
                        key={show.showId}
                        onClick={() => setSelectedTime(show)}
                        className={`w-full px-4 py-3 rounded-lg border transition text-left ${
                          selectedTime?.showId === show.showId 
                            ? 'bg-primary border-primary text-white' 
                            : 'border-gray-600 hover:border-primary text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {new Date(show.time).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Seat Layout */}
          <div className="flex-1">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-2xl font-semibold mb-8 text-center">Select Your Seat</h2>
              {/* Show seat layout only when all three selections are made */}
              {selectedDate && selectedCinemaHall && selectedTime ? (
                <>
                  {/* Screen */}
                  <div className="text-center mb-12">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 h-3 w-full max-w-2xl mx-auto rounded-full mb-4 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">SCREEN SIDE</p>
                  </div>

                  {/* Seats */}
                  <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                    {seatRows.map((row, rowIndex) => {
                      const seatsInThisRow = seatsPerRow[rowIndex];
                      return (
                        <div key={row} className="flex justify-center gap-2">
                          <span className="w-12 text-center text-sm text-gray-400 font-medium">{row}</span>
                          <div className="flex gap-1">
                                                         {Array.from({ length: seatsInThisRow }, (_, index) => {
                               const seatNumber = index + 1;
                               const seatId = `${row}${seatNumber}`;
                               const isSelected = selectedSeatsSet.has(seatId);
                               const isOccupied = occupiedSeatsSet.has(seatId);
                              return (
                                <button
                                  key={seatId}
                                  onClick={() => !isOccupied && handleSeatClick(seatId)}
                                  disabled={isOccupied}
                                  className={`w-10 h-10 rounded-md text-xs font-medium transition ${
                                    isOccupied
                                      ? 'bg-red-500 text-white cursor-not-allowed'
                                      : isSelected
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                  }`}
                                >
                                  {seatNumber}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-8 mt-12 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-600 rounded"></div>
                      <span className="text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-primary rounded"></div>
                      <span className="text-gray-300">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-300">Occupied</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    {!selectedDate && "Please select a date to continue"}
                    {selectedDate && !selectedCinemaHall && "Please select a cinema hall to continue"}
                    {selectedDate && selectedCinemaHall && !selectedTime && "Please select a show time to view seats"}
                  </div>
                </div>
              )}
            </div>

            {/* Booking Summary - Only show when all selections are made */}
            {selectedDate && selectedCinemaHall && selectedTime && (
              <div className="bg-gray-800 p-6 rounded-lg mt-8">
                <h2 className="text-lg font-medium mb-4">Booking Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cinema Hall:</span>
                    <span className="text-white">{selectedCinemaHall.name}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    {selectedCinemaHall.description}
                  </div>
                  {selectedSeats.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Selected Seats:</span>
                        <span className="text-white">{selectedSeats.join(", ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Number of Seats:</span>
                        <span className="text-white">{selectedSeats.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Price per Seat:</span>
                        <span className="text-white">$12.00</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t border-gray-600 pt-2">
                        <span className="text-gray-300">Total Amount:</span>
                        <span className="text-white">${(selectedSeats.length * 12).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}


            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => navigate(`/movies/${id}`)}
                className="px-8 py-3 border border-gray-600 rounded-lg hover:border-primary transition text-gray-300"
              >
                Back to Movie
              </button>
              <button
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || !selectedDate || !selectedCinemaHall || !selectedTime}
                className="px-10 py-3 bg-primary hover:bg-primary-dull disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
              >
                <span>Confirm Booking</span>
                <ArrowRightIcon strokeWidth={3} className="w-3 h-3"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;