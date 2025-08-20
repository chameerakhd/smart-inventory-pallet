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

const EmptyReturnsForm = ({ selectedLorry }) => {
  // States
  const [lorry, setLorry] = useState(null);
  const [products, setProducts] = useState([]);
  const [returnDate, setReturnDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [emptyReturnItems, setEmptyReturnItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [emptyBottlesReturned, setEmptyBottlesReturned] = useState("");
  const [emptyCasesReturned, setEmptyCasesReturned] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Derived state for unique product names
  const [availableProducts, setAvailableProducts] = useState([]);

  // Fetch lorries and find the specific lorry
  useEffect(() => {
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

  // Add empty return item to the list
  const handleAddItem = () => {
    const productId = getProductId();

    if (!productId) {
      setError("Please select both product and size");
      return;
    }

    if (
      !emptyBottlesReturned ||
      isNaN(emptyBottlesReturned) ||
      parseInt(emptyBottlesReturned) < 0
    ) {
      setError("Please enter a valid number of empty bottles");
      return;
    }

    if (
      !emptyCasesReturned ||
      isNaN(emptyCasesReturned) ||
      parseInt(emptyCasesReturned) < 0
    ) {
      setError("Please enter a valid number of empty cases");
      return;
    }

    // Ensure at least one field has a value greater than zero
    if (
      parseInt(emptyBottlesReturned) === 0 &&
      parseInt(emptyCasesReturned) === 0
    ) {
      setError("Please enter at least some bottles or cases returned");
      return;
    }

    // Check if product is already in the list
    const existingItemIndex = emptyReturnItems.findIndex(
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
      empty_bottles_returned: parseInt(emptyBottlesReturned),
      empty_cases_returned: parseInt(emptyCasesReturned),
    };

    setEmptyReturnItems([...emptyReturnItems, newItem]);
    setSelectedProduct("");
    setSelectedSize("");
    setEmptyBottlesReturned("");
    setEmptyCasesReturned("");
    setError("");
  };

  // Remove item from the list
  const handleRemoveItem = (productId) => {
    setEmptyReturnItems(
      emptyReturnItems.filter((item) => item.product_id !== productId)
    );
  };

  // Calculate totals
  const totalEmptyBottles = emptyReturnItems.reduce(
    (sum, item) => sum + item.empty_bottles_returned,
    0
  );

  const totalEmptyCases = emptyReturnItems.reduce(
    (sum, item) => sum + item.empty_cases_returned,
    0
  );

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (emptyReturnItems.length === 0) {
      setError("Please add at least one empty return item");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const details = emptyReturnItems.map((item) => ({
        product_id: item.product_id,
        empty_bottles_returned: item.empty_bottles_returned,
        empty_cases_returned: item.empty_cases_returned,
      }));

      const payload = {
        return_date: returnDate,
        lorry_id: parseInt(selectedLorry),
        details,
      };

      await axios.post(`${API_URL}/empty-returns`, payload);

      setSuccessMessage("Empty return created successfully!");

      // Redirect after success message is shown
      // setTimeout(() => {
      //   navigate("/empty-returns");
      // }, 2000);
    } catch (err) {
      console.error("Error creating empty return:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create empty return. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Create Empty Return</h1>

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
          <h2 className="text-lg font-semibold mb-3">Add Empty Return Items</h2>

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
                Empty Bottles Returned
              </label>
              <input
                type="number"
                value={emptyBottlesReturned}
                onChange={(e) => setEmptyBottlesReturned(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empty Cases Returned
              </label>
              <input
                type="number"
                value={emptyCasesReturned}
                onChange={(e) => setEmptyCasesReturned(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0"
                min="0"
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

        {emptyReturnItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Empty Return Items</h2>

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
                      Empty Bottles
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Empty Cases
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
                  {emptyReturnItems.map((item) => (
                    <tr key={item.product_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.product_size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.empty_bottles_returned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.empty_cases_returned}
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
                      {totalEmptyBottles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {totalEmptyCases}
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
            disabled={isSubmitting || emptyReturnItems.length === 0}
            className={`bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md ${
              isSubmitting || emptyReturnItems.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Empty Return"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyReturnsForm;
