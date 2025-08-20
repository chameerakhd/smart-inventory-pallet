import React, { useState, useEffect } from "react";
import { fetchSuppliers, updateSupplier } from "../../services/api";
import { Edit2, Save, X, ArrowUpDown } from "lucide-react";

const SuppliersList = ({
  refreshTrigger,
  onSupplierSelect,
  selectedSupplier,
}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const response = await fetchSuppliers();
        setSuppliers(response.data);
        setError(null);
      } catch (err) {
        setError(
          "Failed to load suppliers: " +
            (err.response?.data?.message || err.message)
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, [refreshTrigger]);

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier.supplier_id);
    setEditValues({
      outstanding_balance: supplier.outstanding_balance,
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
    });
  };

  const handleCancel = () => {
    setEditingSupplier(null);
    setEditValues({});
  };

  const handleSave = async (supplierId) => {
    try {
      await updateSupplier(supplierId, editValues);
      setEditingSupplier(null);

      // Update the supplier in the list without a full refresh
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.supplier_id === supplierId
            ? { ...supplier, ...editValues }
            : supplier
        )
      );
    } catch (err) {
      setError(
        "Failed to update supplier: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: name === "outstanding_balance" ? parseFloat(value) : value,
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

  // Sort suppliers based on the current sort field and direction
  const sortedSuppliers = [...suppliers].sort((a, b) => {
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
    return <div className="flex justify-center p-6">Loading suppliers...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
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
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact Info
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("outstanding_balance")}
            >
              <div className="flex items-center">
                Outstanding Balance
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
          {sortedSuppliers.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                No suppliers found
              </td>
            </tr>
          ) : (
            sortedSuppliers.map((supplier) => (
              <tr
                key={supplier.supplier_id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedSupplier?.supplier_id === supplier.supplier_id
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() =>
                  onSupplierSelect &&
                  onSupplierSelect({
                    ...supplier,
                    type: "supplier",
                    id: supplier.supplier_id,
                  })
                }
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingSupplier === supplier.supplier_id ? (
                    <input
                      type="text"
                      name="name"
                      value={editValues.name}
                      onChange={handleChange}
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    supplier.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingSupplier === supplier.supplier_id ? (
                    <input
                      type="text"
                      name="contact_person"
                      value={editValues.contact_person}
                      onChange={handleChange}
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    supplier.contact_person
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingSupplier === supplier.supplier_id ? (
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
                        {supplier.phone}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {supplier.email}
                      </p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingSupplier === supplier.supplier_id ? (
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
                        supplier.outstanding_balance > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {formatCurrency(supplier.outstanding_balance)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {editingSupplier === supplier.supplier_id ? (
                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                        onClick={() => handleSave(supplier.supplier_id)}
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
                    <button
                      className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(supplier);
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SuppliersList;
