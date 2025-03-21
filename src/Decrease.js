import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom"; // Import Link for navigation
import axios from "axios"; // Import axios for making API requests


const Decrease = ({ customer_name, agentId }) => { // Receive customer_name and key as props
  // Default foods array
  const [foods, setFoods] = useState([]);
  const [quantities, setQuantities] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0
  });

  useEffect(() => {
    // Fetch the commodities data from the backend
    const fetchCommodities = async () => {
      try {
        const response = await axios.get("http://localhost:8000/commodities/");
        // Update the foods array with the fetched data
        setFoods(response.data.map(commodity => ({
          ref: commodity.ref, // Use ref for the unique identifier
          name: commodity.name,
          image: commodity.image
        })));
      } catch (error) {
        console.error("Error fetching commodities", error);
      }
    };

    fetchCommodities();
  }, []);

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
      <div className="bg-light border p-3" style={{ width: "200px", height: "100vh" }}>
        <h4>Menu</h4>
        <ul className="list-unstyled">
          <li>
            <a href="#" className="text-decoration-none">Order</a>
          </li>
        </ul>
      </div>
      <div className="container-fluid p-4">
        {/* Display customer_name */}
        <h2 className="text-center mb-4">Welcome, {customer_name || "Guest"}!</h2>

        {/* Display food items (commodities) and their quantity controls */}
        <div className="row">
          {foods.length > 0 ? (
            foods.map((food) => (
              <div className="col-md-4 mb-4" key={food.ref}> {/* Use ref instead of id */}
                <div className="card h-100 text-center">
                  <img src={food.image} alt={food.name} className="card-img-top" />
                  <div className="card-body">
                    <h5 className="card-title">{food.name}</h5>
                  </div>
                  <div className="card-footer">
                    <div className="d-flex justify-content-center align-items-center">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => decrementQuantity(food.ref)} // Use ref for quantity updates
                      >
                        -
                      </button>
                      <span className="mx-3">{quantities[food.ref]}</span> {/* Use ref for quantity */}
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => incrementQuantity(food.ref)} // Use ref for quantity updates
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Loading commodities...</p>
          )}
        </div>

        {/* Button to pass quantities data to FoodOrderingConfirm */}
        <div className="text-center mt-4">
          <Link
            to="/Decrease2"
            state={{ quantities, customer_name, agentId }}  // Pass quantities, customer_name, and key to the next page
            className="btn btn-primary"
          >
            Decrease2
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Decrease;
