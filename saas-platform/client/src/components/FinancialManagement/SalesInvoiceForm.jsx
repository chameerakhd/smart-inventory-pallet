import React, { useState, useEffect } from "react";
import {
  createSalesInvoice,
  fetchCustomers,
  fetchLorries,
  fetchPaymentMethods,
} from "../../services/api";
import { X } from "lucide-react";

const SalesInvoiceForm = ({ onClose, customer = null }) => {
  // Set a default due date 30 days from today
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    invoice_number: "",
    customer_id: customer ? customer.customer_id : "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: defaultDueDate,
    total_amount: "",
    paid_amount: "0",
    status: "unpaid",
    notes: "",
    lorry_id: "",
    payment_method_id: "", // New field for transaction type
  });

  const [customers, setCustomers] = useState([]);
  const [lorries, setLorries] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setDataLoading(true);
        const [customersResponse, lorriesResponse, transactionTypesResponse] =
          await Promise.all([
            fetchCustomers(),
            fetchLorries(),
            fetchPaymentMethods(),
          ]);

        setCustomers(customersResponse.data || []);
        setLorries(lorriesResponse.data || []);

        // Filter transaction types for sales invoice - only "in" and "transfer" types
        const allowedTypes = transactionTypesResponse.data;
        setTransactionTypes(allowedTypes);

        setError(null);
      } catch (err) {
        setError(
          "Failed to load reference data: " +
            (err.response?.data?.message || err.message)
        );
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "total_amount" || name === "paid_amount"
          ? parseFloat(value) || ""
          : value,
    }));

    // Reset success/error messages on form change
    setSuccess(false);
    setError(null);

    // Check for overpayment and set warning
    if (name === "paid_amount" || name === "total_amount") {
      const totalAmount =
        name === "total_amount"
          ? parseFloat(value) || 0
          : parseFloat(formData.total_amount) || 0;

      const paidAmount =
        name === "paid_amount"
          ? parseFloat(value) || 0
          : parseFloat(formData.paid_amount) || 0;

      if (paidAmount > totalAmount && totalAmount > 0) {
        setWarning(
          `The paid amount (${paidAmount}) exceeds the invoice total (${totalAmount}). The excess payment (${
            paidAmount - totalAmount
          }) will be added as credit for this customer.`
        );
      } else {
        setWarning(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Ensure due_date is not null
      if (!formData.due_date) {
        setError("Due date is required");
        setLoading(false);
        return;
      }

      // Validate transaction type if there's a paid amount
      if (parseFloat(formData.paid_amount) > 0 && !formData.payment_method_id) {
        setError(
          "Transaction type is required when payment amount is provided"
        );
        setLoading(false);
        return;
      }

      // Calculate balance
      const balance =
        parseFloat(formData.total_amount) -
        parseFloat(formData.paid_amount || 0);

      // Prepare invoice data
      const invoiceData = {
        ...formData,
        due_date: formData.due_date || defaultDueDate, // Ensure due_date is never null
        total_amount: parseFloat(formData.total_amount),
        paid_amount: parseFloat(formData.paid_amount || 0),
        balance: balance,
        payment_method_id: formData.payment_method_id || null,
      };

      // Create invoice
      await createSalesInvoice(invoiceData);

      setSuccess(true);

      // Reset form
      setFormData({
        invoice_number: "",
        customer_id: customer ? customer.customer_id : "",
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: defaultDueDate, // Reset to default due date
        total_amount: "",
        paid_amount: "0",
        status: "unpaid",
        notes: "",
        lorry_id: "",
        payment_method_id: "",
      });

      // Close the form after a short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(
        "Failed to create sales invoice: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading)
    return <div className="flex justify-center p-6">Loading form data...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {customer
            ? `New Sales Invoice for Customer #${customer.customer_id}`
            : "New Sales Invoice"}
        </h2>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Sales invoice created successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {warning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {warning}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="invoice_number"
            >
              Invoice Number *
            </label>
            <input
              id="invoice_number"
              name="invoice_number"
              type="text"
              value={formData.invoice_number}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="INV-00001"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="customer_id"
            >
              Customer *
            </label>
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={customer}
            >
              <option value="">Select Customer</option>
              {customers.map((cust) => (
                <option key={cust.customer_id} value={cust.customer_id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="invoice_date"
            >
              Invoice Date *
            </label>
            <input
              id="invoice_date"
              name="invoice_date"
              type="date"
              value={formData.invoice_date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="due_date"
            >
              Due Date *
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="total_amount"
            >
              Total Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                id="total_amount"
                name="total_amount"
                type="number"
                value={formData.total_amount}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 pl-7 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="paid_amount"
            >
              Paid Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                id="paid_amount"
                name="paid_amount"
                type="number"
                value={formData.paid_amount}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 pl-7 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Transaction Type Field - Show only if there's a paid amount */}
        {parseFloat(formData.paid_amount) > 0 && (
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="payment_method_id"
            >
              Transaction Type *
            </label>
            <select
              id="payment_method_id"
              name="payment_method_id"
              value={formData.payment_method_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required={parseFloat(formData.paid_amount) > 0}
            >
              <option value="">Select Transaction Type</option>
              {transactionTypes.map((type) => (
                <option key={type.method_id} value={type.method_id}>
                  {type.name} - {type.description}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="status"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partially paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="lorry_id"
            >
              Delivery Lorry
            </label>
            <select
              id="lorry_id"
              name="lorry_id"
              value={formData.lorry_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select Lorry (Optional)</option>
              {lorries.map((lorry) => (
                <option key={lorry.lorry_id} value={lorry.lorry_id}>
                  {lorry.lorry_number} - {lorry.driver_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="notes"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Additional notes..."
            rows="3"
          />
        </div>

        <div className="flex items-center justify-end mt-8 space-x-3">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesInvoiceForm;
