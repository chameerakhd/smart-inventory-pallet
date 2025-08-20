import React, { useState, useEffect } from "react";
import {
  processCustomerCreditPayment,
  fetchPaymentMethods,
} from "../../services/api";
import { X } from "lucide-react";

const CustomerCreditPaymentForm = ({
  customer,
  onClose,
  onPaymentComplete,
}) => {
  const [formData, setFormData] = useState({
    amount: "",
    payment_method_id: 1,
    description: `Credit payment for ${customer?.name || "customer"}`,
    reference_number: Math.floor(Math.random() * 1000000),
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load payment methods when component mounts
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setDataLoading(true);
        const response = await fetchPaymentMethods();
        setPaymentMethods(response.data || []);
      } catch (err) {
        setError(
          "Failed to load payment methods: " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setDataLoading(false);
      }
    };

    loadPaymentMethods();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "amount"
          ? parseFloat(value) || ""
          : name === "payment_method_id"
          ? parseInt(value)
          : value,
    }));

    // Reset success/error messages on form change
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.amount || formData.amount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure amount is not greater than customer's outstanding balance
      if (formData.amount > customer.outstanding_balance) {
        setError(
          `Payment amount cannot exceed customer's outstanding balance of ${customer.outstanding_balance}`
        );
        setLoading(false);
        return;
      }

      // Process the payment
      const response = await processCustomerCreditPayment(
        customer.customer_id,
        formData
      );

      setSuccess(true);
      setFormData({
        ...formData,
        amount: "",
      });

      // Notify parent component that payment was successful
      if (onPaymentComplete) {
        onPaymentComplete(response.data);
      }
    } catch (err) {
      setError(
        "Failed to process payment: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Process Credit Payment
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <div className="mb-4 bg-blue-50 p-3 rounded">
        <p className="font-medium">Customer: {customer.name}</p>
        <p className="text-sm text-gray-600">
          Current Outstanding Balance:{" "}
          <span className="font-semibold text-red-600">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(customer.outstanding_balance || 0)}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {success && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          Payment processed successfully
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="amount"
          >
            Payment Amount *
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            max={customer.outstanding_balance}
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="payment_method_id"
          >
            Payment Method *
          </label>
          <select
            id="payment_method_id"
            name="payment_method_id"
            value={formData.payment_method_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            {dataLoading ? (
              <option value="">Loading payment methods...</option>
            ) : (
              paymentMethods.map((method) => (
                <option key={method.method_id} value={method.method_id}>
                  {method.name}
                </option>
              ))
            )}
          </select>
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
            rows="2"
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
            name="reference_number"
            type="text"
            value={formData.reference_number}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || dataLoading}
          >
            {loading ? "Processing..." : "Process Payment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerCreditPaymentForm;
