import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingTable from "../components/LoadingTable";
import UnloadingTable from "../components/UnloadingTable";
import AddNewLoadingForm from "../components/AddNewLoadingForm";
import AddNewUnloadingForm from "../components/AddNewUnloadingForm";
import LoadingUnloadingHistory from "../components/LoadingUnloadingHistory";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EmptyReturnsForm from "../components/EmptyReturnsForm";
import ExpiryReturnsForm from "../components/ExpiryReturnsForm";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const LoadingManagementPage = () => {
  const [activeTab, setActiveTab] = useState("Loading");
  const [inventoryData, setInventoryData] = useState([]);
  const [lorryData, setLorryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // For filters
  // const [availableProducts, setAvailableProducts] = useState([]);
  const [availableLorries, setAvailableLorries] = useState([]);
  // const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedLorry, setSelectedLorry] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const tabs = [
    "Loading",
    "Unloading",
    "Expired Returns",
    "Empty Returns",
    "History",
  ];

  useEffect(() => {
    searchParams.get("tab") &&
      searchParams.get("tab") === "loading" &&
      setActiveTab("Loading");
    searchParams.get("tab") &&
      searchParams.get("tab") === "unloading" &&
      setActiveTab("Unloading");
  }, [searchParams]);

  // Fetch inventory data for loading/unloading forms
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/stock-inventory`); ////////////////
        setInventoryData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch lorry data for loading/unloading forms
    const fetchLorries = async () => {
      try {
        const response = await axios.get(`${API_URL}/lorries`);
        setLorryData(response.data);
        setAvailableLorries(response.data);
      } catch (err) {
        console.error("Failed to fetch lorries:", err);
      }
    };

    // Fetch available products for filtering
    // const fetchProducts = async () => {
    //   try {
    //     const response = await axios.get(`${API_URL}/products`);
    //     setAvailableProducts(response.data);
    //   } catch (err) {
    //     console.error("Failed to fetch products:", err);
    //   }
    // };

    fetchInventory();
    fetchLorries();
    // fetchProducts();
  }, []);

  // Handle product filter change
  // const handleProductChange = (e) => {
  //   setSelectedProduct(e.target.value);
  // };

  // Handle lorry filter change
  const handleLorryChange = (e) => {
    setSelectedLorry(e.target.value);
  };

  // Handle date range change
  // const handleDateRangeChange = (range) => {
  //   setDateRange(range);
  // };

  // Function to refresh data after new loading/unloading
  const refreshData = async () => {
    try {
      setIsLoading(true);

      // Refresh inventory
      const inventoryResponse = await axios.get(`${API_URL}/stock-inventory`);
      setInventoryData(inventoryResponse.data);

      // Refresh lorry data if needed
      const lorryResponse = await axios.get(`${API_URL}/lorries`);
      setLorryData(lorryResponse.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto p-4">
      <div className="border-b-2 border-gray-200">
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
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "Loading" && (
        <div className="mt-6">
          <div className="mb-6 p-4 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Add New Loading</h2>
            <AddNewLoadingForm
              inventoryData={inventoryData}
              lorryData={lorryData}
              onLoadingAdded={refreshData}
            />
          </div>

          <div className="p-4 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Recent Loading Transactions
            </h2>
            <div className="mb-4 flex flex-wrap gap-4">
              {/* Lorry Filter */}
              <div className="relative">
                <select
                  className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedLorry}
                  onChange={handleLorryChange}
                >
                  <option value="">All Lorries</option>
                  {availableLorries.map((lorry) => (
                    <option key={lorry.lorry_id} value={lorry.lorry_id}>
                      {lorry.lorry_number}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Date Range Filter - You can implement a date picker component here */}
              <div className="relative">
                <button
                  className="border border-gray-300 rounded px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {dateRange.startDate && dateRange.endDate
                    ? `${new Date(
                        dateRange.startDate
                      ).toLocaleDateString()} - ${new Date(
                        dateRange.endDate
                      ).toLocaleDateString()}`
                    : "Select Date Range"}
                </button>
                {isOpen && (
                  <div className="absolute mt-2 bg-white border border-gray-300 p-2 shadow-lg z-10">
                    <DatePicker
                      selectsRange={true}
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      onChange={(update) => {
                        setDateRange({
                          startDate: update[0],
                          endDate: update[1],
                        });
                        if (update[0] && update[1]) setIsOpen(false);
                      }}
                      isClearable={true}
                      inline
                    />
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-6">Loading data...</div>
            ) : (
              <LoadingTable
                selectedLorry={selectedLorry}
                dateRange={dateRange}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "Unloading" && (
        <div className="mt-6">
          <div className="mb-6 p-4 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Add New Unloading</h2>
            <AddNewUnloadingForm
              inventoryData={inventoryData}
              lorryData={lorryData}
              onUnloadingAdded={refreshData}
            />
          </div>

          <div className="p-4 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Recent Unloading Transactions
            </h2>
            <div className="mb-4 flex flex-wrap gap-4">
              {/* Lorry Filter */}
              <div className="relative">
                <select
                  className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedLorry}
                  onChange={handleLorryChange}
                >
                  <option value="">All Lorries</option>
                  {availableLorries.map((lorry) => (
                    <option key={lorry.lorry_id} value={lorry.lorry_id}>
                      {lorry.lorry_number}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="relative">
                <button
                  className="border border-gray-300 rounded px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {dateRange.startDate && dateRange.endDate
                    ? `${new Date(
                        dateRange.startDate
                      ).toLocaleDateString()} - ${new Date(
                        dateRange.endDate
                      ).toLocaleDateString()}`
                    : "Select Date Range"}
                </button>
                {isOpen && (
                  <div className="absolute mt-2 bg-white border border-gray-300 p-2 shadow-lg z-10">
                    <DatePicker
                      selectsRange={true}
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      onChange={(update) => {
                        setDateRange({
                          startDate: update[0],
                          endDate: update[1],
                        });
                        if (update[0] && update[1]) setIsOpen(false);
                      }}
                      isClearable={true}
                      inline
                    />
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-6">Loading data...</div>
            ) : (
              <UnloadingTable
                selectedLorry={selectedLorry}
                dateRange={dateRange}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "Expired Returns" && (
        <div className="mt-6">
          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-semibold">Select Lorry</h2>
              <div className="">
                {/* Lorry Filter */}
                <div className="relative">
                  <select
                    className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedLorry}
                    onChange={handleLorryChange}
                  >
                    <option value="">All Lorries</option>
                    {availableLorries.map((lorry) => (
                      <option key={lorry.lorry_id} value={lorry.lorry_id}>
                        {lorry.lorry_number}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-6">Loading data...</div>
            ) : (
              <ExpiryReturnsForm
                selectedLorry={selectedLorry}
                dateRange={dateRange}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "Empty Returns" && (
        <div className="mt-6">
          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-semibold">Select Lorry</h2>
              <div className="">
                {/* Lorry Filter */}
                <div className="relative">
                  <select
                    className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedLorry}
                    onChange={handleLorryChange}
                  >
                    <option value="">All Lorries</option>
                    {availableLorries.map((lorry) => (
                      <option key={lorry.lorry_id} value={lorry.lorry_id}>
                        {lorry.lorry_number}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-6">Loading data...</div>
            ) : (
              <EmptyReturnsForm
                selectedLorry={selectedLorry}
                dateRange={dateRange}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "History" && (
        <div className="mt-6">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              Loading & Unloading History
            </h2>
            <div className="mb-4 flex flex-wrap gap-4">
              {/* Product Filter */}
              {/* <div className="relative">
                <select
                  className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedProduct}
                  onChange={handleProductChange}
                >
                  <option value="">All Products</option>
                  {availableProducts.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div> */}

              {/* Lorry Filter */}
              <div className="relative">
                <select
                  className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedLorry}
                  onChange={handleLorryChange}
                >
                  <option value="">All Lorries</option>
                  {availableLorries.map((lorry) => (
                    <option key={lorry.lorry_id} value={lorry.lorry_id}>
                      {lorry.lorry_number}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="relative">
                <button
                  className="border border-gray-300 rounded px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {dateRange.startDate && dateRange.endDate
                    ? `${new Date(
                        dateRange.startDate
                      ).toLocaleDateString()} - ${new Date(
                        dateRange.endDate
                      ).toLocaleDateString()}`
                    : "Select Date Range"}
                </button>
                {isOpen && (
                  <div className="absolute mt-2 bg-white border border-gray-300 p-2 shadow-lg z-10">
                    <DatePicker
                      selectsRange={true}
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      onChange={(update) => {
                        setDateRange({
                          startDate: update[0],
                          endDate: update[1],
                        });
                        if (update[0] && update[1]) setIsOpen(false);
                      }}
                      isClearable={true}
                      inline
                    />
                  </div>
                )}
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-6">Loading data...</div>
            ) : (
              <LoadingUnloadingHistory
                selectedLorry={selectedLorry}
                dateRange={dateRange}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "Overview" && (
        <div className="mt-6">
          <div className="p-4 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Loading & Unloading Overview
            </h2>
            {isLoading ? (
              <div className="text-center py-6">Loading overview data...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded bg-gray-50">
                  <h3 className="font-medium text-gray-700">
                    Total Loaded This Month
                  </h3>
                  <p className="text-2xl font-bold mt-2">0 Cases</p>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                  <h3 className="font-medium text-gray-700">
                    Total Unloaded This Month
                  </h3>
                  <p className="text-2xl font-bold mt-2">0 Cases</p>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                  <h3 className="font-medium text-gray-700">
                    Net Inventory Change
                  </h3>
                  <p className="text-2xl font-bold mt-2 text-red-500">
                    0 Cases
                  </p>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                  <h3 className="font-medium text-gray-700">
                    Most Loaded Product
                  </h3>
                  <p className="text-lg font-bold mt-2">N/A</p>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                  <h3 className="font-medium text-gray-700">
                    Most Active Lorry
                  </h3>
                  <p className="text-lg font-bold mt-2">N/A</p>
                </div>

                <div className="p-4 border rounded bg-gray-50">
                  <h3 className="font-medium text-gray-700">
                    Average Load Size
                  </h3>
                  <p className="text-lg font-bold mt-2">0 Cases</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingManagementPage;
