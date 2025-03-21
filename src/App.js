import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // React Router for navigation
import LoginPage from "./LoginPage"; // Import LoginPage
import FoodOrderingApp from "./FoodOrderingApp"; // Import FoodOrderingApp
import FoodOrderingConfirm from "./FoodOrderingConfirm"; // Confirm page component
import Summary from "./Summary"; // Import Summary component
import Dashboard from "./Dashboard";
import Report from "./Report"
import Decrease from "./Decrease"
import Decrease2 from "./Decrease2"
import Decreasesummary from "./Decreasesummary"
import ProductChanges from "./ProductChanges"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer_name, setCustomerName] = useState(""); // Store customer_name
  const [key, setKey] = useState(""); // Store key
  const [agentId, setAgentId] = useState(""); // Store agentId

  // onLogin function to set customer_name and key after successful login
  // not sure what this mean
  const handleLogin = (customer_name, key, agentId) => {
    setIsLoggedIn(true);
    setCustomerName(customer_name);
    setKey(key);
    setAgentId(agentId);
  };

  return (
    <Router>
      <Routes>
        {/* Show LoginPage if not logged in */}
        {!isLoggedIn ? (
          <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
        ) : (
          <>
            {/* Once logged in, show FoodOrderingApp */}
            <Route path="/" element={<FoodOrderingApp customer_name={customer_name} key={key} agentId={agentId}/>} />
            <Route path="/food-ordering-app" element={<FoodOrderingApp />} />
            <Route path="/food-ordering-confirm" element={<FoodOrderingConfirm />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Report" element={<Report />} />
            <Route path="/Decrease" element={<Decrease />} />
            <Route path="/Decrease2" element={<Decrease2 />} />
            <Route path="/Decreasesummary" element={<Decreasesummary />} />
            <Route path="/ProductChanges" element={<ProductChanges />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
// check if login or not,
