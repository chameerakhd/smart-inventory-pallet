import React, { useState, useEffect } from "react";
import InventoryTable from "../components/InventoryTable";
import AddNewStockForm from "../components/AddNewStockForm";
import InventoryHistory from "../components/InventoryHistory";
import AdjustStockForm from "../components/AdjustStockForm";

import axios from "axios";
import { useSearchParams } from "react-router-dom";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const InventoryManagementPage = () => {
  const [activeTab, setActiveTab] = useState("Available Stock");
  const [sortOption, setSortOption] = useState("Size");
  const [inventoryData, setInventoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFixingData, setIsFixingData] = useState(false);

  // For filters
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [searchParams] = useSearchParams();

  const tabs = [
    "Available Stock",
    "Add New Stock",
    "Adjust Stock",
    "Stock History",
  ];

  useEffect(() => {
    if (searchParams.get("tab") === "add-new-stock") {
      setActiveTab("Add New Stock");
    }
  }, [searchParams]);

  // Fetch inventory data function (extracted to avoid duplication)
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const params = {};

      if (selectedSize) {
        params.size = selectedSize;
      }

      if (selectedBrand) {
        params.brand = selectedBrand;
      }

      if (sortOption) {
        params.sortBy = sortOption;
      }

      const response = await axios.get(`${API_URL}/products`, { params });

      setInventoryData(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch inventory data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fix inventory data function (moved outside useEffect)
  const fixInventoryData = async () => {
    try {
      setIsFixingData(true);
      const response = await axios.post(
        `${API_URL}/stock-inventory/fix-quantities`
      );
      console.log("Fix completed:", response.data);
      alert(`Fixed ${response.data.totalFixed || 0} inventory records`);

      // Refresh inventory data after fixing
      await fetchInventory();
    } catch (error) {
      console.error("Error fixing inventory:", error);
      alert("Failed to fix inventory data. Please try again.");
    } finally {
      setIsFixingData(false);
    }
  };

  // Fetch available sizes for filtering
  const fetchSizes = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/sizes`);
      setAvailableSizes(response.data || []);
    } catch (err) {
      console.error("Failed to fetch sizes:", err);
      setAvailableSizes([]);
    }
  };

  // Fetch available brands for filtering
  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/brands`);
      setAvailableBrands(response.data || []);
    } catch (err) {
      console.error("Failed to fetch brands:", err);
      setAvailableBrands([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchInventory(), fetchSizes(), fetchBrands()]);
    };

    loadInitialData();
  }, [selectedSize, selectedBrand, sortOption]);

  // Handle sort change
  const handleSortChange = (option) => {
    setSortOption(option);
  };

  // Handle size filter change
  const handleSizeChange = (e) => {
    setSelectedSize(e.target.value);
  };

  // Handle brand filter change
  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value);
  };

  // Function to refresh inventory data (updated to use fetchInventory)
  const refreshInventory = async () => {
    await fetchInventory();
  };

  return (
    <div className="mx-auto p-4">
      {/* Header with Fix Button */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Inventory Management
        </h1>
        <button
          onClick={fixInventoryData}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isFixingData || isLoading}
        >
          {isFixingData ? "Fixing..." : "Fix Inventory Data"}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b-2 border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`py-3 px-6 text-sm font-medium transition-colors duration-200 ${
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

      {/* Tab Content */}
      {activeTab === "Available Stock" && (
        <div className="mt-6">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 mb-2">Filters</p>
              <div className="flex space-x-4 mb-4">
                {/* Size Filter */}
                <div className="relative">
                  <select
                    className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedSize}
                    onChange={handleSizeChange}
                    disabled={isLoading}
                  >
                    <option value="">All Sizes</option>
                    {availableSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
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

                {/* Brand Filter */}
                <div className="relative">
                  <select
                    className="appearance-none border border-gray-300 rounded px-4 py-2 pr-8 bg-white text-gray-700 w-40 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedBrand}
                    onChange={handleBrandChange}
                    disabled={isLoading}
                  >
                    <option value="">All Brands</option>
                    {availableBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
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

                {/* Clear Filters Button */}
                {(selectedSize || selectedBrand) && (
                  <button
                    onClick={() => {
                      setSelectedSize("");
                      setSelectedBrand("");
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Sort by</p>
              <div className="flex space-x-4">
                {["Size", "Brand", "Count"].map((option) => (
                  <div key={option} className="relative">
                    <button
                      className={`border border-gray-300 rounded px-4 py-2 bg-white text-gray-700 w-32 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                        sortOption === option
                          ? "bg-blue-50 border-blue-500 text-blue-600"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleSortChange(option)}
                      disabled={isLoading}
                    >
                      {option}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Display */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading inventory data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={refreshInventory}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-gray-600">
                Showing {inventoryData.length} product(s)
                {selectedSize && ` • Size: ${selectedSize}`}
                {selectedBrand && ` • Brand: ${selectedBrand}`}
                {` • Sorted by: ${sortOption}`}
              </div>
              <InventoryTable inventoryData={inventoryData} />
            </div>
          )}
        </div>
      )}

      {activeTab === "Add New Stock" && (
        <div className="mt-6">
          <AddNewStockForm onInventoryAdded={refreshInventory} />
        </div>
      )}

      {activeTab === "Adjust Stock" && (
        <div className="mt-6">
          <AdjustStockForm onStockAdjusted={refreshInventory} />
        </div>
      )}

      {activeTab === "Stock History" && (
        <div className="mt-6">
          <InventoryHistory />
        </div>
      )}
    </div>
  );
};

export default InventoryManagementPage;
