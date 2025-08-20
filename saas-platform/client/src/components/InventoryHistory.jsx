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

// Predefined transaction note categories
const NOTE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  //{ value: "unloading", label: "Unloading Transaction" },
  { value: "loading", label: "Loading / Unloading Transaction" },
  { value: "counting", label: "Counting Error" },
  { value: "damage", label: "Damaged / Gas out items" },
  { value: "incorrect", label: "Stock entered incorrectly" },
  { value: "personal", label: "Gifted / Personal use" },
  { value: "audit", label: "Inventory audit adjustment" },
  { value: "sample", label: "Internal use for sampling" },
  { value: "custom", label: "New Stock Add" }
];

const InventoryHistory = () => {
  // Product selection states
  const [products, setProducts] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Transaction filtering states
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedNoteCategory, setSelectedNoteCategory] = useState("all");
  const [customNoteSearch, setCustomNoteSearch] = useState("");
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data);
        
        // Extract unique product names and sizes
        const names = [...new Set(response.data.map(p => p.product_name))];
        setProductNames(names);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Update available sizes when product name changes
  useEffect(() => {
    if (selectedProductName) {
      const sizes = [
        ...new Set(
          products
            .filter(p => p.product_name === selectedProductName)
            .map(p => p.size)
            .filter(size => size) // Filter out null/undefined sizes
        )
      ];
      setProductSizes(sizes);
      
      // Reset size selection if current selection is not available
      if (selectedSize && !sizes.includes(selectedSize)) {
        setSelectedSize("");
      }
    } else {
      setProductSizes([]);
      setSelectedSize("");
    }
  }, [selectedProductName, products]);

  // Update product ID when name and size are selected
  useEffect(() => {
    if (selectedProductName) {
      let filteredProducts = products.filter(p => p.product_name === selectedProductName);
      
      if (selectedSize) {
        filteredProducts = filteredProducts.filter(p => p.size === selectedSize);
      }
      
      if (filteredProducts.length === 1) {
        setSelectedProductId(filteredProducts[0].product_id);
      } else if (filteredProducts.length > 1 && !selectedSize) {
        // If multiple products with same name but different sizes, don't select any
        setSelectedProductId(null);
      } else {
        setSelectedProductId(null);
      }
    } else {
      setSelectedProductId(null);
    }
  }, [selectedProductName, selectedSize, products]);

  // Fetch transactions when a product is selected
  useEffect(() => {
    if (!selectedProductId) {
      setTransactions([]);
      setFilteredTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_URL}/stock-inventory/history/${selectedProductId}`
        );
        setTransactions(response.data);
        setFilteredTransactions(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch transaction history");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedProductId]);

  // Filter transactions based on date range and note category
  useEffect(() => {
    if (!transactions.length) return;
    
    let filtered = [...transactions];
    
    // Filter by date range
    if (startDate) {
      const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => 
        new Date(t.transaction_date).getTime() >= startDateTime
      );
    }
    
    if (endDate) {
      const endDateTime = new Date(endDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => 
        new Date(t.transaction_date).getTime() <= endDateTime
      );
    }
    
    // Filter by note category
// Filter by note category
if (selectedNoteCategory !== "all") {
  if (selectedNoteCategory === "custom") {
    if (customNoteSearch) {
      // For custom search, show notes that match the search term
      filtered = filtered.filter(t => {
        const note = (t.notes || "").toLowerCase();
        return note.includes(customNoteSearch.toLowerCase());
      });
    } else {
      // If custom is selected but no search term entered, show notes that don't match standard categories
      filtered = filtered.filter(t => {
        const note = (t.notes || "").toLowerCase();
        return t.notes && !["unloading", "loading", "counting error", "damaged / gas out items", "stock entered incorrectly", "gifted / personal use", "inventory audit adjustment", "internal use for sampling"].some(category => 
          note.includes(category)
        );
      });
    }
  } else {
    // For standard categories, match the specific category
    const categoryMapping = {
      "unloading": "unloading",
      "loading": "loading",
      "counting": "counting error",
      "damage": "damaged / gas out items",
      "incorrect": "stock entered incorrectly",
      "personal": "gifted / personal use",
      "audit": "inventory audit adjustment",
      "sample": "internal use for sampling",
    };
    
    const targetCategory = categoryMapping[selectedNoteCategory];
    filtered = filtered.filter(t => {
      const note = (t.notes || "").toLowerCase();
      // Match if it contains the target category
      return note.includes(targetCategory);
    });
  }
}
    
    setFilteredTransactions(filtered);
  }, [transactions, startDate, endDate, selectedNoteCategory, customNoteSearch]);

  // Reset filters
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedNoteCategory("all");
    setCustomNoteSearch("");
    setFilteredTransactions(transactions);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Product selection section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Select Product</h2>

        {isLoadingProducts ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Product Name Dropdown */}
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <div className="relative">
                <select
                  id="product-name"
                  className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedProductName}
                  onChange={(e) => setSelectedProductName(e.target.value)}
                  onWheel={(e) => e.target.blur()}
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


            {/* Size Dropdown - Only enabled if product name is selected */}
            <div>
              <label htmlFor="product-size" className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <div className="relative">
                <select
                  id="product-size"
                  className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  disabled={!selectedProductName || productSizes.length === 0}
                  onWheel={(e) => e.target.blur()}
                >
                  <option value="">All Sizes</option>
                  {productSizes.map((size) => (
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
              
            </div>
          )}

        {selectedProductId && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                Selected Product: <span className="font-semibold">{selectedProductName}</span>
                {selectedSize && <span> (Size: {selectedSize})</span>}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Filters */}
      {selectedProductId && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Filter Transactions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range - Start Date */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="start-date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Date Range - End Date */}
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="end-date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Note Category Dropdown */}
            <div>
              <label htmlFor="note-category" className="block text-sm font-medium text-gray-700 mb-1">
                Note Category
              </label>
              <div className="relative">
                <select
                  id="note-category"
                  className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedNoteCategory}
                  onChange={(e) => setSelectedNoteCategory(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                >
                  {NOTE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
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


            {/* Custom Note Search - Only visible if "Custom" is selected */}
            {selectedNoteCategory === "custom" && (
              <div>
                <label htmlFor="custom-note" className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Note Search
                </label>
                <input
                  type="text"
                  id="custom-note"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search notes..."
                  value={customNoteSearch}
                  onChange={(e) => setCustomNoteSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md border border-gray-300 mr-2"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Transaction history section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {!selectedProductId ? (
          <div className="text-center py-12">
            <svg
              className="h-12 w-12 text-gray-400 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Transaction History
            </h3>
            <p className="text-gray-600">
              Select a product above to view its transaction history
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transaction history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-lg mx-auto">
              <p className="font-bold">Error</p>
              <p>{error}</p>
              <button
                className="mt-2 bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
                onClick={() => handleProductSelect(selectedProductId)} // Retry fetch
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="h-12 w-12 text-gray-400 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Transactions Found
            </h3>
            <p className="text-gray-600">
              {transactions.length === 0 
                ? "This product has no recorded transaction history" 
                : "No transactions match your current filters"}
            </p>
            {transactions.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <h3 className="text-lg font-medium p-4 bg-gray-50 border-b">
              Transaction History: {selectedProductName}
              {selectedSize && ` (Size: ${selectedSize})`}
            </h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cases
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bottles
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Bottles
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.transaction_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-1 font-medium rounded-full ${
                          transaction.transaction_type === "ADD"
                            ? "bg-green-100 text-green-800"
                            : transaction.transaction_type === "REMOVE"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {transaction.cases_qty}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {transaction.bottles_qty}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {transaction.total_bottles}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      Rs.{" "}
                      {parseFloat(transaction.total_value).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>
                    <td className="px-6 py-2 text-sm text-gray-500 max-w-md truncate">
                      {transaction.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="7" className="px-6 py-2 text-sm text-gray-500">
                    {filteredTransactions.length} transaction
                    {filteredTransactions.length !== 1 ? "s" : ""} found
                    {filteredTransactions.length !== transactions.length && (
                      <span> (filtered from {transactions.length} total)</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistory;