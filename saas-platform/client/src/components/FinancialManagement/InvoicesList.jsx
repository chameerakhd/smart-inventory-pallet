import React, { useState, useEffect } from "react";
import {
  fetchSalesInvoices,
  fetchPurchaseInvoices,
  updateSalesInvoice,
  updatePurchaseInvoice,
} from "../../services/api";
import { ArrowUpDown, Filter, FileText } from "lucide-react";

const InvoicesList = ({ refreshTrigger, entityType, entityId }) => {
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("sales");
  const [sortField, setSortField] = useState("invoice_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);

        // Prepare params for invoice queries
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

        // Fetch invoices with filters
        const [salesResponse, purchaseResponse] = await Promise.all([
          fetchSalesInvoices(params),
          fetchPurchaseInvoices(params),
        ]);

        setSalesInvoices(salesResponse.data || []);
        setPurchaseInvoices(purchaseResponse.data || []);

        // If entity is customer, show sales invoices by default
        // If entity is supplier, show purchase invoices by default
        if (entityType === "customer") {
          setActiveTab("sales");
        } else if (entityType === "supplier") {
          setActiveTab("purchases");
        }

        setError(null);
      } catch (err) {
        setError(
          "Failed to load invoices: " +
            (err.response?.data?.message || err.message)
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
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
      status: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUpdateStatus = async (invoiceType, invoiceId, newStatus) => {
    try {
      if (invoiceType === "sales") {
        // For paid status, we need to set the paid_amount to match the total_amount
        if (newStatus === "paid") {
          const invoice = salesInvoices.find(
            (inv) => inv.invoice_id === invoiceId
          );
          if (invoice) {
            await updateSalesInvoice(invoiceId, {
              status: newStatus,
              paid_amount: parseFloat(invoice.total_amount),
            });

            // Update local state
            setSalesInvoices((prev) =>
              prev.map((inv) =>
                inv.invoice_id === invoiceId
                  ? {
                      ...inv,
                      status: newStatus,
                      paid_amount: parseFloat(inv.total_amount),
                      amount_due: 0,
                    }
                  : inv
              )
            );
          }
        } else if (newStatus === "partially paid") {
          // Handle partial payment
          const invoice = salesInvoices.find(
            (inv) => inv.invoice_id === invoiceId
          );
          if (invoice) {
            // Get the paid amount from the user (you could show a modal for this)
            const paidAmount = parseFloat(
              prompt(
                `Enter amount paid for Invoice #${
                  invoice.invoice_number || invoice.invoice_id
                }:`,
                "0"
              ) || "0"
            );

            if (isNaN(paidAmount) || paidAmount <= 0) {
              alert("Please enter a valid amount greater than 0");
              return;
            }

            if (paidAmount >= invoice.total_amount) {
              alert("For full payment, please use 'Mark Paid' instead");
              return;
            }

            await updateSalesInvoice(invoiceId, {
              status: newStatus,
              paid_amount: paidAmount,
            });

            // Update local state
            setSalesInvoices((prev) =>
              prev.map((inv) =>
                inv.invoice_id === invoiceId
                  ? {
                      ...inv,
                      status: newStatus,
                      paid_amount: paidAmount,
                      amount_due: Math.max(
                        0,
                        parseFloat(inv.total_amount) - paidAmount
                      ),
                    }
                  : inv
              )
            );
          }
        } else {
          // For other statuses, just update the status
          await updateSalesInvoice(invoiceId, { status: newStatus });

          // Update local state
          setSalesInvoices((prev) =>
            prev.map((invoice) =>
              invoice.invoice_id === invoiceId
                ? { ...invoice, status: newStatus }
                : invoice
            )
          );
        }
      } else {
        // For purchases
        if (newStatus === "paid") {
          const invoice = purchaseInvoices.find(
            (inv) => inv.invoice_id === invoiceId
          );
          if (invoice) {
            await updatePurchaseInvoice(invoiceId, {
              status: newStatus,
              paid_amount: parseFloat(invoice.total_amount),
            });

            // Update local state
            setPurchaseInvoices((prev) =>
              prev.map((inv) =>
                inv.invoice_id === invoiceId
                  ? {
                      ...inv,
                      status: newStatus,
                      paid_amount: parseFloat(inv.total_amount),
                      amount_due: 0,
                    }
                  : inv
              )
            );
          }
        } else if (newStatus === "partially paid") {
          // Handle partial payment
          const invoice = purchaseInvoices.find(
            (inv) => inv.invoice_id === invoiceId
          );
          if (invoice) {
            // Get the paid amount from the user (you could show a modal for this)
            const paidAmount = parseFloat(
              prompt(
                `Enter amount paid for Invoice #${
                  invoice.invoice_number || invoice.invoice_id
                }:`,
                "0"
              ) || "0"
            );

            if (isNaN(paidAmount) || paidAmount <= 0) {
              alert("Please enter a valid amount greater than 0");
              return;
            }

            if (paidAmount >= invoice.total_amount) {
              alert("For full payment, please use 'Mark Paid' instead");
              return;
            }

            await updatePurchaseInvoice(invoiceId, {
              status: newStatus,
              paid_amount: paidAmount,
            });

            // Update local state
            setPurchaseInvoices((prev) =>
              prev.map((inv) =>
                inv.invoice_id === invoiceId
                  ? {
                      ...inv,
                      status: newStatus,
                      paid_amount: paidAmount,
                      amount_due: Math.max(
                        0,
                        parseFloat(inv.total_amount) - paidAmount
                      ),
                    }
                  : inv
              )
            );
          }
        } else {
          // For other statuses, just update the status
          await updatePurchaseInvoice(invoiceId, { status: newStatus });

          // Update local state
          setPurchaseInvoices((prev) =>
            prev.map((invoice) =>
              invoice.invoice_id === invoiceId
                ? { ...invoice, status: newStatus }
                : invoice
            )
          );
        }
      }
    } catch (err) {
      setError(
        "Failed to update invoice status: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    }
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

  // Get appropriate invoices based on active tab
  const currentInvoices =
    activeTab === "sales" ? salesInvoices : purchaseInvoices;

  if (loading && !currentInvoices.length)
    return <div className="flex justify-center p-6">Loading invoices...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-800">
            {entityType
              ? `Invoices for ${
                  entityType === "customer" ? "Customer" : "Supplier"
                } #${entityId}`
              : "All Invoices"}
          </h2>
          <div className="mt-2">
            <div className="flex space-x-4 border-b">
              <button
                className={`py-2 px-4 focus:outline-none ${
                  activeTab === "sales"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => handleTabChange("sales")}
              >
                Sales Invoices
              </button>
              <button
                className={`py-2 px-4 focus:outline-none ${
                  activeTab === "purchases"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => handleTabChange("purchases")}
              >
                Purchase Invoices
              </button>
            </div>
          </div>
        </div>
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
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
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
                onClick={() => handleSort("invoice_id")}
              >
                <div className="flex items-center">
                  Invoice #
                  {sortField === "invoice_id" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("invoice_date")}
              >
                <div className="flex items-center">
                  Date
                  {sortField === "invoice_date" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {activeTab === "sales" ? "Customer" : "Supplier"}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("total_amount")}
              >
                <div className="flex items-center">
                  Total
                  {sortField === "total_amount" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("due_date")}
              >
                <div className="flex items-center">
                  Due Date
                  {sortField === "due_date" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No {activeTab === "sales" ? "sales" : "purchase"} invoices
                  found
                </td>
              </tr>
            ) : (
              currentInvoices.map((invoice) => (
                <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText size={16} className="text-gray-400 mr-2" />
                      <span>
                        {invoice.invoice_number || invoice.invoice_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(invoice.invoice_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activeTab === "sales"
                      ? invoice.customer?.name ||
                        `Customer #${invoice.customer_id}`
                      : invoice.supplier?.name ||
                        `Supplier #${invoice.supplier_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(invoice.due_date)}
                    {invoice.status === "overdue" && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 py-1 px-2 rounded-full">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`capitalize px-2 py-1 rounded-full text-xs ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "overdue"
                          ? "bg-red-100 text-red-800"
                          : invoice.status === "cancelled"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {invoice.status !== "paid" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              activeTab === "sales" ? "sales" : "purchases",
                              invoice.invoice_id,
                              "paid"
                            )
                          }
                          className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
                        >
                          Mark Paid
                        </button>
                      )}
                      {invoice.status !== "paid" &&
                        invoice.status !== "partially paid" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                activeTab === "sales" ? "sales" : "purchases",
                                invoice.invoice_id,
                                "partially paid"
                              )
                            }
                            className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs hover:bg-yellow-200"
                          >
                            Partial
                          </button>
                        )}
                      {invoice.status !== "cancelled" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              activeTab === "sales" ? "sales" : "purchases",
                              invoice.invoice_id,
                              "cancelled"
                            )
                          }
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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

export default InvoicesList;
