import React from 'react';
import { Button } from 'react-bootstrap';

const AdminDashboard = ({ onLogout }) => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, admin! This is a restricted area.</p>
      <Button variant="danger" onClick={onLogout}>
        Logout
      </Button>
      {/* Add admin-specific features here */}
    </div>
  );
};

export default AdminDashboard;