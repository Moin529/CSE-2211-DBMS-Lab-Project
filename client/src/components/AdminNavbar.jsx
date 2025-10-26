import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { supabase } from "../lib/supabase";
import { LogOut, User } from "lucide-react";
import toast from 'react-hot-toast';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);

  const getAdminUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setAdminUser(data);
        } else {
          // Fallback to auth user metadata
          setAdminUser({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email,
            is_admin: true
          });
        }
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  useEffect(() => {
    getAdminUser();

    // Listen for auth state changes to refresh user data
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
          await getAdminUser();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-black/90 backdrop-blur">
      <Link to="/admin" className="flex items-center gap-6">
        <img src={assets.logo} alt="CineVerse Logo" className="w-36 h-auto" />
        <span className="text-white text-sm font-medium">Admin Panel</span>
      </Link>
      
      <div className="flex items-center gap-4">
        {adminUser && (
          <div className="flex items-center gap-3 text-white">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm">
                {adminUser.display_name || adminUser.user_metadata?.full_name || 'Admin User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNavbar; 