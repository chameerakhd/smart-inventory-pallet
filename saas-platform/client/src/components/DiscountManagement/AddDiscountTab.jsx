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

const AddDiscountTab = ({ shops, lorries, onAddDiscount }) => {
  // Existing state variables
  const [selectedLorry, setSelectedLorry] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [maxDiscountedCases, setMaxDiscountedCases] = useState(0);
  const [shopDetails, setShopDetails] = useState(null);
  const [subDiscountTypes, setSubDiscountTypes] = useState([]);
  const [shopDiscountValues, setShopDiscountValues] = useState([]);
  const [selectedShopType, setSelectedShopType] = useState("");
  const [addedDiscounts, setAddedDiscounts] = useState([]);
  const [totalDiscountedCases, setTotalDiscountedCases] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [shopMonthlyDiscounts, setShopMonthlyDiscounts] = useState([]);
  const [availableCases, setAvailableCases] = useState(0);
  const [discountInputs, setDiscountInputs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [shopSearchTerm, setShopSearchTerm] = useState("");

  // Reset form
  const resetForm = () => {
    setSelectedLorry("");
    setInvoiceNumber("");
    setSelectedDate("");
    setSelectedTime("");
    setSelectedShop("");
    setIsShopDropdownOpen(false);
    setShopSearchTerm("");
    setSelectedShopType("");
    setAddedDiscounts([]);
    setTotalDiscountedCases(0);
    setDiscountInputs({});
  };

  // Fetch current Coca-Cola month
  useEffect(() => {
    const fetchCurrentMonth = async () => {
      try {
        const response = await axios.get(`${API_URL}/coca-cola-months/current`);
        setCurrentMonth(response.data);
      } catch (err) {
        console.error("Failed to fetch current Coca-Cola month:", err);
        setStatus({
          type: "error",
          message: "Failed to fetch current month details.",
        });
      }
    };

    fetchCurrentMonth();
  }, []);

  // Fetch sub discount types when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const discountTypesResponse = await axios.get(
          `${API_URL}/sub-discount-types`
        );
        setSubDiscountTypes(discountTypesResponse.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  // When shop selection changes, fetch the shop details and current month discounts
  useEffect(() => {
    if (!selectedShop) {
      setShopDetails(null);
      setMaxDiscountedCases(0);
      setSelectedShopType("");
      setShopDiscountValues([]);
      setAddedDiscounts([]);
      setTotalDiscountedCases(0);
      setShopMonthlyDiscounts([]);
      setAvailableCases(0);
      setDiscountInputs({});
      return;
    }

    const getShopDetails = async () => {
      try {
        // Get shop details
        const shopResponse = await axios.get(
          `${API_URL}/shops/${selectedShop}`
        );

        if (shopResponse.data) {
          const shopData = shopResponse.data;
          setShopDetails(shopData);
          setMaxDiscountedCases(shopData.max_discounted_cases || 0);
          setSelectedShopType(shopData.discount_type);

          // Set shop discount values
          if (
            shopData.shopDiscountValues &&
            shopData.shopDiscountValues.length > 0
          ) {
            setShopDiscountValues(shopData.shopDiscountValues);

            // Initialize discount inputs with zero cases
            const initialInputs = {};
            shopData.shopDiscountValues.forEach((value) => {
              initialInputs[value.sub_discount_type_id] = "";
            });
            setDiscountInputs(initialInputs);
          }

          setAddedDiscounts([]);
          setTotalDiscountedCases(0);

          // Get discounts already used in current month
          if (currentMonth) {
            const discountsResponse = await axios.get(
              `${API_URL}/discounts/shop/${selectedShop}`
            );

            setShopMonthlyDiscounts(discountsResponse.data);

            // Calculate available cases
            const usedCases = discountsResponse.data.reduce(
              (total, discount) => total + parseInt(discount.discounted_cases),
              0
            );

            setAvailableCases(
              Math.max(0, shopData.max_discounted_cases - usedCases)
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch shop details:", err);
        setStatus({
          type: "error",
          message: "Failed to fetch shop details or discount usage.",
        });
      }
    };

    getShopDetails();
  }, [selectedShop, currentMonth]);

  // Handle discount input change
  const handleDiscountInputChange = (typeId, value) => {
    setDiscountInputs({
      ...discountInputs,
      [typeId]: value,
    });
  };

  // Add all discount items to the list
  const addAllDiscountItems = () => {
    // Check if any cases are entered
    let hasCases = false;
    let totalCases = 0;

    // Create new discounts array
    const newDiscounts = [];

    for (const [typeId, casesValue] of Object.entries(discountInputs)) {
      if (casesValue && parseFloat(casesValue) > 0) {
        hasCases = true;
        const casesNum = parseFloat(casesValue);
        totalCases += casesNum;

        // Find the discount details
        const discountValue = shopDiscountValues.find(
          (value) => value.sub_discount_type_id.toString() === typeId
        );

        if (discountValue) {
          newDiscounts.push({
            sub_discount_type_id: typeId,
            sub_discount_type:
              discountValue.subDiscountType?.sub_discount_name || "Unknown",
            discount_amount: discountValue.discount_value,
            discounted_cases: casesNum,
          });
        }
      }
    }

    if (!hasCases) {
      setStatus({
        type: "error",
        message: "Please enter cases for at least one discount type",
      });
      return;
    }

    // Check if adding these cases exceeds the available cases
    if (totalCases > availableCases) {
      setStatus({
        type: "error",
        message: `Adding ${totalCases} cases would exceed available cases (${availableCases})`,
      });
      return;
    }

    setAddedDiscounts(newDiscounts);
    setTotalDiscountedCases(totalCases);
    setStatus({ type: "", message: "" });
  };

  // Remove a discount item
  const removeDiscountItem = (index) => {
    const updatedDiscounts = [...addedDiscounts];
    const removedCases = parseFloat(updatedDiscounts[index].discounted_cases);
    updatedDiscounts.splice(index, 1);

    setAddedDiscounts(updatedDiscounts);
    setTotalDiscountedCases(totalDiscountedCases - removedCases);
  };

// Filter shops based on search term
const filteredShops = shops.filter(shop =>
  shop.shop_name.toLowerCase().includes(shopSearchTerm.toLowerCase()) ||
  (shop.discountType?.discount_name || "").toLowerCase().includes(shopSearchTerm.toLowerCase())
);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (
      !selectedLorry ||
      !invoiceNumber ||
      !selectedDate ||
      !selectedTime ||
      !selectedShop ||
      addedDiscounts.length === 0
    ) {
      setStatus({
        type: "error",
        message:
          "Please fill in all required fields and add at least one discount",
      });
      setIsSubmitting(false);
      return;
    }

    // Check if date is within current month
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);

    if (currentMonth) {
      const monthStart = new Date(currentMonth.start_date);
      const monthEnd = new Date(currentMonth.end_date);

      if (selectedDateTime < monthStart || selectedDateTime > monthEnd) {
        setStatus({
          type: "error",
          message: `Selected date must be within current month: ${monthStart.toLocaleDateString()} to ${monthEnd.toLocaleDateString()}`,
        });
        setIsSubmitting(false);
        return;
      }
    } else {
      setStatus({
        type: "error",
        message:
          "No current month defined. Please set up a Coca-Cola month first.",
      });
      setIsSubmitting(false);
      return;
    }

    // Prepare discount items array
    const discountItems = addedDiscounts.map((discount) => ({
      sub_discount_type_id: discount.sub_discount_type_id,
      discounted_cases: discount.discounted_cases,
    }));

    // Prepare the request payload with all discounts
    const discountData = {
      shop_id: selectedShop,
      lorry_id: selectedLorry,
      selling_date: `${selectedDate}T${selectedTime}`,
      invoice_number: invoiceNumber,
      discountItems: discountItems,
    };

    try {
      // Call the new API endpoint that handles multiple discount items
      const response = await axios.post(`${API_URL}/discounts`, discountData);

      setStatus({
        type: "success",
        message: `All discounts added successfully! Created ${response.data.count} discount items.`,
      });
      resetForm();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred while adding discounts";
      setStatus({
        type: "error",
        message: errorMsg,
      });
      console.error("Error submitting discounts:", error);
    } finally {
      setIsSubmitting(false);
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
      <h2 className="text-xl font-semibold mb-4">Add New Discount</h2>

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

      {/* Current Month Display */}
      {currentMonth && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <h3 className="text-md font-medium text-blue-800 mb-1">
            Current Coca-Cola Month
          </h3>
          <p className="text-sm text-blue-600">
            {formatDate(currentMonth.start_date)} to{" "}
            {formatDate(currentMonth.end_date)}
          </p>
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

        {/* Lorry Selection */}
        <div className="mb-4">
          <label
            htmlFor="lorry"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Lorry
          </label>
          <select
            id="lorry"
            value={selectedLorry}
            onChange={(e) => setSelectedLorry(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a lorry</option>
            {lorries.map((lorry) => (
              <option key={lorry.lorry_id} value={lorry.lorry_id}>
                {lorry.lorry_number} - {lorry.driver_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Selling Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Time
            </label>
            <input
              type="time"
              id="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Invoice Number */}
        <div className="mb-4">
          <label
            htmlFor="invoice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Invoice Number
          </label>
          <input
            type="text"
            id="invoice"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Discount Types and Cases Input */}
        {shopDiscountValues.length > 0 && (
          <div className="mb-4 border border-gray-200 rounded-md p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Available Discount Types</h3>

            <div className="mb-3">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Discount Type
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount (LKR)
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Cases
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shopDiscountValues.map((value) => (
                    <tr key={value.sub_discount_type_id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {value.subDiscountType?.sub_discount_name || "Unknown"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                        {value.discount_value}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            discountInputs[value.sub_discount_type_id] || ""
                          }
                          onChange={(e) =>
                            handleDiscountInputChange(
                              value.sub_discount_type_id,
                              e.target.value
                            )
                          }
                          className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={addAllDiscountItems}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add All Discount Items
                </button>
              </div>
            </div>

            {/* Added Discount Items */}
            {addedDiscounts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">
                  Added Discount Items:
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Discount Type
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Cases
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {addedDiscounts.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.sub_discount_type}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            LKR {item.discount_amount}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {item.discounted_cases}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            LKR {item.discount_amount * item.discounted_cases}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeDiscountItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td
                          className="px-4 py-2 text-sm font-medium"
                          colSpan="2"
                        >
                          Total
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-right">
                          {totalDiscountedCases.toFixed(1)}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-right">
                          LKR{" "}
                          {addedDiscounts.reduce(
                            (sum, item) =>
                              sum +
                              item.discount_amount * item.discounted_cases,
                            0
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={addedDiscounts.length === 0}
          >
            Add Discount
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDiscountTab;
