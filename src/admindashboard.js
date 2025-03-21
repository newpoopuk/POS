import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard = ({ onLogout }) => (
  <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome, admin! This is a restricted area.</p>
    <Link to="/menu">
      <button>Go to Menu Page</button>
    </Link>
  </div>
);

export default AdminDashboard;