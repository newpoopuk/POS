import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import axios from "axios";

const FoodOrderingApp = ({ customer_name, agentId }) => {
  const [foods, setFoods] = useState([]);
  const [prices, setPrices] = useState({});
  const [quantities, setQuantities] = useState({});
  const [menuVisible, setMenuVisible] = useState(true); // For toggling the menu visibility

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const commodityResponse = await axios.get("http://localhost:8000/commodities/");
        setFoods(commodityResponse.data);

        // Initialize quantities with zeros
        const initialQuantities = commodityResponse.data.reduce((acc, food) => {
          acc[food.ref] = 0;
          return acc;
        }, {});
        setQuantities(initialQuantities);
      } catch (error) {
        console.error("Error fetching commodities", error);
      }
    };

    const fetchPrices = async () => {
      try {
        const priceResponse = await axios.get(`http://localhost:8000/price_configlist/?agent_id=${agentId}`);
        setPrices(priceResponse.data[agentId] || {});
      } catch (error) {
        console.error("Error fetching prices", error);
      }
    };

    if (agentId) {
      fetchPrices();
    }
    fetchCommodities();
  }, [agentId]);

  const incrementQuantity = (ref) => {
    setQuantities((prev) => ({ ...prev, [ref]: prev[ref] + 1 }));
  };

  const decrementQuantity = (ref) => {
    setQuantities((prev) => ({
      ...prev,
      [ref]: Math.max(prev[ref] - 1, 0),
    }));
  };

  return (
    <div className="d-flex">
      {/* Menu bar: Always on the left, can be collapsed with a toggle button */}
      <div
        className={`bg-light border p-3 ${
          menuVisible ? "d-block" : "d-none"
        }`}
        style={{
          width: "250px",
          height: "100vh",
          transition: "all 0.3s ease",
          position: "relative", // Ensure it stays on top when toggling
        }}
      >
        <h4>Menu</h4>
        <ul className="list-unstyled">
          <li><a href="#" className="text-decoration-none">Order</a></li>
          <li><Link to="/Dashboard" className="text-decoration-none">Dashboard</Link></li>
          <li><Link to="/Report" className="text-decoration-none">Report</Link></li>
          <li><Link to="/Decrease2" className="text-decoration-none">Decrease2</Link></li>
        </ul>
      </div>

      <div className="container-fluid p-4">
        {/* Content area */}
        <h2 className="text-center mb-4">Welcome, {customer_name || "Guest"}!</h2>

        {/* Display the agentId */}
        <div className="text-center mb-4">
          <p><strong>Agent ID:</strong> {agentId}</p>
        </div>

        {/* Food items grid: Two items per row on larger screens */}
        <div className="row">
          {foods.length > 0 ? (
            foods.map((food) => {
              const price = prices[food.ref-1];
              if (price === 0) {
                // If the price is 0, don't render this item
                return null;
              }
              return (
                <div className="col-6 col-md-4 mb-4" key={food.ref}>
                  <div className="card h-100 text-center">
                    <img src={food.image} alt={food.name} className="card-img-top" />
                    <div className="card-body">
                      <h5 className="card-title">{food.name}</h5>
                      <p className="text-muted">
                        Price: {price ? `${price} ฿` : "Loading..."}
                      </p>
                    </div>

                    {/* Add margin-top to card-footer */}
                    <div className="card-footer" style={{ marginTop: '-20px' }}>
                      <div className="d-flex justify-content-center align-items-center">
                        <button className="btn btn-danger btn-sm" onClick={() => decrementQuantity(food.ref)}>-</button>
                        <span className="mx-3">{quantities[food.ref]}</span>
                        <button className="btn btn-success btn-sm" onClick={() => incrementQuantity(food.ref)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>Loading commodities...</p>
          )}
        </div>

        {/* Navigation buttons moved to the main area */}
        <div className="text-center mt-4">
          <Link to="/food-ordering-confirm" state={{ quantities, customer_name, agentId }} className="btn btn-primary">
            Next
          </Link>
        </div>
      </div>

      {/* Toggle Button for Menu Visibility */}
      <button
        className="btn btn-link position-fixed bottom-0 start-0 mb-3 ms-3"
        onClick={() => setMenuVisible((prev) => !prev)}
        style={{
          fontSize: "30px",
          backgroundColor: "transparent",
          border: "none",
          color: "#000",
        }}
      >
        {menuVisible ? "<" : ">"}
      </button>
    </div>
  );
};

export default FoodOrderingApp;