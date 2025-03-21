import React, { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DateRangeDashboard = () => {
  const [startDate, setStartDate] = useState(""); // Start date
  const [endDate, setEndDate] = useState(""); // End date
  const [storeData, setStoreData] = useState([]); // Data fetched from the store
  const [commodities, setCommodities] = useState([]); // Commodity details
  const [isLoading, setIsLoading] = useState(false);

  // Fetch commodities for mapping product names
  const fetchCommodities = async () => {
    try {
      const response = await axios.get("http://localhost:8000/commodities/");
      setCommodities(response.data);
    } catch (error) {
      alert("Error fetching commodities: " + (error.response?.data || error.message));
    }
  };

  // Fetch data from the store based on the date range
  const fetchStoreData = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const formattedStartDate = format(new Date(startDate), "dd-MM-yyyy");
    const formattedEndDate = format(new Date(endDate), "dd-MM-yyyy");
    setIsLoading(true);

    try {
      const response = await axios.get(`http://localhost:8000/store`, {
        params: {
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        },
      });

      setStoreData(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.statusText || error.message;
      alert(`Error fetching store data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get product name based on reference
  const getProductName = (ref) => {
    const product = commodities.find((commodity) => `prod${commodity.ref}` === ref); // Match prodN with refN
    return product ? product.name : ref; // Return product name or the ref string if no match found
  };

  // Prepare data for the graph
  const prepareChartData = () => {
    const dates = [];
    const productAggregates = {};

    storeData.forEach((record) => {
      const { Createddate, Data_Lake } = record;
      dates.push(Createddate);

      Data_Lake.forEach(([ref, quantity]) => {
        if (!productAggregates[ref]) {
          productAggregates[ref] = [];
        }

        productAggregates[ref].push(quantity);
      });
    });

    return {
      labels: dates, // Dates as x-axis labels
      datasets: Object.entries(productAggregates).map(([ref, quantities], idx) => ({
        label: getProductName(ref),
        data: quantities,
        backgroundColor: `rgba(${75 + idx * 30}, ${192 - idx * 20}, ${192 - idx * 10}, 0.6)`,
        borderColor: `rgba(${75 + idx * 30}, ${192 - idx * 20}, ${192 - idx * 10}, 1)`,
        borderWidth: 1,
      })),
    };
  };

  return (
    <div className="container mt-4">
      {/* Title */}
      <h1 className="text-center mb-4">Date Range Dashboard</h1>

      {/* Date pickers */}
      <div className="row mb-4">
        <div className="col-md-6">
          <label htmlFor="startDate">Start Date:</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="endDate">End Date:</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-control"
          />
        </div>
      </div>

      {/* Confirm button */}
      <div className="text-center mb-4">
        <button
          onClick={async () => {
            await fetchCommodities();
            await fetchStoreData();
          }}
          className="btn btn-primary"
        >
          Confirm
        </button>
      </div>
      <div className="text-center mt-4">
          <Link to="/ProductChanges" className="btn btn-primary">
            ProductChanges
          </Link>
        </div>      
      {/* Loading state */}
      {isLoading && <div className="text-center">Loading data...</div>}

      {/* Chart */}
      {!isLoading && storeData.length > 0 && (
        <div className="mt-4">
          <h4>Product Quantities by Date:</h4>
          <Bar data={prepareChartData()} />
        </div>
      )}

      {/* No data message */}
      {!isLoading && storeData.length === 0 && (
        <p className="text-center">No data available for the selected date range.</p>
      )}
    </div>
    
  );
};

export default DateRangeDashboard;
