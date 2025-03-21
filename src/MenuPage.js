import React from "react";
import { Link } from "react-router-dom";

const MenuPage = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Menu Page</h1>
      <p>This is your website's menu.</p>
      {/* Link to go back to a main app page (adjust this path as preferred) */}
      <Link to="/food-ordering-app">
        <button style={{ padding: "10px 20px" }}>Go to App Page</button>
      </Link>
    </div>
  );
};

export default MenuPage;