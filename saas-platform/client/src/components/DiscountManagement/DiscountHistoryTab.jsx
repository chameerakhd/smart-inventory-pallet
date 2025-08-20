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

const DiscountHistoryTab = ({ shops }) => {
  const [selectedShop, setSelectedShop] = useState("");
  const [discountHistory, setDiscountHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [shopSearchTerm, setShopSearchTerm] = useState("");
  const [groupedDiscounts, setGroupedDiscounts] = useState({});
  const [summary, setSummary] = useState({
    totalCases: 0,
    totalAmount: 0,
    totalInvoices: 0,
    byDiscountType: {},
  });

  // Fetch discount history when shop is selected
  const fetchDiscountHistory = async () => {
    if (!selectedShop) {
      setError("Please select a shop first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let url = `${API_URL}/discounts/shop/${selectedShop}`;

      // If date range is specified, add query parameters
      if (startDate && endDate) {
        // Format dates properly for API request
        const formattedStartDate = startDate + "T00:00:00";
        const formattedEndDate = endDate + "T23:59:59";

        url = `${url}?startDate=${encodeURIComponent(
          formattedStartDate
        )}&endDate=${encodeURIComponent(formattedEndDate)}`;
      }

      const response = await axios.get(url);

      // If date filtering is needed on frontend due to backend limitations
      let history = response.data;

      // Client-side filtering if needed
      if (startDate && endDate) {
        const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
        const endDateTime = new Date(endDate).setHours(23, 59, 59, 999);

        history = history.filter((discount) => {
          const discountDate = new Date(discount.selling_date).getTime();
          return discountDate >= startDateTime && discountDate <= endDateTime;
        });
      }

      setDiscountHistory(history);

      // Group discounts by invoice number and date
      const grouped = {};
      history.forEach((discount) => {
        const key = `${discount.invoice_number}-${discount.selling_date}`;
        if (!grouped[key]) {
          grouped[key] = {
            invoice_number: discount.invoice_number,
            selling_date: discount.selling_date,
            lorry_name:
              discount.lorry?.lorry_number +
              " - " +
              discount.lorry?.driver_name,
            items: [],
          };
        }
        grouped[key].items.push(discount);
      });

      setGroupedDiscounts(grouped);
      calculateSummary(history, grouped);
    } catch (err) {
      console.error("Failed to fetch discount history:", err);
      setError("Failed to load discount history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
      // Filter shops based on search term
    const filteredShops = shops.filter(shop =>
      shop.shop_name.toLowerCase().includes(shopSearchTerm.toLowerCase()) ||
      (shop.discountType?.discount_name || "").toLowerCase().includes(shopSearchTerm.toLowerCase())
    );

  // Calculate overall summary
  const calculateSummary = (discounts, grouped) => {
    const summary = {
      totalCases: 0,
      totalAmount: 0,
      totalInvoices: Object.keys(grouped).length,
      byDiscountType: {},
    };

    discounts.forEach((discount) => {
      const cases = parseFloat(discount.discounted_cases || 0);
      const amount = parseFloat(discount.total_discount || 0);
      const discountTypeName =
        discount.subDiscountType?.sub_discount_name || "Unknown";

      // Add to totals
      summary.totalCases += cases;
      summary.totalAmount += amount;

      // Group by discount type
      if (!summary.byDiscountType[discountTypeName]) {
        summary.byDiscountType[discountTypeName] = {
          cases: 0,
          amount: 0,
        };
      }

      summary.byDiscountType[discountTypeName].cases += cases;
      summary.byDiscountType[discountTypeName].amount += amount;
    });

    setSummary(summary);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate totals for an invoice group
  const calculateTotals = (items) => {
    return items.reduce(
      (totals, item) => {
        return {
          cases: totals.cases + parseFloat(item.discounted_cases || 0),
          amount: totals.amount + parseFloat(item.total_discount || 0),
        };
      },
      { cases: 0, amount: 0 }
    );
  };

  return (
    <div className="max-w-full">
      <h2 className="text-xl font-semibold mb-4">Discount History</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-800">{error}</div>
      )}

      <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
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
                {shop.shop_name}
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

          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date (optional)
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date (optional)
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={fetchDiscountHistory}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading || !selectedShop}
          >
            {isLoading ? "Loading..." : "View History"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading discount history...</p>
        </div>
      ) : (
        <div>
          {selectedShop && discountHistory.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left side - Invoice Details */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-medium mb-3">
                  {
                    shops.find(
                      (shop) =>
                        shop.shop_id.toString() === selectedShop.toString()
                    )?.shop_name
                  }{" "}
                  - Discount History
                  {startDate && endDate && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({startDate} to {endDate})
                    </span>
                  )}
                </h3>

                {/* Display grouped invoices */}
                {Object.keys(groupedDiscounts).length > 0 ? (
                  <div className="space-y-6">
                    {Object.values(groupedDiscounts).map((group, index) => {
                      const totals = calculateTotals(group.items);

                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-md overflow-hidden shadow-sm"
                        >
                          <div className="bg-gray-100 px-4 py-3 flex flex-wrap justify-between items-center">
                            <div className="font-medium">
                              Invoice: {group.invoice_number}
                            </div>
                            <div className="text-gray-600">
                              {formatDate(group.selling_date)}
                            </div>
                            <div className="text-gray-600">
                              Lorry: {group.lorry_name}
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Discount Type
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cases
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Discount (LKR)
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {group.items.map((discount, itemIndex) => (
                                  <tr key={itemIndex}>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {discount.subDiscountType
                                        ?.sub_discount_name || "Unknown"}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                      {discount.discounted_cases}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                      {parseFloat(
                                        discount.total_discount || 0
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50 font-medium">
                                  <td className="px-4 py-2 text-sm">Total</td>
                                  <td className="px-4 py-2 text-sm text-right">
                                    {totals.cases.toFixed(1)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right">
                                    {totals.amount.toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>No discount history found for the selected criteria.</p>
                )}
              </div>

              {/* Right side - Compact Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white p-4 rounded-lg shadow-md sticky top-4 border border-gray-100">
                  <h3 className="text-base font-medium mb-3 pb-2 border-b border-gray-200 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2 text-blue-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                    Shop Summary
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-500 uppercase font-medium mb-1">
                        Invoices
                      </div>
                      <div className="text-xl font-bold text-blue-700">
                        {summary.totalInvoices}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <div className="text-xs text-green-500 uppercase font-medium mb-1">
                        Cases
                      </div>
                      <div className="text-xl font-bold text-green-700">
                        {summary.totalCases.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-500 uppercase font-medium mb-1">
                      Discount
                    </div>
                    <div className="text-xl font-bold text-purple-700">
                      LKR {summary.totalAmount.toFixed(2)}
                    </div>
                  </div>

                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    By Discount Type
                  </h4>

                  <div className="space-y-2">
                    {Object.entries(summary.byDiscountType).map(
                      ([typeName, data], index) => {
                        const percentage =
                          summary.totalAmount > 0
                            ? (data.amount / summary.totalAmount) * 100
                            : 0;
                        return (
                          <div
                            key={index}
                            className="bg-gray-50 p-2 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-sm text-gray-800">
                                {typeName}
                              </div>
                              <div className="text-xs font-bold text-gray-700">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>

                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Cases: {data.cases.toFixed(1)}</span>
                              <span>LKR {data.amount.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            selectedShop && (
              <div className="text-center py-6 text-gray-500">
                No discount history found for this shop.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountHistoryTab;
