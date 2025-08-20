import React, { useState, useEffect } from "react";
import {
  createTransaction,
  fetchTransactionTypes,
  fetchPaymentMethods,
  fetchBankAccounts,
  fetchCashDrawers,
  fetchSalesInvoices,
  fetchPurchaseInvoices,
} from "../../services/api";
import { X } from "lucide-react";

const TransactionForm = ({ onClose, entityType, entityId, invoiceId }) => {
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split("T")[0],
    transaction_time: new Date().toTimeString().substring(0, 5),
    transaction_type_id: "",
    amount: "",
    payment_method_id: "",
    bank_account_id: "",
    cash_drawer_id: "",
    reference_number: "",
    reference_document: "",
    description: "",
    transaction_details: [],
  });

  const [transactionTypes, setTransactionTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashDrawers, setCashDrawers] = useState([]);
  const [entityData, setEntityData] = useState(null);
  const [transactionFlow, setTransactionFlow] = useState("standard"); // standard, invoice_payment, internal_transfer
  const [sourceAccount, setSourceAccount] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setDataLoading(true);
        const [
          typesResponse,
          methodsResponse,
          accountsResponse,
          drawersResponse,
        ] = await Promise.all([
          fetchTransactionTypes(),
          fetchPaymentMethods(),
          fetchBankAccounts(),
          fetchCashDrawers(),
        ]);

        setTransactionTypes(typesResponse.data || []);
        setPaymentMethods(methodsResponse.data || []);
        setBankAccounts(accountsResponse.data || []);
        setCashDrawers(drawersResponse.data || []);

        // Set default payment method if available
        if (methodsResponse.data && methodsResponse.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            payment_method_id: methodsResponse.data[0].method_id,
          }));
          setSelectedMethod(methodsResponse.data[0]);
        }

        // Set default transaction type based on entity
        if (typesResponse.data && typesResponse.data.length > 0) {
          if (entityType === "customer") {
            // Find customer payment transaction type
            const paymentType = typesResponse.data.find(
              (t) =>
                t.type_name.toLowerCase().includes("customer") &&
                t.type_name.toLowerCase().includes("payment")
            );
            if (paymentType) {
              setFormData((prev) => ({
                ...prev,
                transaction_type_id: paymentType.type_id,
              }));
              setTransactionFlow("invoice_payment");

              // If customer and invoiceId are provided, load invoice data
              if (invoiceId) {
                loadInvoiceData("sales", invoiceId);
              }
            }
          } else if (entityType === "supplier") {
            // Find supplier payment transaction type
            const paymentType = typesResponse.data.find(
              (t) =>
                t.type_name.toLowerCase().includes("supplier") &&
                t.type_name.toLowerCase().includes("payment")
            );
            if (paymentType) {
              setFormData((prev) => ({
                ...prev,
                transaction_type_id: paymentType.type_id,
              }));
              setTransactionFlow("invoice_payment");

              // If supplier and invoiceId are provided, load invoice data
              if (invoiceId) {
                loadInvoiceData("purchase", invoiceId);
              }
            }
          } else {
            // Default to standard transaction flow
            setTransactionFlow("standard");
          }

          // Look for internal transfer type to enable that flow option
          const transferType = typesResponse.data.find(
            (t) => t.flow_direction === "transfer"
          );
          if (transferType) {
            // Allow user to select internal transfer flow
            // This will be handled in transaction type change
          }
        }
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
  }, [entityType, invoiceId]);

  // Load invoice data if provided
  const loadInvoiceData = async (invoiceType, id) => {
    try {
      let invoiceData;

      if (invoiceType === "sales") {
        const response = await fetchSalesInvoices({ id });
        invoiceData = response.data[0];
        if (invoiceData) {
          setEntityData({
            ...invoiceData,
            type: "sales_invoice",
            entity_id: invoiceData.invoice_id,
            balance: invoiceData.total_amount - invoiceData.paid_amount,
          });
          // Pre-fill amount with remaining balance
          setFormData((prev) => ({
            ...prev,
            amount: invoiceData.total_amount - invoiceData.paid_amount,
            description: `Payment for Sales Invoice #${
              invoiceData.invoice_number || invoiceData.invoice_id
            }`,
            reference_document: `Invoice #${
              invoiceData.invoice_number || invoiceData.invoice_id
            }`,
          }));
        }
      } else if (invoiceType === "purchase") {
        const response = await fetchPurchaseInvoices({ id });
        invoiceData = response.data[0];
        if (invoiceData) {
          setEntityData({
            ...invoiceData,
            type: "purchase_invoice",
            entity_id: invoiceData.invoice_id,
            balance: invoiceData.total_amount - invoiceData.paid_amount,
          });
          // Pre-fill amount with remaining balance
          setFormData((prev) => ({
            ...prev,
            amount: invoiceData.total_amount - invoiceData.paid_amount,
            description: `Payment for Purchase Invoice #${
              invoiceData.invoice_number || invoiceData.invoice_id
            }`,
            reference_document: `Invoice #${
              invoiceData.invoice_number || invoiceData.invoice_id
            }`,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load invoice data:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "transaction_type_id") {
      const selectedType = transactionTypes.find(
        (t) => t.type_id === parseInt(value)
      );

      if (selectedType?.flow_direction === "transfer") {
        setTransactionFlow("internal_transfer");
      } else if (
        (entityType === "customer" &&
          selectedType?.type_name.toLowerCase().includes("payment")) ||
        (entityType === "supplier" &&
          selectedType?.type_name.toLowerCase().includes("payment"))
      ) {
        setTransactionFlow("invoice_payment");
      } else {
        setTransactionFlow("standard");
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || "" : value,
    }));

    // Special handling for payment method change
    if (name === "payment_method_id") {
      const method = paymentMethods.find(
        (m) => m.method_id === parseInt(value)
      );
      setSelectedMethod(method);
    }

    // Reset success/error messages on form change
    setSuccess(false);
    setError(null);
  };

  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    if (name === "sourceAccount") {
      setSourceAccount(value);
    } else if (name === "destinationAccount") {
      setDestinationAccount(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Prepare transaction data
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      // Handle transaction details based on transaction flow
      if (transactionFlow === "invoice_payment") {
        // Create transaction detail for invoice payment
        if (entityType === "customer" && entityData) {
          transactionData.transaction_details = [
            {
              entity_id: entityData.entity_id,
              entity_type: "sales_invoice",
              amount: parseFloat(formData.amount),
              notes: "Invoice payment",
            },
          ];
        } else if (entityType === "supplier" && entityData) {
          transactionData.transaction_details = [
            {
              entity_id: entityData.entity_id,
              entity_type: "purchase_invoice",
              amount: parseFloat(formData.amount),
              notes: "Invoice payment",
            },
          ];
        }
      } else if (transactionFlow === "internal_transfer") {
        // Create transaction details for internal transfer
        if (sourceAccount && destinationAccount) {
          const sourceType = sourceAccount.startsWith("bank_")
            ? "bank_account"
            : "cash_drawer";
          const destType = destinationAccount.startsWith("bank_")
            ? "bank_account"
            : "cash_drawer";

          const sourceId = parseInt(
            sourceAccount.replace("bank_", "").replace("cash_", "")
          );
          const destId = parseInt(
            destinationAccount.replace("bank_", "").replace("cash_", "")
          );

          transactionData.transaction_details = [
            {
              entity_id: sourceId,
              entity_type: sourceType,
              amount: -parseFloat(formData.amount),
              notes: "Transfer source",
            },
            {
              entity_id: destId,
              entity_type: destType,
              amount: parseFloat(formData.amount),
              notes: "Transfer destination",
            },
          ];
        }
      }

      // Add entity reference if provided
      if (entityType === "customer") {
        transactionData.customer_id = entityId;
      } else if (entityType === "supplier") {
        transactionData.supplier_id = entityId;
      }

      // Clear unnecessary payment source fields
      if (transactionFlow !== "internal_transfer") {
        if (selectedMethod?.name?.toLowerCase().includes("bank")) {
          transactionData.cash_drawer_id = null;
        } else if (selectedMethod?.name?.toLowerCase().includes("cash")) {
          transactionData.bank_account_id = null;
        }
      }

      // Create transaction
      await createTransaction(transactionData);

      setSuccess(true);

      // Reset form
      setFormData({
        transaction_date: new Date().toISOString().split("T")[0],
        transaction_time: new Date().toTimeString().substring(0, 5),
        transaction_type_id: formData.transaction_type_id,
        amount: "",
        payment_method_id: formData.payment_method_id,
        bank_account_id: "",
        cash_drawer_id: "",
        reference_number: "",
        reference_document: "",
        description: "",
        transaction_details: [],
      });

      setSourceAccount("");
      setDestinationAccount("");

      // Close the form after a short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(
        "Failed to create transaction: " +
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
          {entityType && entityData
            ? `New Payment for ${
                entityType === "customer"
                  ? `Sales Invoice #${
                      entityData.invoice_number || entityData.invoice_id
                    }`
                  : `Purchase Invoice #${
                      entityData.invoice_number || entityData.invoice_id
                    }`
              }`
            : entityType
            ? `New Transaction for ${
                entityType === "customer" ? "Customer" : "Supplier"
              } #${entityId}`
            : "New Transaction"}
        </h2>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Transaction created successfully!
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
              htmlFor="transaction_date"
            >
              Transaction Date *
            </label>
            <input
              id="transaction_date"
              name="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="transaction_time"
            >
              Time *
            </label>
            <input
              id="transaction_time"
              name="transaction_time"
              type="time"
              value={formData.transaction_time}
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
              htmlFor="transaction_type_id"
            >
              Transaction Type *
            </label>
            <select
              id="transaction_type_id"
              name="transaction_type_id"
              value={formData.transaction_type_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Type</option>
              {transactionTypes.map((type) => (
                <option key={type.type_id} value={type.type_id}>
                  {type.type_name || type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="amount"
            >
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 pl-7 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
        </div>

        {transactionFlow === "internal_transfer" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="sourceAccount"
              >
                Source Account *
              </label>
              <select
                id="sourceAccount"
                name="sourceAccount"
                value={sourceAccount}
                onChange={handleTransferChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select Source</option>
                <optgroup label="Bank Accounts">
                  {bankAccounts.map((account) => (
                    <option
                      key={`bank_${account.account_id}`}
                      value={`bank_${account.account_id}`}
                    >
                      {account.account_name} - ${account.current_balance}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cash Drawers">
                  {cashDrawers.map((drawer) => (
                    <option
                      key={`cash_${drawer.drawer_id}`}
                      value={`cash_${drawer.drawer_id}`}
                    >
                      {drawer.name} - ${drawer.current_balance}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="destinationAccount"
              >
                Destination Account *
              </label>
              <select
                id="destinationAccount"
                name="destinationAccount"
                value={destinationAccount}
                onChange={handleTransferChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select Destination</option>
                <optgroup label="Bank Accounts">
                  {bankAccounts.map((account) => (
                    <option
                      key={`bank_${account.account_id}`}
                      value={`bank_${account.account_id}`}
                    >
                      {account.account_name} - ${account.current_balance}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cash Drawers">
                  {cashDrawers.map((drawer) => (
                    <option
                      key={`cash_${drawer.drawer_id}`}
                      value={`cash_${drawer.drawer_id}`}
                    >
                      {drawer.name} - ${drawer.current_balance}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="">Select Method</option>
                {paymentMethods.map((method) => (
                  <option key={method.method_id} value={method.method_id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedMethod?.name?.toLowerCase().includes("bank") && (
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="bank_account_id"
                >
                  Bank Account *
                </label>
                <select
                  id="bank_account_id"
                  name="bank_account_id"
                  value={formData.bank_account_id}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.account_name} - {account.account_number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedMethod?.name?.toLowerCase().includes("cash") && (
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="cash_drawer_id"
                >
                  Cash Drawer *
                </label>
                <select
                  id="cash_drawer_id"
                  name="cash_drawer_id"
                  value={formData.cash_drawer_id}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Drawer</option>
                  {cashDrawers.map((drawer) => (
                    <option key={drawer.drawer_id} value={drawer.drawer_id}>
                      {drawer.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Check/Receipt Number"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="reference_document"
            >
              Reference Document
            </label>
            <input
              id="reference_document"
              name="reference_document"
              type="text"
              value={formData.reference_document}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Invoice #, PO #, etc."
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
            placeholder="Transaction details..."
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
            {loading ? "Creating..." : "Create Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
