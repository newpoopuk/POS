import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Decrease2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quantities, customer_name, agentId } = location.state || {};

  const [foods, setFoods] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch foods and prices data from the backend
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await axios.get("http://localhost:8000/commodities/");
        setFoods(response.data);
      } catch (error) {
        console.error("Error fetching food data", error);
      }
    };

    const fetchPrices = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/price_configlist/?agent_id=${agentId}`);
        setPrices(response.data[agentId] || {});
      } catch (error) {
        console.error("Error fetching price data", error);
      }
    };

    Promise.all([fetchFoods(), fetchPrices()]).then(() => setLoading(false));
  }, [agentId]);

  // Calculate total price
  const totalPrice = foods.reduce((total, food) => {
    const quantity = quantities[food.ref] || 0;
    const price = prices[food.ref] || 0;
    return total + quantity * price;
  }, 0);

  const handleConfirm = async () => {
    const dataLake = Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ref, quantity]) => [`prod${ref}`, -quantity]);

    const payload = {
      agent: customer_name,
      data_lake: dataLake,
    };

    try {
      const response = await axios.post("http://localhost:8000/kitkats/", payload);

      if (response.status === 200) {
        console.log("KitKat created successfully:", response.data);

        navigate("/summary", {
          state: {
            foods,
            quantities,
            prices,
            customer_name,
            createdDate: response.data.Createddate,
            createdTime: response.data.Createdtime,
          },
        });
      } else {
        console.error("Failed to create KitKat:", response.statusText);
        alert("Failed to confirm the order. Please try again.");
      }
    } catch (error) {
      console.error("Error creating KitKat:", error);
      alert("An error occurred while confirming the order.");
    }
  };

  const nonZeroFoods = foods.filter((food) => quantities[food.ref] > 0);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h2 className="text-center mt-4">Decrease2</h2>
      <div className="row">
        {nonZeroFoods.length > 0 ? (
          nonZeroFoods.map((food) => (
            <div className="col-md-4 mb-4" key={food.ref}>
              <div className="card h-100 text-center">
                <img src={food.image} alt={food.name} className="card-img-top" />
                <div className="card-body">
                  <h5 className="card-title">{food.name}</h5>
                  <p>Quantity: {quantities[food.ref]}</p>
                  <p>Price per item: {prices[food.ref] || "N/A"} ฿</p>
                  <p>Total: {(quantities[food.ref] || 0) * (prices[food.ref] || 0)} ฿</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No food items selected.</p>
        )}
      </div>

      {/* Total Price Display */}
      <div className="text-center mt-4">
        <h4>Total Price: {totalPrice} ฿</h4>
      </div>

      {/* Confirm button */}
      <div className="fixed-bottom d-flex justify-content-end p-3">
        <button onClick={handleConfirm} className="btn btn-success">
          Confirm
        </button>
      </div>
    </div>
  );
};

export default Decrease2;
