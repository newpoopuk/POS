import React from "react";
import { Link } from "react-router-dom";

const MenuPage = () => {
  return (
    <div>
      <h1>Menu Page</h1>
      <p>This is your website's menu.</p>
      {/* Link to go back to the main app page */}
      <Link to="/food-ordering-app">
        <button>Go to App Page</button>
      </Link>
    </div>
  );
};

export default MenuPage;