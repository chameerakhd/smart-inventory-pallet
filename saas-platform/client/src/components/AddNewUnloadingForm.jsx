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

const AddNewUnloadingForm = ({ onUnloadingAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lorries, setLorries] = useState([]);
  // const [products, setProducts] = useState([]);
  const [lastLoadingData, setLastLoadingData] = useState(null);
  const [loadingDataLoading, setLoadingDataLoading] = useState(false);
  const [noActiveLoading, setNoActiveLoading] = useState(false);
  const [unloadingItems, setUnloadingItems] = useState([
    {
      product_id: "",
      product_name: "",
      product_size: "",
      cases_returned: 0,
      bottles_returned: 0,
      cases_loaded: 0,
      bottles_loaded: 0,
    },
  ]);

  // Size order map for consistent sorting
  const sizeOrderMap = {
    "175 mL": 1,
    "250 mL": 4,
    "300 mL": 2,
    "355 mL": 9,
    "400 mL": 5,
    "500 mL": 10,
    "750 mL": 3,
    "1 L": 11,
    "1050 mL": 6,
    "1.5 L": 7,
    "2 L": 8,
  };

  // Form state
  const [formData, setFormData] = useState({
    lorry_id: "",
    unloading_date: new Date().toISOString().split("T")[0],
    unloading_time: new Date().toTimeString().split(" ")[0],
    unloaded_by: "",
    status: "Completed",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedLorry, setSelectedLorry] = useState(null);

  // Generate color map for different product sizes
  const generateSizeColorMap = () => {
    const sizes = [
      ...new Set(
        unloadingItems
          .filter((item) => item.product_id)
          .map((item) => item.product_size)
      ),
    ];
    const colorMap = {};

    // Predefined colors for better visual distinction
    const colors = [
      "bg-blue-100",
      "bg-green-100",
      "bg-yellow-100",
      "bg-purple-100",
      "bg-pink-100",
      "bg-indigo-100",
      "bg-orange-100",
      "bg-teal-100",
      "bg-red-100",
      "bg-cyan-100",
    ];

    sizes.forEach((size, index) => {
      colorMap[size] = colors[index % colors.length];
    });

    return colorMap;
  };

  const sizeColorMap = generateSizeColorMap();

  // Fetch lorries and products on component mount
  useEffect(() => {
    const fetchLorries = async () => {
      try {
        const response = await axios.get(`${API_URL}/lorries`);
        setLorries(response.data);
      } catch (err) {
        console.error("Failed to fetch lorries:", err);
      }
    };

    // const fetchProducts = async () => {
    //   try {
    //     const response = await axios.get(`${API_URL}/products`);
    //     setProducts(response.data);
    //   } catch (err) {
    //     console.error("Failed to fetch products:", err);
    //   }
    // };

    fetchLorries();
    // fetchProducts();
  }, []);

  // Fetch last loading data when lorry is selected
  useEffect(() => {
    if (formData.lorry_id) {
      fetchLastLoadingData(formData.lorry_id);
    } else {
      setLastLoadingData(null);
      setNoActiveLoading(false);
      // Reset unloading date to today when no lorry is selected
      setFormData(prevData => ({
        ...prevData,
        unloading_date: new Date().toISOString().split("T")[0]
      }));
    }
  }, [formData.lorry_id]); // Removed formData.unloading_date dependency

  // Fetch last loading transaction for the selected lorry
  const fetchLastLoadingData = async (lorryId) => {
    try {
      setLoadingDataLoading(true);
      setNoActiveLoading(false);

      // Modified API call to remove date parameter - search for any active loading
      const response = await axios.get(`${API_URL}/loading-transactions`, {
        params: {
          lorryId: lorryId,
          limit: 10,
        },
      });

      if (response.data && response.data.length > 0) {
        // Filter to find transactions that haven't been unloaded yet
        const activeLoadings = response.data.filter(
          (loading) => loading.status !== "Unloaded"
        );

        if (activeLoadings.length > 0) {
          // Use the first active loading transaction
          setLastLoadingData(activeLoadings[0]);

          // Automatically set unloading date to match loading date
          const loadingDate = new Date(activeLoadings[0].loading_date).toISOString().split("T")[0];
          setFormData(prevData => ({
            ...prevData,
            unloading_date: loadingDate
          }));

          // Populate unloading items with loading data
          if (
            activeLoadings[0].loadingDetails &&
            activeLoadings[0].loadingDetails.length > 0
          ) {
            const loadedItems = activeLoadings[0].loadingDetails.map(
              (detail) => ({
                product_id: detail.product.product_id,
                product_name: detail.product.product_name,
                product_size: detail.product.size,
                cases_returned: 0,
                bottles_returned: 0,
                cases_loaded: detail.cases_loaded,
                bottles_loaded: detail.bottles_loaded,
              })
            );

            // Sort items by size using the size order map
            loadedItems.sort((a, b) => {
              const orderA = sizeOrderMap[a.product_size] || 999;
              const orderB = sizeOrderMap[b.product_size] || 999;
              return orderA - orderB;
            });

            setUnloadingItems(loadedItems);
          }
        } else {
          setNoActiveLoading(true);
        }
      } else {
        setNoActiveLoading(true);
      }
    } catch (err) {
      console.error("Failed to fetch loading data:", err);
      setError("Failed to fetch loading data for this lorry");
    } finally {
      setLoadingDataLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation checks
    if (noActiveLoading) {
      setError("There are no active loading transactions to unload");
      return;
    }

    if (!formData.lorry_id || !formData.unloaded_by) {
      setError("Please fill in all required fields");
      return;
    }

    const invalidItems = unloadingItems.filter(
      (item) =>
        !item.product_id || item.cases_returned < 0 || item.bottles_returned < 0
    );

    if (invalidItems.length > 0) {
      setError("Please fill in all product details with valid quantities");
      return;
    }

    // Find the selected lorry details
    const lorry = lorries.find(
      (l) => l.lorry_id === parseInt(formData.lorry_id)
    );
    setSelectedLorry(lorry);

    // Show confirmation modal instead of submitting directly
    setShowConfirmation(true);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleSubmitConfirmed = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare the request payload
      const unloadingData = {
        ...formData,
        unloadingDetails: unloadingItems
          .filter((item) => item.product_id)
          .map((item) => ({
            product_id: item.product_id,
            cases_returned: parseInt(item.cases_returned),
            bottles_returned: parseInt(item.bottles_returned),
          })),
      };

      // Send the unloading transaction request
      await axios.post(`${API_URL}/unloading-transactions`, unloadingData);

      setSuccess(true);
      setShowConfirmation(false);

      // Reset form
      setFormData({
        lorry_id: "",
        unloading_date: new Date().toISOString().split("T")[0],
        unloading_time: new Date().toTimeString().split(" ")[0],
        unloaded_by: "",
        status: "Completed",
      });

      setUnloadingItems([
        {
          product_id: "",
          product_name: "",
          product_size: "",
          cases_returned: 0,
          bottles_returned: 0,
          cases_loaded: 0,
          bottles_loaded: 0,
        },
      ]);

      setLastLoadingData(null);
      setNoActiveLoading(false);

      // Notify parent component
      if (onUnloadingAdded) {
        onUnloadingAdded();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error creating unloading transaction:", err);
      setError(
        err.response?.data?.message || "Failed to create unloading transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle unloading item changes
  const handleUnloadingItemChange = (index, field, value) => {
    const updatedItems = [...unloadingItems];
    updatedItems[index][field] = value;
    setUnloadingItems(updatedItems);
  };

  // Add another unloading item (removed since products can't be added manually anymore)

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Add New Unloading</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Unloading transaction created successfully!
        </div>
      )}

{showConfirmation && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">
        Confirm Unloading Transaction
      </h3>

      <div className="mb-4">
        <p className="font-semibold">Lorry Details:</p>
        <p>
          Lorry:{" "}
          {selectedLorry
            ? `${selectedLorry.lorry_number} - ${selectedLorry.driver_name}`
            : "no data"}
        </p>
        <p>Unloaded By: {formData.unloaded_by}</p>
        <p>Date: {formData.unloading_date}</p>
        <p>Time: {formData.unloading_time}</p>
      </div>

      <div className="mb-4">
        <p className="font-semibold mb-2">Products Returned:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-white border-2 text-left">
                  Size
                </th>
                <th className="py-2 px-4 border-white border-2 text-left">
                  Product
                </th>
                <th className="py-2 px-4 border-white border-2 text-center">
                  Cases Loaded
                </th>
                <th className="py-2 px-4 border-white border-2 text-center">
                  Bottles Loaded
                </th>
                <th className="py-2 px-4 border-white border-2 text-center">
                  Cases Returned
                </th>
                <th className="py-2 px-4 border-white border-2 text-center">
                  Bottles Returned
                </th>
              </tr>
            </thead>
            <tbody>
              {unloadingItems
                .filter((item) => item.product_id)
                .sort((a, b) => {
                  const orderA = sizeOrderMap[a.product_size] || 999;
                  const orderB = sizeOrderMap[b.product_size] || 999;
                  return orderA - orderB;
                })
                .map((item, index) => (
                  <tr
                    key={`${item.product_id}-${index}`}
                    className={sizeColorMap[item.product_size]}
                  >
                    <td className="py-1 px-4 border-white border-2 font-medium">
                      {item.product_size}
                    </td>
                    <td className="py-1 px-4 border-white border-2 ">
                      {item.product_name}
                    </td>
                    <td className="py-1 px-4 border-white border-2 text-center">
                      {item.cases_loaded}
                    </td>
                    <td className="py-1 px-4 border-white border-2 text-center">
                      {item.bottles_loaded}
                    </td>
                    <td className="py-1 px-4 border-white border-2 text-center">
                      {item.cases_returned}
                    </td>
                    <td className="py-1 px-4 border-white border-2 text-center">
                      {item.bottles_returned}
                    </td>
                  </tr>
                ))}
              
              {/* Totals Row */}
              <tr className="bg-gray-100 ">
                <td className="py-2 px-4 border-white border-2 text-right" colSpan={2}>
                  Total
                </td>
                <td className="py-2 px-4 border-white border-2 text-center">
                  {unloadingItems
                    .filter(item => item.product_id)
                    .reduce((sum, item) => sum + (Number(item.cases_loaded) || 0), 0)}
                </td>
                <td className="py-2 px-4 border-white border-2 text-center">
                  {unloadingItems
                    .filter(item => item.product_id)
                    .reduce((sum, item) => sum + (Number(item.bottles_loaded) || 0), 0)}
                </td>
                <td className="py-2 px-4 border-white border-2 text-center">
                  {unloadingItems
                    .filter(item => item.product_id)
                    .reduce((sum, item) => sum + (Number(item.cases_returned) || 0), 0)}
                </td>
                <td className="py-2 px-4 border-white border-2 text-center">
                  {unloadingItems
                    .filter(item => item.product_id)
                    .reduce((sum, item) => sum + (Number(item.bottles_returned) || 0), 0)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-500">
            * Products are color-coded by size for easier identification
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleCancelConfirmation}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitConfirmed}
          className="bg-[#0fb493] hover:bg-[#036c57] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={loading}
        >
          {loading ? "Processing..." : "Confirm & Submit"}
        </button>
      </div>
    </div>
  </div>
)}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Lorry Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Lorry*
            </label>
            <select
              name="lorry_id"
              value={formData.lorry_id}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Lorry</option>
              {lorries.map((lorry) => (
                <option key={lorry.lorry_id} value={lorry.lorry_id}>
                  {lorry.lorry_number} - {lorry.driver_name}
                </option>
              ))}
            </select>
          </div>

          {/* Unloaded By */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Unloaded By*
            </label>
            <input
              type="text"
              name="unloaded_by"
              value={formData.unloaded_by}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={noActiveLoading}
            />
          </div>

          {/* Unloading Date */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Unloading Date {lastLoadingData && "(Auto-set from Loading Date)"}
            </label>
            <input
              type="date"
              name="unloading_date"
              value={formData.unloading_date}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={noActiveLoading || lastLoadingData}
            />
            {lastLoadingData && (
              <p className="text-xs text-blue-600 mt-1">
                Date automatically set to match loading date: {new Date(lastLoadingData.loading_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Unloading Time */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Unloading Time
            </label>
            <input
              type="time"
              name="unloading_time"
              value={formData.unloading_time}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={noActiveLoading}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled
            >
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Loading Data Information */}
        {loadingDataLoading && (
          <div className="mb-6">
            <p className="text-gray-700">Loading recent loading data...</p>
          </div>
        )}

        {/* No active loading transaction message */}
        {noActiveLoading && (
          <div className="mb-6 bg-yellow-50 p-4 rounded border border-yellow-200">
            <h3 className="text-lg font-medium mb-2 text-yellow-700">
              No Active Loading Transaction
            </h3>
            <p className="text-gray-700">
              There are no active loading transactions to unload for this lorry.
              The last loading transaction has already been unloaded or no
              loading transaction exists for this lorry.
            </p>
          </div>
        )}

        {lastLoadingData && !noActiveLoading && (
          <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="text-lg font-medium mb-2 text-blue-700">
              Last Loading Information
            </h3>
            <p className="text-gray-700">
              Loaded on:{" "}
              {new Date(lastLoadingData.loading_date).toLocaleDateString()} at{" "}
              {lastLoadingData.loading_time}
            </p>
            <p className="text-gray-700">
              Loaded by: {lastLoadingData.loaded_by}
            </p>
            <p className="text-gray-700">
              Total: {lastLoadingData.totalCases} cases,{" "}
              {lastLoadingData.totalBottles} bottles
            </p>
          </div>
        )}

        {/* Unloading Items */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Unloaded Products</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-2 border-white text-left">
                    Size
                  </th>
                  <th className="py-2 px-4 border-2 border-white text-left">
                    Product Name
                  </th>
                  <th className="py-2 px-4 border-2 border-white text-center">
                    Cases Loaded
                  </th>
                  <th className="py-2 px-4 border-2 border-white text-center">
                    Bottles Loaded
                  </th>
                  <th className="py-2 px-4 border-2 border-white text-center">
                    Cases Unloaded
                  </th>
                  <th className="py-2 px-4 border-2 border-white text-center">
                    Bottles Unloaded
                  </th>
                </tr>
              </thead>
              <tbody>
                {unloadingItems.length > 0 ? (
                  unloadingItems
                    .filter((item) => item.product_id)
                    .sort((a, b) => {
                      const orderA = sizeOrderMap[a.product_size] || 999;
                      const orderB = sizeOrderMap[b.product_size] || 999;
                      return orderA - orderB;
                    })
                    .map((item, index) => (
                      <tr
                        key={index}
                        className={`${
                          item.validationError ? "bg-red-100" : ""
                        } ${
                          item.product_size
                            ? sizeColorMap[item.product_size]
                            : ""
                        }`}
                      >
                        <td className="py-1 px-4 border-2 border-white font-medium">
                          {item.product_size}
                        </td>
                        <td className="py-1 px-4 border-2 border-white">
                          {item.product_name}
                        </td>
                        <td className="py-1 px-4 border-2 border-white text-center">
                          {item.cases_loaded || 0}
                        </td>
                        <td className="py-1 px-4 border-2 border-white text-center">
                          {item.bottles_loaded || 0}
                        </td>
                        <td className="py-1 px-4 border-2 border-white">
                          <input
                            type="number"
                            min="0"
                            value={item.cases_returned}
                            onChange={(e) =>
                              handleUnloadingItemChange(
                                index,
                                "cases_returned",
                                e.target.value
                              )
                            }
                            onWheel={(e) => e.target.blur()} // Prevent scrolling from changing values
                            className="shadow appearance-none border border-gray-300 rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            disabled={noActiveLoading}
                          />
                        </td>
                        <td className="py-1 px-4 border-2 border-white">
                          <input
                            type="number"
                            min="0"
                            value={item.bottles_returned}
                            onChange={(e) =>
                              handleUnloadingItemChange(
                                index,
                                "bottles_returned",
                                e.target.value
                              )
                            }
                            onWheel={(e) => e.target.blur()} // Prevent scrolling from changing values
                            className="shadow appearance-none border border-gray-300 rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            disabled={noActiveLoading}
                          />
                          {item.validationError && (
                            <p className="text-red-500 text-xs mt-1">
                              {item.validationError}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-gray-500">
                      No products available for unloading.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-500">
              * Products are color-coded by size for easier identification
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="bg-[#0fb493] hover:bg-[#036c57] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading || noActiveLoading}
            >
              {loading ? "Processing..." : "Review Unloading Transaction"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewUnloadingForm;