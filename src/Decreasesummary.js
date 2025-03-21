import React from "react";
import { useLocation } from "react-router-dom";
import html2canvas from "html2canvas";

const Decreasesummary = () => {
  const location = useLocation();
  const { foods, quantities, customer_name, createdDate, createdTime } = location.state || {};

  // Function to save the displayed content as an image
  const saveImage = () => {
    html2canvas(document.getElementById("foodTableContainer")).then((canvas) => {
      const dataUrl = canvas.toDataURL();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "food_order_summary.png";
      link.click();
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Order Summary</h2>

      {/* The container that includes customer name, date, time, and table */}
      <div id="foodTableContainer">
        <p><strong>Customer Name:</strong> {customer_name}</p>
        <p><strong>Order Date:</strong> {createdDate}</p>
        <p><strong>Order Time:</strong> {createdTime}</p>

        {/* Food items table */}
        <table className="table table-bordered mt-3">
          <thead>
            <tr>
              <th>Food Name</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {foods.map((food) => (
              <tr key={food.ref}>
                <td>{food.name}</td>
                <td>{quantities[food.ref]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Button to save the container as an image */}
      <div className="text-center mt-4">
        <button className="btn btn-primary" onClick={saveImage}>
          Save as Image
        </button>
      </div>
    </div>
  );
};

export default Decreasesummary;
