import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Plus, 
  List, 
  BookOpen,
  User,
  Home
} from "lucide-react";
import { supabase } from "../lib/supabase";

const AdminSidebar = () => {
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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

  const menuItems = [
    {
      path: "/",
      name: "Home",
      icon: Home
    },
    {
      path: "/admin",
      name: "Dashboard",
      icon: LayoutDashboard
    },
    {
      path: "/admin/add-shows",
      name: "Add Shows",
      icon: Plus
    },
    {
      path: "/admin/list-shows",
      name: "List Shows",
      icon: List
    },
    {
      path: "/admin/list-bookings",
      name: "List Bookings",
      icon: BookOpen
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 pt-20">
      {/* User Profile Section */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
            ) : (
              <>
                <p className="text-white font-medium">
                  {adminUser?.display_name || adminUser?.user_metadata?.full_name || 'Admin User'}
                </p>
                <p className="text-gray-400 text-sm">Admin User</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 text-white transition-colors ${
                isActive 
                  ? "bg-gradient-to-r from-pink-500 to-red-500 border-r-2 border-pink-500" 
                  : "hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar; 