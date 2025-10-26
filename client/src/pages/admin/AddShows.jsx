import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Star, Check, Plus, X } from "lucide-react";
import { fetchAllMovies, fetchCinemaHalls, createShow } from "../../lib/api/admin";
import toast from 'react-hot-toast';

const AddShows = () => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedCinemaHall, setSelectedCinemaHall] = useState(null);
  const [price, setPrice] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [availableMovies, setAvailableMovies] = useState([]);
  const [cinemaHalls, setCinemaHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [moviesData, hallsData] = await Promise.all([
          fetchAllMovies(),
          fetchCinemaHalls()
        ]);
        
        setAvailableMovies(moviesData);
        setCinemaHalls(hallsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError("Failed to load movies and cinema halls");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCinemaHallSelect = (hall) => {
    setSelectedCinemaHall(hall);
  };

  const handleAddDate = () => {
    const newDate = document.getElementById('dateInput').value;
    if (newDate && !selectedDates.includes(newDate)) {
      setSelectedDates([...selectedDates, newDate]);
      document.getElementById('dateInput').value = '';
    }
  };

  const handleAddTime = () => {
    const newTime = document.getElementById('timeInput').value;
    if (newTime && !selectedTimes.includes(newTime)) {
      setSelectedTimes([...selectedTimes, newTime]);
      document.getElementById('timeInput').value = '';
    }
  };

  const removeDate = (dateToRemove) => {
    setSelectedDates(selectedDates.filter(date => date !== dateToRemove));
  };

  const removeTime = (timeToRemove) => {
    setSelectedTimes(selectedTimes.filter(time => time !== timeToRemove));
  };

  const handleSubmit = async () => {
    if (!selectedMovie || !selectedCinemaHall || !price || selectedDates.length === 0 || selectedTimes.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create shows for each date and time combination
      const showsToCreate = [];
      
      for (const date of selectedDates) {
        for (const time of selectedTimes) {
          const showDateTime = new Date(`${date}T${time}`);
          
          showsToCreate.push({
            movie_id: selectedMovie._id,
            cinema_hall_id: selectedCinemaHall.id,
            show_date: date,
            show_time: time,
            show_datetime: showDateTime.toISOString(),
            price: parseFloat(price),
            status: 'active'
          });
        }
      }
      
      // Create all shows
      const createdShows = [];
      for (const showData of showsToCreate) {
        const createdShow = await createShow(showData);
        createdShows.push(createdShow);
      }
      
      toast.success(`Successfully created ${createdShows.length} shows!`);
      
      // Reset form
      setSelectedMovie(null);
      setSelectedCinemaHall(null);
      setPrice("");
      setSelectedDates([]);
      setSelectedTimes([]);
      
    } catch (error) {
      console.error('Error creating shows:', error);
      toast.error("Failed to create shows. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Add <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">Shows</span>
          </h1>
        </div>

        {/* Available Movies Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Available Movies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableMovies.map((movie) => (
              <div 
                key={movie._id} 
                className={`relative cursor-pointer transition-all ${
                  selectedMovie?._id === movie._id ? 'ring-2 ring-pink-500' : ''
                }`}
                onClick={() => handleMovieSelect(movie)}
              >
                <div className="relative">
                  <img 
                    src={movie.poster_path} 
                    alt={movie.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                    {selectedMovie?._id === movie._id && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white text-sm">{movie.vote_average?.toFixed(1)}/10</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{movie.title}</h3>
                  <p className="text-gray-400 text-xs">{movie.genres?.map(g => g.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cinema Halls Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Select Cinema Hall</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cinemaHalls.map((hall) => (
              <div 
                key={hall.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedCinemaHall?.id === hall.id 
                    ? 'border-pink-500 bg-pink-500/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => handleCinemaHallSelect(hall)}
              >
                <h3 className="text-white font-semibold mb-2">{hall.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{hall.capacity} seats</p>
                <p className="text-gray-500 text-xs">{hall.description}</p>
                {selectedCinemaHall?.id === hall.id && (
                  <div className="mt-2 text-pink-400 text-sm">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Show Details Form */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Show Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Input */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Price per Seat</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-pink-500"
                placeholder="Enter price"
                min="0"
                step="0.01"
              />
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Choose Dates</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  id="dateInput"
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={handleAddDate}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {selectedDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDates.map((date, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center gap-2"
                    >
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <button
                        onClick={() => removeDate(date)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Choose Times</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  id="timeInput"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={handleAddTime}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {selectedTimes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTimes.map((time, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center gap-2"
                    >
                      {time}
                      <button
                        onClick={() => removeTime(time)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedMovie && selectedCinemaHall && selectedDates.length > 0 && selectedTimes.length > 0 && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Show Summary</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p><span className="text-gray-400">Movie:</span> {selectedMovie.title}</p>
                <p><span className="text-gray-400">Hall:</span> {selectedCinemaHall.name}</p>
                <p><span className="text-gray-400">Price:</span> ${price}</p>
                <p><span className="text-gray-400">Total Shows:</span> {selectedDates.length * selectedTimes.length}</p>
                <p><span className="text-gray-400">Dates:</span> {selectedDates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')}</p>
                <p><span className="text-gray-400">Times:</span> {selectedTimes.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedMovie || !selectedCinemaHall || !price || selectedDates.length === 0 || selectedTimes.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Shows...' : 'Add Shows'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddShows; 