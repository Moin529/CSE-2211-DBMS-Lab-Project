import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Movie poster slide animation state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const navigate = useNavigate();

  // Movie poster data for slide animation
  const moviePosters = [
    {
      id: 1,
      title: "Superman",
      year: "2025",
      genre: "Action | Adventure",
      duration: "2h 25m",
      poster: "/assets/poster1.jpg"
    },
    {
      id: 2,
      title: "Avatar: The Way of Water",
      year: "2022",
      genre: "Sci-Fi | Adventure",
      duration: "3h 12m",
      poster: "/assets/poster2.jpg"
    },
    {
      id: 3,
      title: "The Matrix",
      year: "1999",
      genre: "Sci-Fi | Action",
      duration: "2h 16m",
      poster: "/assets/poster3.jpg"
    }
  ];

  // Debug: Log the poster URLs
  console.log('Poster URLs:', moviePosters.map(m => m.poster));
  console.log('Full URLs:', moviePosters.map(m => window.location.origin + m.poster));

  // Auto-advance slide animation
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % moviePosters.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isOpen, moviePosters.length]);

  // Handle manual slide navigation
  const goToSlide = (slideIndex) => {
    if (isAnimating || slideIndex === currentSlide) return;
    
    setIsAnimating(true);
    setCurrentSlide(slideIndex);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const toggleLoginSignup = () => {
    setIsLogin(!isLogin);
    setFormData({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '' });
    setMessage('');
    setAgreedToTerms(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      onClose();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        onClose();
      } else {
        // Signup
        if (!agreedToTerms) {
          setMessage('Please agree to the Terms & Conditions');
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone_number: formData.phoneNumber,
              full_name: `${formData.firstName} ${formData.lastName}`.trim()
            }
          }
        });
        
        if (error) throw error;
        
        // Since email verification is disabled, show success message
        setMessage('Account created successfully! You can now log in.');
        // Clear form for login
        setFormData({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '' });
        setIsLogin(true);
        setAgreedToTerms(false);
        return;
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Blurred Movie Poster Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Movie Poster 1 */}
        <div className="absolute top-10 left-10 w-48 h-72 bg-gradient-to-br from-red-500/20 to-purple-600/20 rounded-lg blur-sm transform rotate-12 scale-110"></div>
        
        {/* Movie Poster 2 */}
        <div className="absolute top-20 right-20 w-40 h-60 bg-gradient-to-br from-blue-500/20 to-green-600/20 rounded-lg blur-sm transform -rotate-6 scale-90"></div>
        
        {/* Movie Poster 3 */}
        <div className="absolute bottom-20 left-1/4 w-44 h-68 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-lg blur-sm transform rotate-3 scale-105"></div>
        
        {/* Movie Poster 4 */}
        <div className="absolute bottom-32 right-1/3 w-36 h-56 bg-gradient-to-br from-pink-500/20 to-red-600/20 rounded-lg blur-sm transform -rotate-12 scale-95"></div>
        
        {/* Movie Poster 5 */}
        <div className="absolute top-1/2 left-1/2 w-52 h-76 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-lg blur-sm transform rotate-8 scale-100"></div>
        
        {/* Movie Poster 6 */}
        <div className="absolute top-1/3 right-1/4 w-38 h-58 bg-gradient-to-br from-green-500/20 to-teal-600/20 rounded-lg blur-sm transform -rotate-3 scale-110"></div>
      </div>

      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] flex overflow-hidden relative">
        {/* Close Button - Top Right of Entire Modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-50"
        >
          ×
        </button>

        {/* Left Column - Movie Poster Slide Animation */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Movie Poster Slides Container */}
          <div className="relative w-full h-full">
            {moviePosters.map((movie, index) => (
              <div
                key={movie.id}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  index === currentSlide 
                    ? 'opacity-100 translate-x-0 z-20' 
                    : index < currentSlide 
                      ? 'opacity-0 -translate-x-full z-10' 
                      : 'opacity-0 translate-x-full z-10'
                }`}
              >
                {/* Movie Poster Image */}
                <img 
                  src={movie.poster} 
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('✅ Image loaded successfully:', movie.title, movie.poster)}
                  onError={(e) => {
                    console.error('❌ Failed to load image:', movie.title, movie.poster);
                    console.error('Full URL:', window.location.origin + movie.poster);
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Progress Indicators - Bottom Right */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-30">
            {moviePosters.map((_, slideIndex) => (
              <button
                key={slideIndex}
                onClick={() => goToSlide(slideIndex)}
                className={`w-8 h-1 rounded transition-all duration-300 ${
                  slideIndex === currentSlide 
                    ? 'bg-white' 
                    : 'bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-1/2 bg-gray-900 p-6 lg:p-8 flex flex-col justify-center">
          <div className="max-w-sm lg:max-w-md mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-6 lg:mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-sm lg:text-base text-gray-400">
                {isLogin ? 'Sign in to your account' : 'Join us and start your journey'}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-primary text-white py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg hover:bg-primary-dull transition-all flex items-center justify-center gap-2 font-medium text-sm lg:text-base shadow-lg hover:shadow-xl"
              >
                <div className="w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">or use your email account</span>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('successfully') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-3 lg:space-y-4">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 lg:py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 text-sm lg:text-base"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 lg:py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 text-sm lg:text-base"
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Phone number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 lg:py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 text-sm lg:text-base"
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 lg:py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 text-sm lg:text-base"
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 lg:py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 pr-12 text-sm lg:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              </div>

              {!isLogin && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300">
                    I agree to the{' '}
                    <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                      Terms & Conditions
                    </a>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!isLogin && !agreedToTerms)}
                className="w-full bg-purple-600 text-white py-2.5 lg:py-3 px-4 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm lg:text-base"
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create account')}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm lg:text-base">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={toggleLoginSignup}
                  className="text-purple-400 hover:text-purple-300 underline font-medium"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
