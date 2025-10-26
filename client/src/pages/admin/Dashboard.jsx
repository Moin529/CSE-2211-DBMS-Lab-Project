import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { 
  BarChart3, 
  DollarSign, 
  Play, 
  Users,
  Star,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { fetchDashboardStats, fetchActiveMoviesForDashboard } from "../../lib/api/admin";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeMovies: 0,
    totalUsers: 0,
    analytics: []
  });
  const [activeMovies, setActiveMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Load stats and movies in parallel
        const [statsData, moviesData] = await Promise.all([
          fetchDashboardStats(),
          fetchActiveMoviesForDashboard(4)
        ]);
        
        setStats(statsData);
        setActiveMovies(moviesData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate revenue trend
  const getRevenueTrend = () => {
    if (stats.analytics.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const recent = stats.analytics[0]?.total_revenue || 0;
    const previous = stats.analytics[1]?.total_revenue || 0;
    
    if (previous === 0) return { trend: 'neutral', percentage: 0 };
    
    const percentage = ((recent - previous) / previous) * 100;
    return {
      trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
      percentage: Math.abs(percentage).toFixed(1)
    };
  };

  const revenueTrend = getRevenueTrend();

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings.toLocaleString(),
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500",
      trend: null
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      trend: revenueTrend
    },
    {
      title: "Active Movies",
      value: stats.activeMovies,
      icon: Play,
      color: "from-purple-500 to-pink-500",
      trend: null
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "from-orange-500 to-red-500",
      trend: null
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading dashboard...</div>
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
            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">Dashboard</span>
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{card.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                    {card.trend && (
                      <div className="flex items-center gap-1 mt-2">
                        {card.trend.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : card.trend.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : null}
                        {card.trend.trend !== 'neutral' && (
                          <span className={`text-sm ${
                            card.trend.trend === 'up' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {card.trend.percentage}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Movies Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6">Active Movies</h2>
          {activeMovies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeMovies.map((movie) => (
                <div key={movie._id} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div className="relative">
                    <img 
                      src={movie.poster_path} 
                      alt={movie.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white text-sm">{movie.vote_average?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-2">{movie.title}</h3>
                    <p className="text-gray-400 text-xs mb-2">{movie.genres?.map(g => g.name).join(', ')}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-semibold">Active</span>
                      <span className="text-gray-400 text-xs">{movie.release_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No active movies found</p>
            </div>
          )}
        </div>

        {/* Recent Analytics */}
        {stats.analytics.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Revenue Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {stats.analytics.slice(0, 7).map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm text-gray-400 mb-1">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    ${day.total_revenue?.toFixed(0) || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.total_bookings || 0} bookings
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard; 