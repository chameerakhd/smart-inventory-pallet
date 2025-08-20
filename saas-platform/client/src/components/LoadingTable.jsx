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

const LoadingTable = ({ selectedLorry, dateRange }) => {
  const [loadingData, setLoadingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoadingId, setSelectedLoadingId] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchLoadingData = async () => {
      try {
        setIsLoading(true);

        // Build query params
        const params = new URLSearchParams();
        if (selectedLorry) params.append("lorryId", selectedLorry);
        if (dateRange.startDate)
          params.append("startDate", dateRange.startDate);
        if (dateRange.endDate) params.append("endDate", dateRange.endDate);
        params.append("limit", 20); // Or any number you want

        // Changed from /loading-transactions/recent to /loading-transactions
        const response = await axios.get(
          `${API_URL}/loading-transactions?${params.toString()}`
        );

        setLoadingData(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch loading transactions");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoadingData();
  }, [selectedLorry, dateRange]);

  // Modify your fetchLoadingDetails function to include product information
  const fetchLoadingDetails = async (loadingId) => {
    try {
      setIsLoadingDetails(true);
      setSelectedLoadingId(loadingId);

      // Get loading details
      const detailsResponse = await axios.get(
        `${API_URL}/loading-details/transaction/${loadingId}`
      );

      // If loading details don't include product information, we need to fetch products
      const details = detailsResponse.data;

      // Check if we need to fetch product information (if the first item doesn't have product)
      if (details.length > 0 && !details[0].product) {
        // Get unique product IDs from the loading details
        const productIds = [
          ...new Set(details.map((detail) => detail.product_id)),
        ];

        // Fetch product information for these IDs
        const productPromises = productIds.map((id) =>
          axios.get(`${API_URL}/products/${id}`)
        );

        // Wait for all product requests to complete
        const productResponses = await Promise.all(productPromises);

        // Create a map of product IDs to product objects
        const productMap = {};
        productResponses.forEach((response) => {
          const product = response.data;
          productMap[product.product_id] = product;
        });

        // Add product information to each detail
        const detailsWithProducts = details.map((detail) => ({
          ...detail,
          product: productMap[detail.product_id] || null,
        }));

        setLoadingDetails(detailsWithProducts);
      } else {
        // If products are already included, just use the response as is
        setLoadingDetails(details);
      }

      setShowDetailsModal(true);
    } catch (err) {
      console.error("Failed to fetch loading details:", err);
      alert("Failed to fetch loading details. Please try again.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedLoadingId(null);
    setLoadingDetails([]);
  };

  if (isLoading)
    return <div className="text-center py-4">Loading transactions...</div>;
  if (error)
    return <div className="text-center py-4 text-red-500">{error}</div>;
  if (loadingData.length === 0)
    return (
      <div className="text-center py-4">No loading transactions found</div>
    );

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lorry
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loaded By
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loadingData.map((transaction) => (
              <tr key={transaction.loading_id} className="hover:bg-gray-50">
                <td className="py-2 px-4 text-sm text-gray-900">
                  {transaction.loading_id}
                </td>
                <td className="py-2 px-4 text-sm text-gray-900">
                  {transaction.lorry?.lorry_number || "N/A"}
                </td>
                <td className="py-2 px-4 text-sm text-gray-900">
                  {new Date(transaction.loading_date).toLocaleDateString()}
                </td>
                <td className="py-2 px-4 text-sm text-gray-900">
                  {transaction.loading_time}
                </td>
                <td className="py-2 px-4 text-sm text-gray-900">
                  {transaction.loaded_by}
                </td>
                <td className="py-2 px-4 text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      transaction.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm text-gray-900">
                  {transaction.loadingDetails?.length || 0} products
                </td>
                <td className="py-2 px-4 text-sm text-gray-500 flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => fetchLoadingDetails(transaction.loading_id)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Loading Details - ID: {selectedLoadingId}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeModal}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="text-center py-8">Loading details...</div>
            ) : loadingDetails.length === 0 ? (
              <div className="text-center py-8">No loading details found</div>
            ) : (
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cases Loaded
                    </th>
                    <th className="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bottles Loaded
                    </th>
                    <th className="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Bottles
                    </th>
                    {/* <th className="py-2 px-4 border-b text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inventory Value
                    </th> */}
                    <th className="py-2 px-4 border-b text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingDetails.map((detail, index) => {
                    console.log(`Detail at index ${index}:`, detail);
                    return (
                      <tr
                        key={detail.loading_detail_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-2 px-4 text-sm text-gray-900 whitespace-nowrap">
                          {detail.product
                            ? detail.product.product_name
                            : `Missing product (ID: ${detail.product_id})`}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900 whitespace-nowrap">
                          {detail.product
                            ? detail.product.size
                            : `Missing product (ID: ${detail.product_id})`}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900 text-center">
                          {detail.cases_loaded}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900 text-center">
                          {detail.bottles_loaded}
                        </td>
                        <td className="py-2 px-4 text-sm text-gray-900 text-center">
                          {detail.total_bottles_loaded}
                        </td>
                        {/* <td className="py-2 px-4 text-sm text-gray-900 text-right">
                          {detail.value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td> */}
                        <td className="py-2 px-4 text-sm text-gray-900 text-right">
                          {(
                            detail.total_bottles_loaded *
                            detail.product.selling_price
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Summary row */}
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={2}
                      className="py-2 px-4 text-sm font-semibold text-gray-900 text-right"
                    >
                      Totals:
                    </td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 text-center">
                      {loadingDetails
                        .reduce((sum, detail) => sum + detail.cases_loaded, 0)
                        .toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 text-center">
                      {loadingDetails
                        .reduce((sum, detail) => sum + detail.bottles_loaded, 0)
                        .toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 text-center">
                      {loadingDetails
                        .reduce(
                          (sum, detail) => sum + detail.total_bottles_loaded,
                          0
                        )
                        .toLocaleString()}
                    </td>
                    {/* <td className="py-2 px-4 text-sm font-semibold text-gray-900 text-right">
                      LKR&nbsp;
                      {loadingDetails
                        .reduce((sum, detail) => sum + detail.value, 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </td> */}
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 text-right">
                      LKR&nbsp;
                      {loadingDetails
                        .reduce(
                          (sum, detail) =>
                            sum +
                            detail.total_bottles_loaded *
                              detail.product.selling_price,
                          0
                        )
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingTable;
