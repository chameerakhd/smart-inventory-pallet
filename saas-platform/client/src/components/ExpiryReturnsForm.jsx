import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const ExpiryReturnsForm = ({ selectedLorry }) => {
  // States
  const [lorry, setLorry] = useState(null);
  const [products, setProducts] = useState([]);
  const [returnDate, setReturnDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [expiryItems, setExpiryItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [bottlesExpired, setBottlesExpired] = useState("");
  const [expiryValue, setExpiryValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch lorries and find the specific lorry
  useEffect(() => {
    if (!selectedLorry) {
      setError("Select a lorry to proceed");
      return;
    }
    const fetchLorries = async () => {
      try {
        const response = await axios.get(`${API_URL}/lorries`);

        // Find the lorry that matches the lorryId
        const matchingLorry = response.data.find(
          (lorry) => lorry.lorry_id === parseInt(selectedLorry)
        );

        if (matchingLorry) {
          setLorry(matchingLorry);
          setError("");
        } else {
          setError("Lorry not found with the provided ID");
        }
      } catch (err) {
        console.error("Failed to fetch lorries:", err);
        setError("Failed to fetch lorry details. Please try again.");
      }
    };

    fetchLorries();
  }, [selectedLorry]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data);

        // Get unique product names
        const uniqueProductNames = [
          ...new Set(response.data.map((product) => product.product_name)),
        ];
        setAvailableProducts(uniqueProductNames);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to fetch products. Please try again.");
      }
    };

    fetchProducts();
  }, []);

  // Derived state for unique product names
  const [availableProducts, setAvailableProducts] = useState([]);

  // Update available sizes when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      const sizes = products
        .filter((product) => product.product_name === selectedProduct)
        .map((product) => product.size);

      setAvailableSizes(sizes);
      setSelectedSize(""); // Reset size when product changes
    } else {
      setAvailableSizes([]);
    }
  }, [selectedProduct, products]);

  // Get product ID based on selected product name and size
  const getProductId = () => {
    if (selectedProduct && selectedSize) {
      const product = products.find(
        (p) => p.product_name === selectedProduct && p.size === selectedSize
      );
      return product ? product.product_id : null;
    }
    return null;
  };

  // Add expiry item to the list
  const handleAddItem = () => {
    const productId = getProductId();

    if (!productId) {
      setError("Please select both product and size");
      return;
    }

    if (
      !bottlesExpired ||
      isNaN(bottlesExpired) ||
      parseInt(bottlesExpired) <= 0
    ) {
      setError("Please enter a valid number of bottles");
      return;
    }

    if (!expiryValue || isNaN(expiryValue) || parseFloat(expiryValue) <= 0) {
      setError("Please enter a valid expiry value");
      return;
    }

    // Check if product is already in the list
    const existingItemIndex = expiryItems.findIndex(
      (item) => item.product_id === productId
    );

    if (existingItemIndex >= 0) {
      setError("This product is already added to the list");
      return;
    }

    // const productDetail = products.find((p) => p.product_id === productId);

    const newItem = {
      product_id: productId,
      product_name: selectedProduct,
      product_size: selectedSize,
      bottles_expired: parseInt(bottlesExpired),
      expiry_value: parseFloat(expiryValue),
    };

    setExpiryItems([...expiryItems, newItem]);
    setSelectedProduct("");
    setSelectedSize("");
    setBottlesExpired("");
    setExpiryValue("");
    setError("");
  };

  // Remove item from the list
  const handleRemoveItem = (productId) => {
    setExpiryItems(expiryItems.filter((item) => item.product_id !== productId));
  };

  // Calculate totals
  const totalBottles = expiryItems.reduce(
    (sum, item) => sum + item.bottles_expired,
    0
  );
  const totalValue = expiryItems
    .reduce((sum, item) => sum + item.expiry_value, 0)
    .toFixed(2);

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (expiryItems.length === 0) {
      setError("Please add at least one expiry item");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const expiryReturnsDetails = expiryItems.map((item) => ({
        product_id: item.product_id,
        bottles_expired: item.bottles_expired,
        expiry_value: item.expiry_value,
      }));

      const payload = {
        return_date: returnDate,
        lorry_id: parseInt(selectedLorry),
        expiryReturnsDetails,
      };

      await axios.post(`${API_URL}/expiry-returns`, payload);

      setSuccessMessage("Expiry return created successfully!");

      // Redirect after success message is shown
      // setTimeout(() => {
      //   navigate("/expiry-returns");
      // }, 2000);
    } catch (err) {
      console.error("Error creating expiry return:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create expiry return. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Create Expiry Return</h1>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4"
          role="alert"
        >
          <p>{successMessage}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Lorry Details</h2>
            {lorry ? (
              <div>
                <p>
                  <span className="font-medium">Lorry Number:</span>{" "}
                  {lorry.lorry_number}
                </p>
                <p>
                  <span className="font-medium">Driver:</span>{" "}
                  {lorry.driver_name}
                </p>
              </div>
            ) : (
              <p>Loading lorry details...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Add Expired Products</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Product</option>
                {availableProducts.map((productName) => (
                  <option key={productName} value={productName}>
                    {productName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!selectedProduct}
              >
                <option value="">Select Size</option>
                {availableSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottles Expired
              </label>
              <input
                type="number"
                value={bottlesExpired}
                onChange={(e) => setBottlesExpired(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Value
              </label>
              <input
                type="number"
                value={expiryValue}
                onChange={(e) => setExpiryValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md w-full"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {expiryItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Expired Items</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Bottles Expired
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Expiry Value
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expiryItems.map((item) => (
                    <tr key={item.product_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product_size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.bottles_expired}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.expiry_value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan="2"
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                    >
                      Totals
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {totalBottles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {totalValue}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || expiryItems.length === 0}
            className={`bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md ${
              isSubmitting || expiryItems.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Expiry Return"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiryReturnsForm;
