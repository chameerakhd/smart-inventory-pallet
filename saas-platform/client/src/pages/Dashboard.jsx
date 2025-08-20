import React, { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import axios from "axios";
import {
  CalendarIcon,
  RefreshCcw,
  TrendingUp,
  Package,
  DollarSign,
  Award,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      console.log("User is not an admin. Redirecting...");
      navigate("/loading-management");
    }
  }, [isAdmin, navigate]);
  // Date range state
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Dashboard data states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);

  // Aggregated metrics
  const [overviewMetrics, setOverviewMetrics] = useState({
    sellingBottles: 0,
    saleIncome: 0,
    grossProfit: 0,
  });

  const [inventoryMetrics, setInventoryMetrics] = useState({
    totalBottles: 0,
    totalValue: 0,
  });

  const [expiryReturns, setExpiryReturns] = useState([]);

  // Helper function to format date range display
  const formatDateRange = () => {
    if (!startDate && !endDate) return "All Time";

    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }

    if (startDate) {
      return `From ${startDate.toLocaleDateString()}`;
    }

    return `Until ${endDate.toLocaleDateString()}`;
  };

  // Clear date range function
  const clearDateRange = () => {
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
    setEndDate(new Date());
  };

  useEffect(() => {
    // Set auth token for all axios requests
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch dashboard data using existing APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare date params
        const params = {
          startDate: startDate?.toISOString().split("T")[0],
          endDate:
            endDate?.toISOString().split("T")[0] ||
            new Date().toISOString().split("T")[0],
        };

        // Fetch data using existing API endpoints from InventoryReportsPage
        const [dailySalesRes, stockInventoryRes, expiryRes] = await Promise.all(
          [
            axios.get(`${API_URL}/daily-sales`, { params }),
            axios.get(`${API_URL}/stock-inventory`),
            axios.get(`${API_URL}/expiry-returns`, { params }),
          ]
        );

        // Process sales data for overview metrics
        const salesMetrics = processSalesData(dailySalesRes.data.salesData);
        setOverviewMetrics({
          sellingBottles: salesMetrics.totalBottles,
          saleIncome: salesMetrics.totalIncome,
          grossProfit: salesMetrics.totalProfit,
        });

        // Process monthly data for chart
        setMonthlyData(processMonthlyData(dailySalesRes.data.salesData));

        // Process best selling products
        setBestSellingProducts(
          processBestSellingProducts(dailySalesRes.data.salesData)
        );

        // Process inventory metrics
        const inventory = processInventoryData(stockInventoryRes.data);
        setInventoryMetrics({
          totalBottles: inventory.totalBottles,
          totalValue: inventory.totalValue,
        });

        // Set expiry returns
        setExpiryReturns(expiryRes.data);
      } catch (err) {
        setError("Failed to fetch dashboard data: " + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate]);

  // Process sales data to get overview metrics
  const processSalesData = (data) => {
    return data.reduce(
      (acc, item) => {
        return {
          totalBottles: acc.totalBottles + (item.units_sold || 0),
          totalIncome: acc.totalIncome + (item.sales_income || 0),
          totalProfit: acc.totalProfit + (item.gross_profit || 0),
        };
      },
      { totalBottles: 0, totalIncome: 0, totalProfit: 0 }
    );
  };

  // Process sales data to get monthly income data
  const processMonthlyData = (data) => {
    // Create a map to aggregate data by month
    const monthMap = new Map();
    const profitMap = new Map();

    // Initialize all months with zero
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    months.forEach((month) => {
      monthMap.set(month, 0);
      profitMap.set(month, 0);
    });

    // Aggregate sales by month
    data.forEach((item) => {
      if (item.sales_date) {
        const date = new Date(item.sales_date);
        const month = months[date.getMonth()];

        const currentSales = monthMap.get(month) || 0;
        monthMap.set(month, currentSales + (item.sales_income || 0));

        const currentProfit = profitMap.get(month) || 0;
        profitMap.set(month, currentProfit + (item.gross_profit || 0));
      }
    });

    // Convert map to array for chart
    return months.map((month) => ({
      name: month,
      income: monthMap.get(month) || 0,
      profit: profitMap.get(month) || 0,
    }));
  };

  // Process sales data to get best selling products
  const processBestSellingProducts = (data) => {
    // Create a map to aggregate sales by product
    const productMap = new Map();

    // Aggregate units sold by product
    data.forEach((item) => {
      const key = `${item.product_name}-${item.product_id}`;
      const current = productMap.get(key) || {
        product_id: item.product_id,
        product_name: item.product_name,
        size: item.size || "",
        units_sold: 0,
        sales_income: 0,
      };

      current.units_sold += item.units_sold || 0;
      current.sales_income += item.sales_income || 0;
      productMap.set(key, current);
    });

    // Convert to array and sort by units sold (descending)
    return Array.from(productMap.values())
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, 4); // Get top 4 products
  };

  // Process inventory data
  const processInventoryData = (data) => {
    return data.reduce(
      (acc, item) => {
        return {
          totalBottles: acc.totalBottles + (item.total_bottles || 0),
          totalValue: acc.totalValue + (item.total_value || 0),
        };
      },
      { totalBottles: 0, totalValue: 0 }
    );
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  // Calculate profit percentage
  const calculateProfitPercentage = () => {
    if (!overviewMetrics.saleIncome) return 0;
    return (
      (overviewMetrics.grossProfit / overviewMetrics.saleIncome) *
      100
    ).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-6 flex items-center justify-center">
        <div className="text-lg font-medium text-indigo-700 flex items-center gap-3">
          <RefreshCcw className="animate-spin" size={24} />
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-6 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-xl text-lg font-medium text-red-600 max-w-lg w-full">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
            Sales Dashboard
          </h1>

          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="bg-white border border-indigo-200 rounded-lg py-2 px-4 flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <CalendarIcon size={16} className="text-indigo-500" />
              <span>{formatDateRange()}</span>
            </button>
            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-indigo-100 rounded-lg shadow-xl z-10 p-3">
                <DatePicker
                  selected={startDate}
                  onChange={(dates) => {
                    const [start, end] = dates;
                    setStartDate(start);
                    setEndDate(end);
                    if (start && end) setIsDatePickerOpen(false);
                  }}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  inline
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={clearDateRange}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left section - 3/4 width */}
          <div className="lg:col-span-3 space-y-6 flex flex-col">
            {/* Overview section */}
            <div className="bg-white p-6 rounded-xl shadow-md flex-grow">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-500" />
                Performance Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Selling Bottles */}
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-5 rounded-xl shadow-sm border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 font-medium">Bottles Sold</p>
                      <p className="text-3xl font-bold mt-2">
                        {overviewMetrics.sellingBottles.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-orange-300 p-2 rounded-lg">
                      <Package size={24} className="text-orange-700" />
                    </div>
                  </div>
                </div>

                {/* Sale Income */}
                <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-5 rounded-xl shadow-sm border border-teal-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 font-medium">
                        Total Sale Income
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(overviewMetrics.saleIncome).replace(
                          "LKR",
                          ""
                        )}
                      </p>
                    </div>
                    <div className="bg-teal-300 p-2 rounded-lg">
                      <DollarSign size={24} className="text-teal-700" />
                    </div>
                  </div>
                </div>

                {/* Gross Profit */}
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-5 rounded-xl shadow-sm border border-green-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 font-medium">
                        Total Sale Profit
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(overviewMetrics.grossProfit).replace(
                          "LKR",
                          ""
                        )}
                      </p>
                      <p className="text-sm text-green-700 font-medium mt-1">
                        {calculateProfitPercentage()}% margin
                      </p>
                    </div>
                    <div className="bg-green-300 p-2 rounded-lg">
                      <TrendingUp size={24} className="text-green-700" />
                    </div>
                  </div>
                </div>

                {/* Expiry Value */}
                <div className="bg-gradient-to-br from-red-100 to-red-200 p-5 rounded-xl shadow-sm border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 font-medium">
                        Total Expiry Value
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency(
                          expiryReturns?.summary?.totalExpiryValue
                        ).replace("LKR", "")}
                      </p>
                    </div>
                    <div className="bg-red-300 p-2 rounded-lg">
                      <TrendingUp size={24} className="text-red-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Best Sales */}
            <div className="bg-white p-6 rounded-xl shadow-md flex-grow">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Award size={20} className="text-indigo-500" />
                Top Selling Products
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {bestSellingProducts.length > 0 ? (
                  bestSellingProducts.map((product, index) => (
                    <div
                      key={index}
                      className={`bg-gradient-to-br ${
                        index === 0
                          ? "from-amber-50 to-amber-100 border-amber-200"
                          : index === 1
                          ? "from-slate-50 to-slate-100 border-slate-200"
                          : index === 2
                          ? "from-orange-50 to-orange-100 border-orange-200"
                          : "from-blue-50 to-blue-100 border-blue-200"
                      } p-4 rounded-xl shadow-sm border`}
                    >
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-gray-700 font-medium text-center mb-2">
                          {product.product_name} {product.size}
                        </p>
                        <p className="text-2xl font-bold">
                          {product.units_sold.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">units sold</p>
                        <p className="text-sm font-medium text-indigo-600 mt-2">
                          {formatCurrency(product.sales_income).replace(
                            "LKR",
                            ""
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    No product sales data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right section - 1/4 width */}
          <div className="lg:col-span-1 space-y-6">
            {/* Inventory Overview */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Package size={20} className="text-indigo-500" />
                Inventory Status
              </h2>

              <div className="space-y-5">
                {/* Total Bottles */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-xl text-white shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Total Bottles</p>
                    <div className="bg-blue-200 bg-opacity-20 p-2 rounded-lg">
                      <Package size={20} className="text-blue-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    {inventoryMetrics.totalBottles.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-100 mt-2">
                    Current inventory
                  </p>
                </div>

                {/* Total Value */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 rounded-xl text-white shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Inventory Value</p>
                    <div className="bg-pink-200 bg-opacity-20 p-2 rounded-lg">
                      <DollarSign size={20} className="text-pink-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    {formatCurrency(inventoryMetrics.totalValue).replace(
                      "LKR",
                      ""
                    )}
                  </p>
                  <p className="text-xs text-pink-100 mt-2">
                    Total stock value
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Income Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md mt-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-500" />
              Sale Income & Profit Analysis
            </h2>
          </div>

          <div className="h-80">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis
                    tickFormatter={(value) => `${value / 1000}k`}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      borderRadius: "8px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [`${formatCurrency(value)}`, ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Sale Income"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#4f46e5" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Sale Profit"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 rounded-lg">
                No monthly revenue data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
