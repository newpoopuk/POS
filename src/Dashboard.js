import React, { useState } from "react";
import axios from "axios";
import { format } from "date-fns";

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(""); // Initially empty
  const [kitkatData, setKitkatData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch commodities from API
  const fetchCommodities = async () => {
    try {
      const response = await axios.get("http://localhost:8000/commodities/");
      setCommodities(response.data); // Store commodities data
    } catch (error) {
      alert("Error fetching commodities: " + (error.response?.data || error.message));
    }
  };

  // Fetch Kitkat data from API using selected date
  const fetchKitkatData = async (date) => {
    const formattedDate = format(new Date(date), "dd-MM-yyyy");
    setIsLoading(true);

    try {
      const response = await axios.get(`http://localhost:8000/kitkats/?created_date=${formattedDate}`);
      setKitkatData(response.data); // Set data directly from the API
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.statusText || error.message;
      alert(`Error fetching Kitkat data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch aggregated data for selected date
  const fetchAggregatedData = async (date) => {
    const formattedDate = format(new Date(date), "dd-MM-yyyy");

    try {
      const response = await axios.get(`http://127.0.0.1:8000/kitkats/sum/${formattedDate}`);
      setAggregatedData(response.data.aggregated_prods || []); // Store aggregated product data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.statusText || error.message;
      alert(`Error fetching aggregated data: ${errorMessage}`);
    }
  };

  // Handle date change
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setIsDateSelected(false); // Reset state when date changes
    setKitkatData([]); // Clear previous data
    setAggregatedData([]); // Clear previous aggregated data
  };

  // Handle confirm button click
  const handleConfirmClick = async () => {
    if (!selectedDate) {
      alert("Please select a date before confirming.");
      return;
    }
    setIsDateSelected(true); // Mark the date as selected
    await fetchCommodities(); // Fetch commodities
    await fetchKitkatData(selectedDate); // Fetch Kitkat data
    await fetchAggregatedData(selectedDate); // Fetch aggregated data
  };

  // Get product name based on reference
  const getProductName = (ref) => {
    const product = commodities.find((commodity) => `prod${commodity.ref}` === ref); // Match prodN with refN
    return product ? product.name : ref; // Return product name or the ref string if no match found
  };

  return (
    <div className="container mt-4">
      {/* Dashboard Title */}
      <h1 className="text-center mb-4">Dashboard</h1>

      {/* Date picker */}
      <div className="text-center mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="form-control"
          style={{ maxWidth: "300px", margin: "0 auto" }}
        />
      </div>

      {/* Confirm button */}
      {!isDateSelected && (
        <div className="text-center mb-4">
          <button
            onClick={handleConfirmClick}
            className="btn btn-primary"
            disabled={!selectedDate} // Disable if no date is selected
          >
            Confirm
          </button>
        </div>
      )}

      {/* Aggregated Data Display */}
      {isDateSelected && !isLoading && (
        <div className="mb-4">
          <h4>Aggregated Data:</h4>
          {aggregatedData.length > 0 ? (
            <ul>
              {aggregatedData.map(([ref, quantity], index) => (
                <li key={index}>
                  {getProductName(ref)}: {quantity}
                </li>
              ))}
            </ul>
          ) : (
            <p>No aggregated data available for the selected date.</p>
          )}
        </div>
      )}

      {/* Data table */}
      <div className="table-responsive">
        {isDateSelected && isLoading && (
          <div className="text-center">Loading data...</div>
        )}
        {isDateSelected && !isLoading && (
          <table className="table table-bordered table-hover">
            <thead className="thead-light">
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Created Date</th>
                <th>Created Time</th>
                <th>Data Lake</th>
              </tr>
            </thead>
            <tbody>
              {kitkatData.length > 0 ? (
                kitkatData.map((record, index) => (
                  <tr key={record.ID || index}>
                    <td>{index + 1}</td>
                    <td>{record.agent}</td>
                    <td>{record.Createddate}</td>
                    <td>{record.Createdtime}</td>
                    <td>
                      <ul>
                        {record.Data_Lake?.map(([ref, quantity], idx) => (
                          <li key={idx}>
                            {getProductName(ref)}: {quantity} {/* Display product name and quantity */}
                          </li>
                        )) || <li>No data available</li>}
                      </ul>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No data available for the selected date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
