import React from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />
      <AdminSidebar />
      <div className="ml-64 pt-20">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 