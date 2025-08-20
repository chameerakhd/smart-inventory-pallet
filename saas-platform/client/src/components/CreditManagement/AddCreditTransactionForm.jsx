import React, { useState, useEffect } from "react";
import { createCreditTransaction } from "../../services/api";

const AddCreditTransactionForm = ({ onTransactionAdded, selectedAccount }) => {
  const [formData, setFormData] = useState({
    bank_account_id: "",
    amount: "",
    description: "",
    transaction_type_id: 1, // This should be replaced with actual type IDs from backend
    payment_method_id: 1, // This should be replaced with actual payment method IDs from backend
    reference_number: Math.floor(Math.random() * 1000000), // Generate a random reference number
    transaction_date: new Date().toISOString().split("T")[0],
    transaction_time: new Date().toTimeString().split(" ")[0],
    status: "completed",
  });

  const transactionTypes = [
    { type_id: 1, type_name: "Deposit", flow_direction: "in" },
    { type_id: 2, type_name: "Withdrawal", flow_direction: "out" },
    // Add more types as needed
  ];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Update form when selectedAccount changes
  useEffect(() => {
    if (selectedAccount) {
      setFormData((prev) => ({
        ...prev,
        bank_account_id: selectedAccount.account_id,
      }));
    }
  }, [selectedAccount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "amount" ||
        name === "transaction_type_id" ||
        name === "payment_method_id"
          ? parseFloat(value)
          : value,
    });

    // Reset success and error messages when form changes
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Format data for API
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await createCreditTransaction(transactionData);

      // Reset form
      setFormData({
        ...formData,
        amount: "",
        description: "",
        reference_number: Math.floor(Math.random() * 1000000),
      });

      setSuccess(true);

      // Notify parent component
      if (onTransactionAdded) {
        onTransactionAdded();
      }
    } catch (err) {
      setError(
        "Failed to add transaction: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add Bank Transaction</h2>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Transaction added successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="transaction_type_id"
            >
              Transaction Type
            </label>
            <select
              id="transaction_type_id"
              name="transaction_type_id"
              value={formData.transaction_type_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {transactionTypes.map((type) => (
                <option key={type.type_id} value={type.type_id}>
                  {type.type_name} (
                  {type.flow_direction === "in" ? "Credit" : "Debit"})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="amount"
            >
              Amount
            </label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            placeholder="Transaction description"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="reference_number"
          >
            Reference Number
          </label>
          <input
            id="reference_number"
            type="text"
            name="reference_number"
            value={formData.reference_number}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Reference number"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="transaction_date"
          >
            Transaction Date
          </label>
          <input
            id="transaction_date"
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCreditTransactionForm;
