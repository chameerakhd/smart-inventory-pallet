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

const AdjustStockForm = ({ inventoryData, onStockAdjusted }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Predefined reasons for the dropdown
  const adjustmentReasons = [
    "Damaged / Gas out items",
    "Counting error",
    "Stock entered incorrectly",
    "Gifted / Personal use",
    "Inventory audit adjustment",
    "Internal use for sampling",
    "Other",
  ];

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    adjustment_type: "increase", // increase or decrease
    cases_qty: 0,
    bottles_qty: 0,
    total_bottles: 0,
    reason: "",
    custom_reason: "",
  });

  // State for separate product name and size selections
  const [selectedProductName, setSelectedProductName] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Lists for dropdowns
  const [productNames, setProductNames] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // Selected product details for calculation
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentStock, setCurrentStock] = useState(null);

  // Fetch all products for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data);

        // Extract unique product names
        const uniqueNames = [
          ...new Set(response.data.map((p) => p.product_name)),
        ].sort();
        setProductNames(uniqueNames);
      } catch (err) {
        setError("Failed to fetch products");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Update available sizes when product name changes
  useEffect(() => {
    if (selectedProductName) {
      // Filter products by the selected name
      const filteredProducts = products.filter(
        (p) => p.product_name === selectedProductName
      );

      // Define the custom size order
      const sizeOrder = {
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

      // Extract unique sizes for this product name
      const sizes = [...new Set(filteredProducts.map((p) => p.size))].sort(
        (a, b) => {
          // If both sizes are in the sizeOrder object, sort by their order value
          if (sizeOrder[a] !== undefined && sizeOrder[b] !== undefined) {
            return sizeOrder[a] - sizeOrder[b];
          }
          // If only one size is in the order, prioritize the one that is
          else if (sizeOrder[a] !== undefined) {
            return -1;
          } else if (sizeOrder[b] !== undefined) {
            return 1;
          }
          // If neither size is in the order, maintain alphabetical sorting
          else {
            return a.localeCompare(b);
          }
        }
      );

      setAvailableSizes(sizes);

      // Reset size selection and selected product
      setSelectedSize("");
      setSelectedProduct(null);
      setCurrentStock(null);

      // Reset form data related to product
      setFormData((prev) => ({
        ...prev,
        product_id: "",
        cases_qty: 0,
        bottles_qty: 0,
        total_bottles: 0,
        reason: "",
        custom_reason: "",
      }));

      // Clear error when changing product name
      setError(null);
    } else {
      setAvailableSizes([]);
      setSelectedSize("");
    }
  }, [selectedProductName, products]);

  // Handle product name selection change
  const handleProductNameChange = (e) => {
    const productName = e.target.value;
    setSelectedProductName(productName);
    setError(null); // Clear any existing errors
  };

  // Handle size selection change
  const handleSizeChange = (e) => {
    const size = e.target.value;
    setSelectedSize(size);
    setError(null); // Clear any existing errors

    if (selectedProductName && size) {
      // Find matching product
      const product = products.find(
        (p) => p.product_name === selectedProductName && p.size === size
      );

      if (product) {
        setSelectedProduct(product);

        // Find current stock for this product in inventory
        let stockItem = null;
        if (inventoryData && Array.isArray(inventoryData)) {
          stockItem = inventoryData.find(
            (item) => item.product_id === product.product_id
          );
        }

        setCurrentStock(stockItem || null);

        // Update form data with the selected product_id
        setFormData((prevData) => ({
          ...prevData,
          product_id: product.product_id,
          cases_qty: 0,
          bottles_qty: 0,
          total_bottles: 0,
          reason: "",
          custom_reason: "",
        }));
      } else {
        setSelectedProduct(null);
        setCurrentStock(null);
        setError("No matching product found");

        // Clear product_id in form data
        setFormData((prevData) => ({
          ...prevData,
          product_id: "",
        }));
      }
    } else {
      setSelectedProduct(null);
      setCurrentStock(null);

      // Clear product_id in form data
      setFormData((prevData) => ({
        ...prevData,
        product_id: "",
      }));
    }
  };

  // Handle adjustment type change
  const handleAdjustmentTypeChange = (e) => {
    setFormData({
      ...formData,
      adjustment_type: e.target.value,
      cases_qty: 0,
      bottles_qty: 0,
      total_bottles: 0,
    });
  };

  // Calculate total bottles when cases or bottles change
  const handleQuantityChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;

    let updatedFormData = {
      ...formData,
      [name]: numValue,
    };

    if (selectedProduct) {
      // Calculate total bottles
      const bottlesPerCase = selectedProduct.bottles_per_case || 0;
      const totalBottles =
        updatedFormData.cases_qty * bottlesPerCase +
        updatedFormData.bottles_qty;

      updatedFormData = {
        ...updatedFormData,
        total_bottles: totalBottles,
      };
    }

    setFormData(updatedFormData);
  };

  // Handle reason change
  const handleReasonChange = (e) => {
    setFormData({
      ...formData,
      reason: e.target.value,
      // Reset custom reason if not "Other"
      custom_reason: e.target.value === "Other" ? formData.custom_reason : "",
    });
  };

  // Debug function to check what's happening with state
  useEffect(() => {
    // This will help debug state changes in the console
    console.log("Selected product ID:", formData.product_id);
    console.log("Selected product:", selectedProduct);
  }, [formData.product_id, selectedProduct]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Add validation for product selection
    if (!selectedProduct || !formData.product_id) {
      setError("Please select both a product name and size");
      return;
    }

    if (
      (formData.cases_qty === 0 && formData.bottles_qty === 0) ||
      formData.total_bottles === 0
    ) {
      setError("Please specify a quantity to adjust");
      return;
    }

    if (!formData.reason.trim()) {
      setError("Please select a reason for the adjustment");
      return;
    }

    if (formData.reason === "Other" && !formData.custom_reason.trim()) {
      setError("Please provide a custom reason for the adjustment");
      return;
    }

    // Validate that we're not trying to decrease more than what's in stock
    if (formData.adjustment_type === "decrease" && currentStock) {
      const currentTotalBottles =
        (currentStock.cases_qty || 0) *
          (selectedProduct?.bottles_per_case || 0) +
        (currentStock.bottles_qty || 0);

      if (formData.total_bottles > currentTotalBottles) {
        setError("Cannot decrease more than current stock");
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage("");

      // Prepare adjustment data
      const adjustmentData = {
        product_id: formData.product_id,
        cases_qty: formData.cases_qty,
        bottles_qty: formData.bottles_qty,
        total_bottles: formData.total_bottles,
        adjustment_type: formData.adjustment_type,
        reason:
          formData.reason === "Other"
            ? formData.custom_reason
            : formData.reason,
        total_value: formData.total_bottles * selectedProduct.unit_price,
      };

      console.log("Sending adjustment data:", adjustmentData);

      const response = await axios.put(
        `${API_URL}/stock-inventory/adjustments`,
        adjustmentData
      );

      if (response.status === 201 || response.status === 200) {
        setSuccessMessage("Stock adjusted successfully!");
        // Reset form
        setFormData({
          product_id: "",
          adjustment_type: "increase",
          cases_qty: 0,
          bottles_qty: 0,
          total_bottles: 0,
          reason: "",
          custom_reason: "",
        });
        setSelectedProductName("");
        setSelectedSize("");
        setSelectedProduct(null);
        setCurrentStock(null);

        // Call the parent callback to refresh inventory data
        if (onStockAdjusted) {
          onStockAdjusted();
        }
      }
    } catch (err) {
      setError(
        "Failed to adjust inventory: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded">
      <h2 className="text-xl font-semibold mb-6">Adjust Stock</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name Selection */}
          <div>
            <label
              htmlFor="product_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Product Name
            </label>
            <div className="relative">
              <select
                id="product_name"
                name="product_name"
                value={selectedProductName}
                onChange={handleProductNameChange}
                className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Select a product name</option>
                {productNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
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

          {/* Size Selection */}
          <div>
            <label
              htmlFor="size"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Size
            </label>
            <div className="relative">
              <select
                id="size"
                name="size"
                value={selectedSize}
                onChange={handleSizeChange}
                className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={
                  isLoading ||
                  !selectedProductName ||
                  availableSizes.length === 0
                }
              >
                <option value="">Select a size</option>
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
          </div>

          {selectedProduct && (
            <>
              {/* Current Stock Details */}
              <div className="col-span-2 p-4 bg-gray-50 rounded-md mb-2">
                <h3 className="font-medium text-gray-700 mb-2">
                  Current Stock
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Product:</span>{" "}
                    {selectedProductName} ({selectedSize})
                  </div>
                  <div>
                    <span className="text-gray-500">Bottles per Case:</span>{" "}
                    {selectedProduct.bottles_per_case}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Current Stock:</span>{" "}
                    {selectedProduct ? (
                      <>
                        {selectedProduct.cases_qty || 0} cases,{" "}
                        {selectedProduct.bottles_qty || 0} bottles (
                        {selectedProduct.total_bottles || 0} total bottles)
                      </>
                    ) : (
                      "No current stock"
                    )}
                  </div>
                </div>
              </div>

              {/* Adjustment Type */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="adjustment_type"
                      value="increase"
                      checked={formData.adjustment_type === "increase"}
                      onChange={handleAdjustmentTypeChange}
                      className="form-radio h-4 w-4 text-green-600"
                    />
                    <span className="ml-2">Increase Stock</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="adjustment_type"
                      value="decrease"
                      checked={formData.adjustment_type === "decrease"}
                      onChange={handleAdjustmentTypeChange}
                      className="form-radio h-4 w-4 text-red-600"
                    />
                    <span className="ml-2">Decrease Stock</span>
                  </label>
                </div>
              </div>

              {/* Cases Quantity */}
              <div>
                <label
                  htmlFor="cases_qty"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cases to{" "}
                  {formData.adjustment_type === "increase" ? "Add" : "Remove"}
                </label>
                <input
                  type="number"
                  id="cases_qty"
                  name="cases_qty"
                  min="0"
                  value={formData.cases_qty}
                  onChange={handleQuantityChange}
                  onWheel={(e) => e.target.blur()}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Bottles Quantity */}
              <div>
                <label
                  htmlFor="bottles_qty"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Loose Bottles to{" "}
                  {formData.adjustment_type === "increase" ? "Add" : "Remove"}
                </label>
                <input
                  type="number"
                  id="bottles_qty"
                  name="bottles_qty"
                  min="0"
                  value={formData.bottles_qty}
                  onChange={handleQuantityChange}
                  onWheel={(e) => e.target.blur()}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Total Bottles (Calculated) */}
              <div className="col-span-2">
                <label
                  htmlFor="total_bottles"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Bottles to{" "}
                  {formData.adjustment_type === "increase" ? "Add" : "Remove"}
                </label>
                <input
                  type="number"
                  id="total_bottles"
                  name="total_bottles"
                  value={formData.total_bottles}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 shadow-sm focus:outline-none"
                  disabled
                />
              </div>

              {/* Reason Dropdown */}
              <div className="col-span-2">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Reason for Adjustment *
                </label>
                <div className="relative">
                  <select
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleReasonChange}
                    className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                    required
                  >
                    <option value="">Select a reason</option>
                    {adjustmentReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
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
                {formData.reason === "Other" && (
                  <textarea
                    id="custom_reason"
                    name="custom_reason"
                    rows="2"
                    className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please specify the reason"
                    value={formData.custom_reason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        custom_reason: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    required
                  ></textarea>
                )}
              </div>

              {/* Submit Button */}
              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    formData.adjustment_type === "increase"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    formData.adjustment_type === "increase"
                      ? "focus:ring-green-500"
                      : "focus:ring-red-500"
                  }`}
                  disabled={
                    isLoading ||
                    !selectedProduct ||
                    (formData.cases_qty === 0 && formData.bottles_qty === 0) ||
                    !formData.reason.trim() ||
                    (formData.reason === "Other" &&
                      !formData.custom_reason?.trim())
                  }
                >
                  {isLoading
                    ? "Processing..."
                    : `${
                        formData.adjustment_type === "increase"
                          ? "Increase"
                          : "Decrease"
                      } Stock`}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdjustStockForm;
