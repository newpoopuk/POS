import React, { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const ProductChanges = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProcessedData = async (date) => {
    try {
      date = format(new Date(date), "dd-MM-yyyy");
      const response = await axios.get(`http://localhost:8000/process_data/?date=${date}`);
      setProcessedData(response.data);
    } catch (error) {
      console.error("Error fetching processed data", error);
    }
  };

  const handleFetchData = async () => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }
    setIsLoading(true);
    await fetchProcessedData(selectedDate);
    setIsLoading(false);
  };

  const prepareChartData = () => {
    if (processedData.length === 0) return { labels: [], datasets: [] };

    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const productNames = new Set();

    processedData.forEach((hourData) => {
      hourData.forEach(([product]) => productNames.add(product));
    });

    const datasets = Array.from(productNames).map((product, index) => ({
      label: product,
      data: processedData.map((hourData) => {
        const productEntry = hourData.find(([p]) => p === product);
        return productEntry ? productEntry[1] : 0;
      }),
      borderColor: `hsl(${index * 50}, 70%, 50%)`,
      fill: false,
    }));

    return {
      labels: hours,
      datasets,
    };
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Product Changes</h2>
      <div className="row mb-4">
        <div className="col-md-6">
          <label>Select Date:</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="col-md-6 d-flex align-items-end">
          <button className="btn btn-primary" onClick={handleFetchData}>Fetch Data</button>
        </div>
      </div>

      {isLoading ? <p>Loading...</p> : <Line data={prepareChartData()} />}
    </div>
  );
};

export default ProductChanges;
