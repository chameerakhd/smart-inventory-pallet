import React, { useState, useEffect } from "react";
import { fetchTransactions } from "../../services/api";

const CreditTransactionsTable = ({ accountId, refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!accountId) return;

      try {
        setLoading(true);
        const response = await fetchTransactions({
          bank_account_id: accountId,
          limit: 50,
          sortBy: "transaction_date",
          sortOrder: "desc",
        });
        setTransactions(response.data);
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

    loadTransactions();
  }, [accountId, refreshTrigger]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!accountId)
    return (
      <div className="text-gray-500 p-4">
        Select an account to view transactions
      </div>
    );
  if (loading)
    return (
      <div className="flex justify-center p-6">Loading transactions...</div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="overflow-x-auto rounded-lg shadow mt-4">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reference
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
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
              <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.transaction_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(transaction.transaction_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.reference_number || "N/A"}
                </td>
                <td className="px-6 py-4">{transaction.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={
                      transaction.transactionType?.flow_direction === "in"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatCurrency(transaction.amount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {transaction.transactionType?.type_name || "Unknown"}
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
  );
};

export default CreditTransactionsTable;
