import React, { useState, useEffect } from "react";
import {
  fetchTransactions,
  fetchTransactionTypes,
  fetchPaymentMethods,
} from "../../services/api";
import { ArrowUpDown, Filter } from "lucide-react";

const TransactionsList = ({ refreshTrigger, entityType, entityId }) => {
  const [transactions, setTransactions] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("transaction_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filters, setFilters] = useState({
    transaction_type_id: "",
    payment_method_id: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadTransactionsData = async () => {
      try {
        setLoading(true);

        // Fetch reference data
        const [typesResponse, methodsResponse] = await Promise.all([
          fetchTransactionTypes(),
          fetchPaymentMethods(),
        ]);

        setTransactionTypes(typesResponse.data || []);
        setPaymentMethods(methodsResponse.data || []);

        // Prepare params for transaction query
        const params = {
          sortBy: sortField,
          sortOrder: sortDirection,
          ...filters,
        };

        // Add entity filters if provided
        if (entityType === "customer") {
          params.customerId = entityId;
        } else if (entityType === "supplier") {
          params.supplierId = entityId;
        }

        // Fetch transactions with filters
        const transactionsResponse = await fetchTransactions(params);
        setTransactions(transactionsResponse.data || []);
        setError(null);
      } catch (err) {
        setError(
          "Failed to load transactions: " +
            (err.response?.data?.message || err.message)
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactionsData();
  }, [refreshTrigger, entityType, entityId, sortField, sortDirection, filters]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterReset = () => {
    setFilters({
      transaction_type_id: "",
      payment_method_id: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5); // Format as HH:MM
  };

  const getTransactionTypeName = (typeId) => {
    const type = transactionTypes.find((t) => t.type_id === typeId);
    return type ? type.type_name : "Unknown";
  };

  const getPaymentMethodName = (methodId) => {
    const method = paymentMethods.find((m) => m.method_id === methodId);
    return method ? method.name : "Unknown";
  };

  const getFlowDirection = (typeId) => {
    const type = transactionTypes.find((t) => t.type_id === typeId);
    return type ? type.flow_direction : "unknown";
  };

  if (loading && transactions.length === 0)
    return (
      <div className="flex justify-center p-6">Loading transactions...</div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">
          {entityType
            ? `Transactions for ${
                entityType === "customer" ? "Customer" : "Supplier"
              } #${entityId}`
            : "All Transactions"}
        </h2>
        <button
          onClick={handleFilterToggle}
          className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          <Filter size={16} />
          <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                name="transaction_type_id"
                value={filters.transaction_type_id}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Types</option>
                {transactionTypes.map((type) => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                name="payment_method_id"
                value={filters.payment_method_id}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Methods</option>
                {paymentMethods.map((method) => (
                  <option key={method.method_id} value={method.method_id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="minAmount"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={handleFilterChange}
                  className="w-1/2 border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="number"
                  name="maxAmount"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={handleFilterChange}
                  className="w-1/2 border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-1/2 border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-1/2 border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleFilterReset}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("transaction_id")}
              >
                <div className="flex items-center">
                  ID
                  {sortField === "transaction_id" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("transaction_date")}
              >
                <div className="flex items-center">
                  Date/Time
                  {sortField === "transaction_date" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center">
                  Amount
                  {sortField === "amount" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr
                  key={transaction.transaction_id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.transaction_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(transaction.transaction_date)}
                    <div className="text-xs text-gray-500">
                      {formatTime(transaction.transaction_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.reference_number || "-"}
                    {transaction.reference_document && (
                      <div className="text-xs text-blue-500">
                        {transaction.reference_document}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {getTransactionTypeName(transaction.transaction_type_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={
                        getFlowDirection(transaction.transaction_type_id) ===
                        "in"
                          ? "text-green-600"
                          : getFlowDirection(
                              transaction.transaction_type_id
                            ) === "out"
                          ? "text-red-600"
                          : "text-gray-600"
                      }
                    >
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentMethodName(transaction.payment_method_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`capitalize px-2 py-1 rounded-full text-xs ${
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsList;
