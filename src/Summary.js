import React from "react";
import { useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import { FaDownload } from "react-icons/fa"; // Add this for download icon

const Summary = () => {
  const location = useLocation();
  const { foods, quantities, prices, customer_name, createdDate, createdTime } = location.state || {};

  // Filter out items with quantity 0 or price 0
  const selectedFoods = foods.filter(food => (quantities[food.ref] || 0) > 0 && (prices[food.ref] || 0) > 0);

  // Calculate total price
  const totalPrice = selectedFoods.reduce((total, food) => {
    const quantity = quantities[food.ref] || 0;
    const price = prices[food.ref-1] || 0;
    return total + quantity * price;
  }, 0);

  // Function to save the displayed content as an image
  const saveImage = () => {
    html2canvas(document.getElementById("foodTableContainer")).then((canvas) => {
      const dataUrl = canvas.toDataURL();
      const link = document.createElement("a");

      // Format the filename with date and time
      const formattedDateTime = `${createdDate.replace(/-/g, "_")}_${createdTime.replace(/:/g, "")}`;
      link.href = dataUrl;
      link.download = `food_order_summary_${formattedDateTime}.png`;
      link.click();
    });
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Order Summary</h2>

      {/* Card container for customer and order information */}
      <div id="foodTableContainer" className="p-4 border rounded shadow-sm" style={{ backgroundColor: "#f9f9f9" }}>
        <p><strong>Customer Name:</strong> {customer_name}</p>
        <p><strong>Order Date:</strong> {createdDate}</p>
        <p><strong>Order Time:</strong> {createdTime}</p>

        {/* Check if there are selected items */}
        {selectedFoods.length > 0 ? (
          <>
            {/* Food items table */}
            <div className="table-responsive">
              <table className="table table-bordered table-striped mt-3 text-center">
                <thead className="table-light">
                  <tr>
                    <th>Food Name</th>
                    <th>Quantity</th>
                    <th>Price per Item (฿)</th>
                    <th>Total (฿)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFoods.map((food) => (
                    <tr key={food.ref}>
                      <td>{food.name}</td>
                      <td>{quantities[food.ref]}</td>
                      <td>{prices[food.ref-1]}</td>
                      <td>{quantities[food.ref] * prices[food.ref-1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Display total price */}
            <h4 className="text-end mt-3" style={{ color: "#007bff" }}>
              <strong>Total Price: {totalPrice} ฿</strong>
            </h4>
          </>
        ) : (
          <p className="text-center text-danger mt-3">No items selected.</p>
        )}
      </div>

      {/* Button to save the container as an image */}
      {selectedFoods.length > 0 && (
        <div className="text-center mt-4">
          <button
            className="btn btn-primary d-flex align-items-center justify-content-center"
            onClick={saveImage}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#0056b3"}
            onMouseLeave={(e) => e.target.style.backgroundColor = ""}
          >
            <FaDownload className="me-2" /> Save as Image
          </button>
        </div>
      )}
    </div>
  );
};

export default Summary;
