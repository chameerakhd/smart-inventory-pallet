import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import OverviewTab from "../components/DiscountManagement/DiscountManagement";
import AddDiscountTab from "../components/DiscountManagement/AddDiscountTab";
import SetDiscountTab from "../components/DiscountManagement/SetDiscountTab";
import AddDiscountShopTab from "../components/DiscountManagement/AddDiscountShopTab";
import DiscountHistoryTab from "../components/DiscountManagement/DiscountHistoryTab";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const DiscountManagementPage = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [lorries, setLorries] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  const tabs = [
    "Overview",
    "Add Discount",
    "Set Discount",
    "Add Discount Shop",
    "Discount History", // Added new tab
  ];

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabs.includes(tabParam.replace(/-/g, " "))) {
      setActiveTab(tabParam.replace(/-/g, " "));
    }
  }, [searchParams]);

  // Fetch all required data when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // Fetch shops
        const shopsResponse = await axios.get(`${API_URL}/shops`);
        setShops(shopsResponse.data);

        // Fetch lorries
        const lorriesResponse = await axios.get(`${API_URL}/lorries`);
        setLorries(lorriesResponse.data);

        // Fetch existing discounts
        const discountsResponse = await axios.get(`${API_URL}/discounts`);
        setDiscounts(discountsResponse.data);

        setError(null);
      } catch (err) {
        setError("Failed to fetch initial data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Function to refresh all data
  const refreshData = async () => {
    try {
      setIsLoading(true);

      // Refresh shops
      const shopsResponse = await axios.get(`${API_URL}/shops`);
      setShops(shopsResponse.data);

      // Refresh lorries
      const lorriesResponse = await axios.get(`${API_URL}/lorries`);
      setLorries(lorriesResponse.data);

      // Refresh existing discounts
      const discountsResponse = await axios.get(`${API_URL}/discounts`);
      setDiscounts(discountsResponse.data);

      setError(null);
    } catch (err) {
      setError("Failed to refresh data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new shop
  const handleAddShop = async (shopData) => {
    try {
      await axios.post(`${API_URL}/shops`, shopData);
      // await refreshData();
      return { success: true };
    } catch (err) {
      console.error("Failed to add shop:", err);
      return { success: false, error: err.message };
    }
  };

  // Set discount for a shop
  const handleSetDiscount = async (discountData) => {
    try {
      await axios.post(`${API_URL}/shops/discounts`, discountData);
      return { success: true };
    } catch (err) {
      console.error("Failed to set discount:", err);
      return { success: false, error: err.message };
    }
  };

  // Add a discount for a lorry
  const handleAddDiscount = async (discountData) => {
    try {
      await axios.post(`${API_URL}/discounts`, discountData);
      await refreshData();
      return { success: true };
    } catch (err) {
      console.error("Failed to add discount:", err);
      return { success: false, error: err.message };
    }
  };

  return (
    <div className="mx-auto p-4">
      <div className="border-b-2 border-gray-200">
        <nav className="flex flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`py-3 px-6 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center py-6">Loading data...</div>
      ) : (
        <div className="mt-6">
          {activeTab === "Overview" && (
            <OverviewTab shops={shops} discounts={discounts} />
          )}

          {activeTab === "Add Discount" && (
            <AddDiscountTab
              shops={shops}
              lorries={lorries}
              onAddDiscount={handleAddDiscount}
            />
          )}

          {activeTab === "Set Discount" && (
            <SetDiscountTab shops={shops} onSetDiscount={handleSetDiscount} />
          )}

          {activeTab === "Add Discount Shop" && (
            <AddDiscountShopTab onAddShop={handleAddShop} />
          )}

          {activeTab === "Discount History" && (
            <DiscountHistoryTab shops={shops} />
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountManagementPage;
