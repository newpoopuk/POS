import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import FoodOrderingApp from "./FoodOrderingApp";
import FoodOrderingConfirm from "./FoodOrderingConfirm";
import Summary from "./Summary";
import Dashboard from "./Dashboard";
import Report from "./Report";
import Decrease from "./Decrease";
import Decrease2 from "./Decrease2";
import Decreasesummary from "./Decreasesummary";
import ProductChanges from "./ProductChanges";
import MenuPage from "./MenuPage";  // <-- Import your menu page

// Add an AdminDashboard component (you can expand this as needed)
const AdminDashboard = ({ onLogout }) => (
  <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome, admin! This is a restricted area.</p>
    {/* Navigation link to the Menu Page */}
    <a href="/menu">Go to Menu Page</a>
  </div>
);
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer_name, setCustomerName] = useState("");
  const [key, setKey] = useState("");
  const [agentId, setAgentId] = useState("");
  const [role, setRole] = useState(""); // Add role state

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const { customer_name, key, agentId, role } = JSON.parse(storedUser);
      setIsLoggedIn(true);
      setCustomerName(customer_name);
      setKey(key);
      setAgentId(agentId);
      setRole(role);
    }
  }, []);

  const handleLogin = (customer_name, key, agentId, role) => {
    setIsLoggedIn(true);
    setCustomerName(customer_name);
    setKey(key);
    setAgentId(agentId);
    setRole(role);
    localStorage.setItem(
      "user",
      JSON.stringify({ customer_name, key, agentId, role })
    );
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomerName("");
    setKey("");
    setAgentId("");
    setRole("");
    localStorage.removeItem("user");
  };

  return (
    <Router>
      <Routes>
        {!isLoggedIn ? (
          <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
        ) : (
          <>
            <Route
              path="/"
              element={
                role === "admin" ? (
                  <Navigate to="/admin" />
                ) : (
                  <FoodOrderingApp
                    customer_name={customer_name}
                    key={key}
                    agentId={agentId}
                    onLogout={handleLogout}
                  />
                )
              }
            />
            <Route
              path="/food-ordering-app"
              element={
                <FoodOrderingApp
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/food-ordering-confirm"
              element={
                <FoodOrderingConfirm
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/summary"
              element={
                <Summary
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/report"
              element={
                <Report
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/decrease"
              element={
                <Decrease
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/decrease2"
              element={
                <Decrease2
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/decreasesummary"
              element={
                <Decreasesummary
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            <Route
              path="/productchanges"
              element={
                <ProductChanges
                  customer_name={customer_name}
                  key={key}
                  agentId={agentId}
                  onLogout={handleLogout}
                />
              }
            />
            {/* Menu route */}
            <Route
              path="/menu"
              element={<MenuPage />}
            />
            {/* Admin route */}
            <Route
              path="/admin"
              element={
                role === "admin" ? (
                  <AdminDashboard onLogout={handleLogout} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            {/* Menu route */}
            <Route
              path="/menu"
              element={<MenuPage />}
            />
          </>
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;