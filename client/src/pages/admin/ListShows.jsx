import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Edit, Trash2, Eye, Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import { fetchAllShows, deleteShow, updateShow } from "../../lib/api/admin";
import toast from 'react-hot-toast';

const ListShows = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingShow, setEditingShow] = useState(null);
  const [editForm, setEditForm] = useState({
    price: "",
    status: "active"
  });

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAllShows();
      setShows(data);
    } catch (err) {
      console.error('Error loading shows:', err);
      setError("Failed to load shows");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show?")) return;
    
    try {
      await deleteShow(showId);
      toast.success("Show deleted successfully");
      loadShows(); // Reload the list
    } catch (error) {
      console.error('Error deleting show:', error);
      toast.error("Failed to delete show");
    }
  };

  const handleEditShow = (show) => {
    setEditingShow(show);
    setEditForm({
      price: show.price.toString(),
      status: show.status
    });
  };

  const handleUpdateShow = async () => {
    if (!editingShow) return;
    
    try {
      await updateShow(editingShow.id, {
        price: parseFloat(editForm.price),
        status: editForm.status
      });
      
      toast.success("Show updated successfully");
      setEditingShow(null);
      setEditForm({ price: "", status: "active" });
      loadShows(); // Reload the list
    } catch (error) {
      console.error('Error updating show:', error);
      toast.error("Failed to update show");
    }
  };

  const cancelEdit = () => {
    setEditingShow(null);
    setEditForm({ price: "", status: "active" });
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading shows...</div>
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
            List <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">Shows</span>
          </h1>
        </div>

        {/* Shows Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-500 to-red-500">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Movie</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Date & Time</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Hall</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Price</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.length > 0 ? (
                  shows.map((show, index) => {
                    const { date, time } = formatDateTime(show.show_datetime);
                    return (
                      <tr 
                        key={show.id} 
                        className={`border-b border-gray-700 ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={show.poster_path} 
                              alt={show.movie_title}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div>
                              <div className="text-white font-medium">{show.movie_title}</div>
                              <div className="text-gray-400 text-sm">{show.runtime} min</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{show.hall_name}</span>
                          </div>
                          <div className="text-gray-400 text-sm mt-1">
                            {show.hall_capacity} seats
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="font-semibold">${show.price}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            show.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {show.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditShow(show)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                              title="Edit Show"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteShow(show.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Delete Show"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      No shows found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editingShow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Edit Show</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Movie</label>
                  <div className="text-gray-300">{editingShow.movie_title}</div>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Date & Time</label>
                  <div className="text-gray-300">
                    {formatDateTime(editingShow.show_datetime).date} at {formatDateTime(editingShow.show_datetime).time}
                  </div>
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Price</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-pink-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateShow}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded hover:opacity-90 transition-opacity"
                >
                  Update Show
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ListShows; 