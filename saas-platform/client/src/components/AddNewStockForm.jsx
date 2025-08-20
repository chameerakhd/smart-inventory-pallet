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

const AddNewStockForm = ({ onInventoryAdded }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    cases_qty: 0,
    bottles_qty: 0,
    total_bottles: 0,
    total_value: 0,
    notes: "",
  });

  // State for separate product name and size selections
  const [selectedProductName, setSelectedProductName] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Lists for dropdowns
  const [productNames, setProductNames] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // Selected product details for calculation
  const [selectedProduct, setSelectedProduct] = useState(null);

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

      // Reset form data related to product
      setFormData((prev) => ({
        ...prev,
        product_id: "",
        cases_qty: 0,
        bottles_qty: 0,
        total_bottles: 0,
        total_value: 0,
      }));
    } else {
      setAvailableSizes([]);
      setSelectedSize("");
    }
  }, [selectedProductName, products]);

  // Handle product name selection change
  const handleProductNameChange = (e) => {
    const productName = e.target.value;
    setSelectedProductName(productName);
  };

  // Handle size selection change
  const handleSizeChange = (e) => {
    const size = e.target.value;
    setSelectedSize(size);

    if (selectedProductName && size) {
      // Find matching product
      const product = products.find(
        (p) => p.product_name === selectedProductName && p.size === size
      );

      if (product) {
        setSelectedProduct(product);
        setFormData({
          ...formData,
          product_id: product.product_id.toString(),
          cases_qty: 0,
          bottles_qty: 0,
          total_bottles: 0,
          total_value: 0,
          notes: "",
        });
      } else {
        setSelectedProduct(null);
        setError("No matching product found");
      }
    } else {
      setSelectedProduct(null);
    }
  };

  // Normalize quantities - convert bottles to cases when needed
  const normalizeQuantities = (casesQty, bottlesQty, bottlesPerCase) => {
    let finalCases = parseInt(casesQty) || 0;
    let finalBottles = parseInt(bottlesQty) || 0;

    // If bottles exceeds bottles per case, convert to additional cases
    if (finalBottles >= bottlesPerCase) {
      const additionalCases = Math.floor(finalBottles / bottlesPerCase);
      finalCases += additionalCases;
      finalBottles = finalBottles % bottlesPerCase;
    }

    return { cases: finalCases, bottles: finalBottles };
  };

  // Calculate total bottles and value when cases or bottles change
  const handleQuantityChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;

    let updatedFormData = {
      ...formData,
      [name]: numValue,
    };

    if (selectedProduct) {
      const bottlesPerCase = selectedProduct.bottles_per_case || 0;

      // Normalize quantities - convert bottles to cases when bottle count exceeds bottles per case
      const { cases, bottles } = normalizeQuantities(
        name === "cases_qty" ? numValue : formData.cases_qty,
        name === "bottles_qty" ? numValue : formData.bottles_qty,
        bottlesPerCase
      );

      // Calculate total bottles
      const totalBottles = cases * bottlesPerCase + bottles;

      // Calculate total value
      const totalValue = totalBottles * selectedProduct.unit_price;

      updatedFormData = {
        ...updatedFormData,
        cases_qty: cases,
        bottles_qty: bottles,
        total_bottles: totalBottles,
        total_value: totalValue,
      };
    }

    setFormData(updatedFormData);
  };

  // Handle notes change
  const handleNotesChange = (e) => {
    setFormData({
      ...formData,
      notes: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product_id) {
      setError("Please select both a product name and size");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage("");

      const response = await axios.post(`${API_URL}/stock-inventory`, formData);

      if (response.status === 201) {
        setSuccessMessage("Stock added successfully!");
        // Reset form
        setFormData({
          product_id: "",
          cases_qty: 0,
          bottles_qty: 0,
          total_bottles: 0,
          total_value: 0,
          notes: "",
        });
        setSelectedProductName("");
        setSelectedSize("");
        setSelectedProduct(null);

        // Call the parent callback to refresh inventory data
        if (onInventoryAdded) {
          onInventoryAdded();
        }
      }
    } catch (err) {
      setError(
        "Failed to add inventory: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded">
      <h2 className="text-xl font-semibold mb-6">Add Stock</h2>

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
                onWheel={(e) => e.target.blur()} // Disable mouse wheel scrolling
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
              {/* Product Details */}
              <div className="col-span-2 p-4 bg-gray-50 rounded-md mb-2">
                <h3 className="font-medium text-gray-700 mb-2">
                  Product Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Unit Price:</span> Rs.
                    {selectedProduct.unit_price.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-500">Bottles per Case:</span>{" "}
                    {selectedProduct.bottles_per_case}
                  </div>
                  <div>
                    <span className="text-gray-500">Selling Price:</span> Rs.
                    {selectedProduct.selling_price.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>{" "}
                    {selectedProduct.size}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Current Stock:</span>{" "}
                    {selectedProduct.cases_qty || 0} cases,{" "}
                    {selectedProduct.bottles_qty || 0} bottles (
                    {selectedProduct.total_bottles || 0} total bottles)
                  </div>
                </div>
              </div>

              {/* Cases Quantity */}
              <div>
                <label
                  htmlFor="cases_qty"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cases to Add
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
                  Loose Bottles to Add
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
                <p className="mt-1 text-xs text-gray-500">
                  Note: When bottle count exceeds bottles per case, it will
                  automatically convert to additional cases.
                </p>
              </div>

              {/* Total Bottles (Calculated) */}
              <div>
                <label
                  htmlFor="total_bottles"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Bottles to Add
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

              {/* Total Value (Calculated) */}
              <div>
                <label
                  htmlFor="total_value"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Value to Add
                </label>
                <input
                  type="number"
                  id="total_value"
                  name="total_value"
                  value={formData.total_value.toFixed(2)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 shadow-sm focus:outline-none"
                  disabled
                />
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transaction Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder="Enter any notes about this stock addition (e.g., delivery reference, supplier)"
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                ></textarea>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="col-span-2 mt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-400 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={
                isLoading ||
                !selectedProduct ||
                (formData.cases_qty === 0 && formData.bottles_qty === 0)
              }
            >
              {isLoading ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewStockForm;
