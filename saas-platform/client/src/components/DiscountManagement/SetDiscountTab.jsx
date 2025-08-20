import React, { useState, useEffect } from "react";
import axios from "axios";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const SetDiscountTab = ({ shops, onSetDiscount }) => {
  const [selectedShop, setSelectedShop] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [shopDetails, setShopDetails] = useState(null);
  const [maxDiscountedCases, setMaxDiscountedCases] = useState("");
  const [currentCocaColaMonth, setCurrentCocaColaMonth] = useState(null);
  const [showNewMonthForm, setShowNewMonthForm] = useState(false);
  const [newMonthStartDate, setNewMonthStartDate] = useState("");
  const [newMonthEndDate, setNewMonthEndDate] = useState("");
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [shopSearchTerm, setShopSearchTerm] = useState("");

  // State for sub-discount types and their values
  const [subDiscountValues, setSubDiscountValues] = useState({});
  const [availableSubDiscounts, setAvailableSubDiscounts] = useState([]);

  // Reset form
  const resetForm = () => {
    setSubDiscountValues({});
    setStartDate("");
    setEndDate("");
    setMaxDiscountedCases("");
    setIsShopDropdownOpen(false);
    setShopSearchTerm("");
  };

  // Fetch current Coca-Cola month
  const fetchCurrentCocaColaMonth = async () => {
    try {
      const response = await axios.get(`${API_URL}/coca-cola-months/current`);
      setCurrentCocaColaMonth(response.data);
    } catch (err) {
      console.error("Failed to fetch current Coca-Cola month:", err);
      setStatus({
        type: "error",
        message: "Failed to fetch current Coca-Cola month.",
      });
    }
  };

  // Fetch shop details and current Coca-Cola month on component mount
  useEffect(() => {
    fetchCurrentCocaColaMonth();
  }, []);

  // Fetch shop details and set appropriate sub-discount types
  useEffect(() => {
    if (!selectedShop) {
      setShopDetails(null);
      setAvailableSubDiscounts([]);
      return;
    }

    const fetchShopDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/shops/${selectedShop}`);
        setShopDetails(response.data);

        // Initialize sub-discount values
        let initialValues = {};

        // Get sub-discount types from the API response
        if (
          response.data.discountType &&
          response.data.discountType.subDiscountTypes
        ) {
          const subTypes = response.data.discountType.subDiscountTypes.map(
            (type) => type.sub_discount_name
          );
          setAvailableSubDiscounts(subTypes);

          subTypes.forEach((type) => {
            initialValues[type] = "";
          });
          setSubDiscountValues(initialValues);
        }

        // Pre-fill existing values if available
        if (response.data.max_discounted_cases) {
          setMaxDiscountedCases(response.data.max_discounted_cases);
        }
        if (response.data.discount_start_date) {
          setStartDate(response.data.discount_start_date.split("T")[0]);
        }
        if (response.data.discount_end_date) {
          setEndDate(response.data.discount_end_date.split("T")[0]);
        }

        // Pre-fill sub-discount values if available
        if (
          response.data.shopDiscountValues &&
          response.data.shopDiscountValues.length > 0
        ) {
          const existingValues = {};
          response.data.shopDiscountValues.forEach((item) => {
            existingValues[item.subDiscountType.sub_discount_name] =
              item.discount_value;
          });
          setSubDiscountValues({ ...initialValues, ...existingValues });
        }
      } catch (err) {
        console.error("Failed to fetch shop details:", err);
        setStatus({
          type: "error",
          message: "Failed to fetch shop details.",
        });
      }
    };

    fetchShopDetails();
  }, [selectedShop]);

  // Handle changes to sub-discount values
  const handleSubDiscountChange = (type, value) => {
    setSubDiscountValues((prev) => ({
      ...prev,
      [type]: value,
    }));
  };
  // Filter shops based on search term
  const filteredShops = shops.filter(shop =>
    shop.shop_name.toLowerCase().includes(shopSearchTerm.toLowerCase()) ||
    (shop.discountType?.discount_name || "").toLowerCase().includes(shopSearchTerm.toLowerCase())
  );
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedShop || !maxDiscountedCases) {
      setStatus({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    // Validate sub-discount values
    let hasEmptyDiscounts = false;
    for (const type of availableSubDiscounts) {
      if (!subDiscountValues[type]) {
        hasEmptyDiscounts = true;
        break;
      }

      if (parseFloat(subDiscountValues[type]) < 0) {
        setStatus({
          type: "error",
          message: `Discount value for ${type} must be greater than zero.`,
        });
        return;
      }
    }

    if (hasEmptyDiscounts) {
      setStatus({
        type: "error",
        message: "Please enter discount values for all sub-discount types.",
      });
      return;
    }

    if (parseInt(maxDiscountedCases) < 0) {
      setStatus({
        type: "error",
        message: "Max discounted cases must be greater than zero.",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setStatus({
        type: "error",
        message: "Start date cannot be after end date.",
      });
      return;
    }

    const discountData = {
      shopId: selectedShop,
      discountValues: subDiscountValues,
      maxDiscountedCases: parseInt(maxDiscountedCases),
      startDate,
      endDate,
    };

    try {
      const result = await onSetDiscount(discountData);

      if (result.success) {
        setStatus({
          type: "success",
          message: "Discount limits set successfully!",
        });
        resetForm();
        setSelectedShop("");
      } else {
        setStatus({
          type: "error",
          message: result.error || "Failed to set discount limits.",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "An unexpected error occurred.",
      });
    }
  };

  // Handle creating a new Coca-Cola month
  const handleCreateNewMonth = async (e) => {
    e.preventDefault();

    if (!newMonthStartDate || !newMonthEndDate) {
      setStatus({
        type: "error",
        message: "Please provide both start and end dates for the new month.",
      });
      return;
    }

    if (new Date(newMonthStartDate) >= new Date(newMonthEndDate)) {
      setStatus({
        type: "error",
        message: "Start date must be before end date.",
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/coca-cola-months`, {
        start_date: newMonthStartDate,
        end_date: newMonthEndDate,
      });

      setStatus({
        type: "success",
        message: "New Coca-Cola month created successfully!",
      });

      // Refresh the current month data
      fetchCurrentCocaColaMonth();

      // Reset form and hide it
      setNewMonthStartDate("");
      setNewMonthEndDate("");
      setShowNewMonthForm(false);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to create new month.",
      });
    }
  };

  // Format date to display in a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Set Discount Limits</h2>

      {status.message && (
        <div
          className={`mb-4 p-3 rounded ${
            status.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Current Coca-Cola Month Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Current Coca-Cola Month
        </h3>
        {currentCocaColaMonth ? (
          <div>
            <p className="mb-2">
              <span className="font-medium">Period:</span>{" "}
              {formatDate(currentCocaColaMonth.start_date)} to{" "}
              {formatDate(currentCocaColaMonth.end_date)}
            </p>
            <div className="flex space-x-3 mt-3">
              <button
                type="button"
                onClick={() => setShowNewMonthForm(!showNewMonthForm)}
                className="bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
              >
                {showNewMonthForm ? "Cancel" : "Change Month"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-2">
              No current Coca-Cola month defined.
            </p>
            <button
              type="button"
              onClick={() => setShowNewMonthForm(true)}
              className="bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
            >
              Create New Month
            </button>
          </div>
        )}
      </div>

      {/* New Coca-Cola Month Form */}
      {showNewMonthForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-lg font-medium mb-3">
            Create New Coca-Cola Month
          </h3>
          <form onSubmit={handleCreateNewMonth} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="newMonthStartDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="newMonthStartDate"
                  value={newMonthStartDate}
                  onChange={(e) => setNewMonthStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="newMonthEndDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="newMonthEndDate"
                  value={newMonthEndDate}
                  onChange={(e) => setNewMonthEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
              >
                Create New Month
              </button>
              <button
                type="button"
                onClick={() => setShowNewMonthForm(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className="">
{/* Shop Selection with Search */}
<div className="mb-4">
  <label
    htmlFor="shop"
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    Select Shop
  </label>
  <div className="relative">
    <div
      onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white flex justify-between items-center"
    >
      <span className={selectedShop ? "text-gray-900" : "text-gray-500"}>
        {selectedShop 
          ? shops.find(s => s.shop_id == selectedShop)?.shop_name 
          : "Select a shop"
        }
      </span>
      <svg
        className={`w-4 h-4 transition-transform ${isShopDropdownOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    
    {isShopDropdownOpen && (
      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
        {/* Search Input */}
        <div className="p-2 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search shops..."
            value={shopSearchTerm}
            onChange={(e) => setShopSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
        
        {/* Shop List */}
        <div className="max-h-48 overflow-y-auto">
          {filteredShops.length > 0 ? (
            filteredShops.map((shop) => (
              <div
                key={shop.shop_id}
                onClick={() => {
                  setSelectedShop(shop.shop_id);
                  setIsShopDropdownOpen(false);
                  setShopSearchTerm("");
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                {shop.shop_name} ({shop.discountType?.discount_name || "Unknown"})
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">No shops found</div>
          )}
        </div>
      </div>
    )}
  </div>
</div>
        {shopDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Current Shop Settings</h3>
            <div className="text-sm">
              <div>Shop Name: {shopDetails.shop_name}</div>
              <div>
                Shop Type:{" "}
                {shopDetails.discountType?.discount_name || "Unknown"}
              </div>
              {shopDetails.max_discounted_cases && (
                <div>
                  Current Max Discounted Cases:{" "}
                  {shopDetails.max_discounted_cases}
                </div>
              )}
              {shopDetails.discount_start_date &&
                shopDetails.discount_end_date && (
                  <div>
                    Current Validity:{" "}
                    {shopDetails.discount_start_date.split("T")[0]} to{" "}
                    {shopDetails.discount_end_date.split("T")[0]}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Sub-Discount Types and Values */}
        {availableSubDiscounts.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Limits by Sub-Discount Type
            </label>
            <div className="space-y-3">
              {availableSubDiscounts.map((type) => (
                <div key={type} className="flex items-center space-x-3">
                  <div className="w-1/2">
                    <span className="text-sm text-gray-700">{type}</span>
                  </div>
                  <div className="w-1/2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={subDiscountValues[type] || ""}
                      onChange={(e) =>
                        handleSubDiscountChange(type, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the maximum discount amount for each sub-discount type.
            </p>
          </div>
        )}

        {/* Max Discounted Cases */}
        <div className="mb-4">
          <label
            htmlFor="maxDiscountedCases"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Max Discounted Cases
          </label>
          <input
            type="number"
            id="maxDiscountedCases"
            min="1"
            step="1"
            value={maxDiscountedCases}
            onChange={(e) => setMaxDiscountedCases(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            The maximum number of cases that can be discounted for this shop.
          </p>
        </div>

        {/* Date Range
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div> */}

        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Set Discount Limits
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetDiscountTab;
