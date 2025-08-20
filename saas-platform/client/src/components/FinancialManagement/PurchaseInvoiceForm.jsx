import React, { useState, useEffect } from "react";
import { createPurchaseInvoice, fetchSuppliers } from "../../services/api";
import { X } from "lucide-react";

const PurchaseInvoiceForm = ({ onClose, supplier = null }) => {
  // Set a default due date 30 days from today
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    invoice_number: "",
    supplier_id: supplier ? supplier.supplier_id : "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: defaultDueDate,
    total_amount: "",
    paid_amount: "0",
    status: "unpaid",
    notes: "",
  });

  const [suppliers, setSuppliers] = useState([]);
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
        const suppliersResponse = await fetchSuppliers();
        setSuppliers(suppliersResponse.data || []);
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
          }) will be added as credit for this supplier.`
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
      };

      // Create invoice
      await createPurchaseInvoice(invoiceData);

      setSuccess(true);

      // Reset form
      setFormData({
        invoice_number: "",
        supplier_id: supplier ? supplier.supplier_id : "",
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: defaultDueDate, // Reset to default due date
        total_amount: "",
        paid_amount: "0",
        status: "unpaid",
        notes: "",
      });

      // Close the form after a short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(
        "Failed to create purchase invoice: " +
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
          {supplier
            ? `New Purchase Invoice for Supplier #${supplier.supplier_id}`
            : "New Purchase Invoice"}
        </h2>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Purchase invoice created successfully!
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
              htmlFor="supplier_id"
            >
              Supplier *
            </label>
            <select
              id="supplier_id"
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={supplier}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supp) => (
                <option key={supp.supplier_id} value={supp.supplier_id}>
                  {supp.name}
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

export default PurchaseInvoiceForm;
