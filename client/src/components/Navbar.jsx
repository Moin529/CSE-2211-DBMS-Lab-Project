import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, XIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setDisplayName(session.user.user_metadata?.full_name || "");
        setEmail(session.user.email || "");
        // Load phone number from user metadata first, then fallback to localStorage
        const phoneFromMetadata = session.user.user_metadata?.phone_number || "";
        const savedPhone = localStorage.getItem(`phoneNumber_${session.user.id}`);
        setPhoneNumber(phoneFromMetadata || savedPhone || "");
        
        // Check if user is admin
        await checkAdminStatus(session.user.id);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setDisplayName(session.user.user_metadata?.full_name || "");
          setEmail(session.user.email || "");
          // Load phone number from user metadata first, then fallback to localStorage
          const phoneFromMetadata = session.user.user_metadata?.phone_number || "";
          const savedPhone = localStorage.getItem(`phoneNumber_${session.user.id}`);
          setPhoneNumber(phoneFromMetadata || savedPhone || "");
          
          // Check if user is admin
          await checkAdminStatus(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setDisplayName("");
          setEmail("");
          setPhoneNumber("");
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      } else {
        // Fallback to auth metadata
        const { data: { user } } = await supabase.auth.getUser();
        setIsAdmin(user?.user_metadata?.is_admin || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (!supabase) return;
      await supabase.auth.signOut();
      setDropdownOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!supabase || !user) return;
      
      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: displayName,
          phone_number: phoneNumber
        }
      });
      
      if (authError) throw authError;
      
      // Also update the users table in the database
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          display_name: displayName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (dbError) {
        console.warn('Could not update users table:', dbError);
        // This might fail due to RLS policies, but that's okay
      }
      
      // Save phone to localStorage as backup
      localStorage.setItem(`phoneNumber_${user.id}`, phoneNumber);
      
      // Update local state
      setUser(prev => prev ? { 
        ...prev, 
        user_metadata: { 
          ...prev.user_metadata, 
          full_name: displayName,
          phone_number: phoneNumber
        } 
      } : null);
      setShowProfileModal(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="CineVerse Logo" className="w-36 h-auto" />
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 z-50 flex flex-col md:flex-row items-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-grey-300/20 overflow-hidden transition-[width] duration-300 ${isOpen ? "max-md:w-full" : "max-md:w-0"}`}>
        <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false); }} to="/">Home</Link>
        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false); }} to="/movies">Movies</Link>
        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false); }} to="/theaters">Theaters</Link>
        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false); }} to="/releases">Releases</Link>
        <Link onClick={() => { scrollTo(0, 0); setIsOpen(false); }} to="/favorite">Favorites</Link>
      </div>

      <div className="relative flex items-center gap-8">
        {!user ? (
          <>
            <button onClick={() => setShowAuthModal(true)} className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer">Login</button>
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
          </>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <img src={user.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=User"} alt="profile" className="w-9 h-9 rounded-full cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)} />
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-60 bg-white shadow-xl rounded-xl overflow-hidden z-50 text-black">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold truncate">{user.user_metadata?.full_name || "User"}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
                <ul className="text-sm">
                  <li>
                    <button onClick={() => { setDropdownOpen(false); setShowProfileModal(true); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">Edit Profile</button>
                  </li>
                  <li>
                    <button onClick={() => { setDropdownOpen(false); navigate("/my-bookings"); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">My Bookings</button>
                  </li>
                  {isAdmin && (
                    <li>
                      <button 
                        onClick={() => { 
                          setDropdownOpen(false); 
                          navigate("/admin"); 
                        }} 
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer text-blue-600 font-medium"
                      >
                        Admin Panel
                      </button>
                    </li>
                  )}
                  <li>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer">Sign out</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
        <MenuIcon className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
      </div>

      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">U</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Profile Details</h2>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ×
                </button>
              </div>

              {/* Profile Information */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2 text-white">Account Information</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><span className="text-gray-400">Provider:</span> {user.user_metadata?.provider === "google" ? "Google" : "Email"}</p>
                  <p><span className="text-gray-400">Account:</span> {user.email}</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your display name"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-primary hover:bg-primary-dull text-white py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">✓</span>
                  </div>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
