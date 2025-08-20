import React, { useState, useEffect } from "react";
import { fetchCustomers, updateCustomer } from "../../services/api";
import { Edit2, Save, X, ArrowUpDown, DollarSign, Search } from "lucide-react";
import CustomerCreditPaymentForm from "./CustomerCreditPaymentForm";

const CustomersList = ({
  refreshTrigger,
  onCustomerSelect,
  selectedCustomer,
}) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [customerForPayment, setCustomerForPayment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const response = await fetchCustomers();
        setCustomers(response.data);
        setError(null);
      } catch (err) {
        setError(
          "Failed to load customers: " +
            (err.response?.data?.message || err.message)
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [refreshTrigger]);

  const handleEdit = (customer) => {
    setEditingCustomer(customer.customer_id);
    setEditValues({
      credit_limit: customer.credit_limit,
      outstanding_balance: customer.outstanding_balance,
      name: customer.name,
      contact_person: customer.contact_person,
      phone: customer.phone,
      email: customer.email,
    });
  };

  const handleCancel = () => {
    setEditingCustomer(null);
    setEditValues({});
  };

  const handleSave = async (customerId) => {
    try {
      await updateCustomer(customerId, editValues);
      setEditingCustomer(null);

      // Update the customer in the list without a full refresh
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.customer_id === customerId
            ? { ...customer, ...editValues }
            : customer
        )
      );
    } catch (err) {
      setError(
        "Failed to update customer: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]:
        name === "credit_limit" || name === "outstanding_balance"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const handlePayCreditClick = (customer, e) => {
    e.stopPropagation();
    setCustomerForPayment(customer);
    setShowPaymentForm(true);
  };

  const handlePaymentComplete = (result) => {
    // Update the customer in the list with the new balance
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.customer_id === result.customer.customer_id
          ? { ...customer, outstanding_balance: result.customer.new_balance }
          : customer
      )
    );

    // Close the payment form
    setShowPaymentForm(false);
    setCustomerForPayment(null);
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.contact_person?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  // Sort customers based on the current sort field and direction
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
  });

  if (loading)
    return <div className="flex justify-center p-6">Loading customers...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div>
      {showPaymentForm && customerForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CustomerCreditPaymentForm
            customer={customerForPayment}
            onClose={() => {
              setShowPaymentForm(false);
              setCustomerForPayment(null);
            }}
            onPaymentComplete={handlePaymentComplete}
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search customers by name, contact, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Found {sortedCustomers.length} customer
            {sortedCustomers.length !== 1 ? "s" : ""} matching "{searchQuery}"
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Name
                  {sortField === "name" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("outstanding_balance")}
              >
                <div className="flex items-center">
                  Outstanding
                  {sortField === "outstanding_balance" && (
                    <ArrowUpDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedCustomers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  {searchQuery
                    ? "No customers found matching your search"
                    : "No customers found"}
                </td>
              </tr>
            ) : (
              sortedCustomers.map((customer) => (
                <tr
                  key={customer.customer_id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedCustomer?.customer_id === customer.customer_id
                      ? "bg-blue-50"
                      : ""
                  }`}
                  onClick={() =>
                    onCustomerSelect &&
                    onCustomerSelect({
                      ...customer,
                      type: "customer",
                      id: customer.customer_id,
                    })
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCustomer === customer.customer_id ? (
                      <input
                        type="text"
                        name="name"
                        value={editValues.name}
                        onChange={handleChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      customer.name
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingCustomer === customer.customer_id ? (
                      <div
                        className="space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          name="phone"
                          value={editValues.phone}
                          onChange={handleChange}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          placeholder="Phone"
                        />
                        <input
                          type="email"
                          name="email"
                          value={editValues.email}
                          onChange={handleChange}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <div>
                        <p>
                          <span className="font-medium">Phone:</span>{" "}
                          {customer.phone}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span>{" "}
                          {customer.email}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCustomer === customer.customer_id ? (
                      <input
                        type="number"
                        name="outstanding_balance"
                        value={editValues.outstanding_balance}
                        onChange={handleChange}
                        className="border border-gray-300 rounded px-2 py-1 w-28"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className={
                          customer.outstanding_balance > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {formatCurrency(customer.outstanding_balance)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {editingCustomer === customer.customer_id ? (
                        <div
                          className="flex space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                            onClick={() => handleSave(customer.customer_id)}
                          >
                            <Save size={16} />
                          </button>
                          <button
                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            onClick={handleCancel}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          {customer.outstanding_balance > 0 && (
                            <button
                              className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center"
                              onClick={(e) => handlePayCreditClick(customer, e)}
                              title="Pay outstanding credit"
                            >
                              <DollarSign size={16} />
                            </button>
                          )}
                        </>
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

export default CustomersList;
