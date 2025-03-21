import React from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleGoToMenu = () => {
    console.log("Navigating to /menu"); // Debugging log
    navigate("/menu");
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, admin! This is a restricted area.</p>
      <button onClick={handleGoToMenu}>Go to Menu Page</button>
    </div>
  );
};

export default AdminDashboard;