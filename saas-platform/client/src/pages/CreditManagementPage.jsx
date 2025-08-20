import React, { useState, useEffect, useContext } from "react";
import { Tab } from "@headlessui/react";
import {
  Users,
  Truck,
  RefreshCcw,
  DollarSign,
  FileText,
  CreditCard,
  Building,
  Plus,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  fetchCustomers,
  fetchSuppliers,
  fetchSalesInvoices,
  fetchPurchaseInvoices,
  fetchTransactions,
} from "../services/api";
import CustomersList from "../components/FinancialManagement/CustomersList";
import SuppliersList from "../components/FinancialManagement/SuppliersList";
import CustomerForm from "../components/FinancialManagement/CustomerForm";
import SupplierForm from "../components/FinancialManagement/SupplierForm";
import TransactionsList from "../components/FinancialManagement/TransactionsList";
import TransactionForm from "../components/FinancialManagement/TransactionForm";
import InvoicesList from "../components/FinancialManagement/InvoicesList";
import SalesInvoiceForm from "../components/FinancialManagement/SalesInvoiceForm";
import PurchaseInvoiceForm from "../components/FinancialManagement/PurchaseInvoiceForm";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const CreditManagementPage = () => {
  const { currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin";
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      console.log("User is not an admin. Redirecting...");
      navigate("/unauthorized");
    }
  }, [isAdmin, navigate]);

  const [activeTab, setActiveTab] = useState("customers");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceFormType, setInvoiceFormType] = useState("sales"); // 'sales' or 'purchase'
  const [summaryData, setSummaryData] = useState({
    customerCount: 0,
    totalCredits: 0,
    supplierCount: 0,
    totalOutstanding: 0,
    recentTransactions: 0,
    overdueInvoices: 0,
  });
  const [loading, setLoading] = useState(false);

  // Load summary data
  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        setLoading(true);

        // Fetch data for summary cards
        const [
          customers,
          suppliers,
          salesInvoices,
          purchaseInvoices,
          transactions,
        ] = await Promise.all([
          fetchCustomers(),
          fetchSuppliers(),
          fetchSalesInvoices({ status: "overdue" }),
          fetchPurchaseInvoices({ status: "overdue" }),
          fetchTransactions({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
          }),
        ]);

        // Calculate summary metrics
        const totalCredits = customers.data.reduce(
          (sum, customer) => sum + customer.credit_limit,
          0
        );

        const totalOutstanding =
          customers.data.reduce(
            (sum, customer) => sum + (customer.outstanding_balance || 0),
            0
          ) +
          suppliers.data.reduce(
            (sum, supplier) => sum + (supplier.outstanding_balance || 0),
            0
          );

        const overdueInvoices =
          salesInvoices.data.length + purchaseInvoices.data.length;

        setSummaryData({
          customerCount: customers.data.length,
          totalCredits,
          supplierCount: suppliers.data.length,
          totalOutstanding,
          recentTransactions: transactions.data.length,
          overdueInvoices,
        });
      } catch (err) {
        console.error("Failed to load summary data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSummaryData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedItem(null);
    setShowForm(false);
    setShowInvoiceForm(false);
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const handleAddNew = () => {
    setSelectedItem(null);
    setShowForm(true);
    setShowInvoiceForm(false);
  };

  const handleAddNewInvoice = (type) => {
    setSelectedItem(null);
    setShowForm(false);
    setShowInvoiceForm(true);
    setInvoiceFormType(type);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setShowInvoiceForm(false);
    handleRefresh();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Financial Management
        </h1>
        <div className="flex space-x-3">
          {activeTab === "invoices" ? (
            <>
              <button
                onClick={() => handleAddNewInvoice("sales")}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                <Plus size={16} />
                <span>New Sales Invoice</span>
              </button>
              <button
                onClick={() => handleAddNewInvoice("purchase")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
              >
                <Plus size={16} />
                <span>New Purchase Invoice</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <Plus size={16} />
              <span>Add New</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <RefreshCcw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-5 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Customers / Credits</p>
            <p className="text-xl font-semibold">
              {loading
                ? "Loading..."
                : `${summaryData.customerCount} / ${formatCurrency(
                    summaryData.totalCredits
                  )}`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Building className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Suppliers / Outstanding</p>
            <p className="text-xl font-semibold">
              {loading
                ? "Loading..."
                : `${summaryData.supplierCount} / ${formatCurrency(
                    summaryData.totalOutstanding
                  )}`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Overdue Invoices</p>
            <p className="text-xl font-semibold">
              {loading ? "Loading..." : summaryData.overdueInvoices}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Tab.Group>
          <Tab.List className="flex bg-gray-100 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-2.5 text-sm font-medium rounded-md",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white shadow"
                    : "text-gray-500 hover:bg-white/[0.12] hover:text-gray-700"
                )
              }
              onClick={() => setActiveTab("customers")}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users size={16} />
                <span>Customers</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-2.5 text-sm font-medium rounded-md",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white shadow"
                    : "text-gray-500 hover:bg-white/[0.12] hover:text-gray-700"
                )
              }
              onClick={() => setActiveTab("suppliers")}
            >
              <div className="flex items-center justify-center space-x-2">
                <Truck size={16} />
                <span>Suppliers</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-2.5 text-sm font-medium rounded-md",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white shadow"
                    : "text-gray-500 hover:bg-white/[0.12] hover:text-gray-700"
                )
              }
              onClick={() => setActiveTab("transactions")}
            >
              <div className="flex items-center justify-center space-x-2">
                <DollarSign size={16} />
                <span>Transactions</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-2.5 text-sm font-medium rounded-md",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white shadow"
                    : "text-gray-500 hover:bg-white/[0.12] hover:text-gray-700"
                )
              }
              onClick={() => setActiveTab("invoices")}
            >
              <div className="flex items-center justify-center space-x-2">
                <CreditCard size={16} />
                <span>Invoices</span>
              </div>
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="p-4">
              {showForm && activeTab === "customers" ? (
                <CustomerForm
                  customer={selectedItem}
                  onClose={handleFormClose}
                />
              ) : (
                <CustomersList
                  refreshTrigger={refreshTrigger}
                  onCustomerSelect={handleItemSelect}
                  selectedCustomer={selectedItem}
                />
              )}
            </Tab.Panel>
            <Tab.Panel className="p-4">
              {showForm && activeTab === "suppliers" ? (
                <SupplierForm
                  supplier={selectedItem}
                  onClose={handleFormClose}
                />
              ) : (
                <SuppliersList
                  refreshTrigger={refreshTrigger}
                  onSupplierSelect={handleItemSelect}
                  selectedSupplier={selectedItem}
                />
              )}
            </Tab.Panel>
            <Tab.Panel className="p-4">
              {showForm && activeTab === "transactions" ? (
                <TransactionForm
                  onClose={handleFormClose}
                  entityType={selectedItem?.type}
                  entityId={selectedItem?.id}
                />
              ) : (
                <TransactionsList
                  refreshTrigger={refreshTrigger}
                  entityType={selectedItem?.type}
                  entityId={selectedItem?.id}
                />
              )}
            </Tab.Panel>
            <Tab.Panel className="p-4">
              {showInvoiceForm && invoiceFormType === "sales" ? (
                <SalesInvoiceForm
                  onClose={handleFormClose}
                  customer={
                    selectedItem?.type === "customer" ? selectedItem : null
                  }
                />
              ) : showInvoiceForm && invoiceFormType === "purchase" ? (
                <PurchaseInvoiceForm
                  onClose={handleFormClose}
                  supplier={
                    selectedItem?.type === "supplier" ? selectedItem : null
                  }
                />
              ) : (
                <InvoicesList
                  refreshTrigger={refreshTrigger}
                  entityType={selectedItem?.type}
                  entityId={selectedItem?.id}
                />
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default CreditManagementPage;
