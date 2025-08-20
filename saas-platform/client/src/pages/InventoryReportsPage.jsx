import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import LorryPerformance from "../components/LorryPerformance";
import ReportsOverview from "../components/ReportsOverview";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const InventoryReportsPage = () => {
  const [activeTab, setActiveTab] = useState("ReportsOverview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Shared state between components
  const [products, setProducts] = useState([]);
  const [lorryData, setLorryData] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState([]);
  const [unloadingTransactions, setUnloadingTransactions] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [totalGrossProfit, setTotalGrossProfit] = useState(0);
  const [expiryReturns, setExpiryReturns] = useState([]);
  const [emptyReturns, setEmptyReturns] = useState([]);
  const [stockData, setStockData] = useState([]);

  const tabs = ["ReportsOverview", "LorryPerformance"];

  useEffect(() => {
    // Set auth token for all axios requests
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch all necessary data when component mounts or date range changes
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare date params
        const params = {
          startDate: dateRange?.startDate?.toISOString().split("T")[0],
          endDate:
            dateRange?.endDate?.toISOString().split("T")[0] ||
            new Date().toISOString().split("T")[0],
        };

        // Fetch all data in parallel
        const [
          productsRes,
          lorriesRes,
          loadingRes,
          unloadingRes,
          salesRes,
          stockRes,
          expiryRes,
          emptyRes,
        ] = await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/lorries`),
          axios.get(`${API_URL}/loading-transactions`, { params }),
          axios.get(`${API_URL}/unloading-transactions`, { params }),
          axios.get(`${API_URL}/daily-sales`, { params }),
          axios.get(`${API_URL}/stock-inventory`),
          axios.get(`${API_URL}/expiry-returns`, { params }),
          axios.get(`${API_URL}/empty-returns`, { params }),
        ]);

        setProducts(productsRes.data);
        setLorryData(lorriesRes.data);
        setLoadingTransactions(loadingRes.data);
        setUnloadingTransactions(unloadingRes.data);
        setSalesData(salesRes.data.salesData);
        setTotalGrossProfit(salesRes.data.totalGrossProfit);
        setStockData(stockRes.data);
        setEmptyReturns(emptyRes.data);
        setExpiryReturns(expiryRes.data);
      } catch (err) {
        setError("Failed to fetch data: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [dateRange]);

  // Render table based on active tab
  const renderTable = () => {
    // Common props for both components
    const sharedProps = {
      products,
      lorryData,
      loadingTransactions,
      unloadingTransactions,
      salesData,
      totalGrossProfit,
      expiryReturns,
      emptyReturns,
      stockData,
      isLoading,
      error,
      dateRange,
    };

    switch (activeTab) {
      case "ReportsOverview":
        return <ReportsOverview {...sharedProps} />;
      case "LorryPerformance":
        return <LorryPerformance {...sharedProps} />;
      default:
        return <div>Select a report type</div>;
    }
  };

  return (
    <div className="mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
        <div className="border-b-2 border-gray-200 mb-4 sm:mb-0">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`py-3 px-6 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "ReportsOverview"
                  ? "Reports Overview"
                  : "Lorry Performance"}
              </button>
            ))}
          </nav>
        </div>

        {/* Date picker moved to parent component */}
        <div className="relative w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <button
            className="w-full sm:w-64 border border-gray-300 rounded px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-left"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          >
            {dateRange.startDate && dateRange.endDate
              ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
              : "Select Date Range"}
          </button>
          {isDatePickerOpen && (
            <div className="absolute mt-1 bg-white border border-gray-300 p-2 rounded shadow-lg z-10">
              <DatePicker
                selectsRange={true}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={(update) => {
                  setDateRange({
                    startDate: update[0],
                    endDate: update[1],
                  });
                  if (update[0] && update[1]) setIsDatePickerOpen(false);
                }}
                isClearable={true}
                inline
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-8">Loading inventory data...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        /* Main Report Area */
        <div className="">{renderTable()}</div>
      )}
    </div>
  );
};

export default InventoryReportsPage;
