import React, { useState, useEffect } from "react";
import { fetchCreditAccounts, updateCreditAccount } from "../../services/api";
import { Edit2, Save, X } from "lucide-react";

const CreditAccountsTable = ({
  onAccountSelect,
  refreshTrigger,
  setRefreshTrigger,
}) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        const response = await fetchCreditAccounts();
        setAccounts(response.data);
        setError(null);
      } catch (err) {
        setError(
          "Failed to load bank accounts: " +
            (err.response?.data?.message || err.message)
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, [refreshTrigger]);

  const handleEdit = (account) => {
    setEditingAccount(account.account_id);
    setEditValues({
      current_balance: account.current_balance,
      account_name: account.account_name,
      bank_name: account.bank_name,
    });
  };

  const handleCancel = () => {
    setEditingAccount(null);
    setEditValues({});
  };

  const handleSave = async (accountId) => {
    try {
      await updateCreditAccount(accountId, editValues);
      setEditingAccount(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(
        "Failed to update account: " +
          (err.response?.data?.message || err.message)
      );
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({
      ...prev,
      [name]: name === "current_balance" ? parseFloat(value) : value,
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading)
    return <div className="flex justify-center p-6">Loading accounts...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bank Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {accounts.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                No bank accounts found
              </td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr
                key={account.account_id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onAccountSelect && onAccountSelect(account)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {account.account_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAccount === account.account_id ? (
                    <input
                      type="text"
                      name="bank_name"
                      value={editValues.bank_name}
                      onChange={handleChange}
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    account.bank_name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAccount === account.account_id ? (
                    <input
                      type="text"
                      name="account_name"
                      value={editValues.account_name}
                      onChange={handleChange}
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    account.account_name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {account.account_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {account.account_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingAccount === account.account_id ? (
                    <input
                      type="number"
                      name="current_balance"
                      value={editValues.current_balance}
                      onChange={handleChange}
                      className="border border-gray-300 rounded px-2 py-1 w-28"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={
                        account.current_balance > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(account.current_balance)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {editingAccount === account.account_id ? (
                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                        onClick={() => handleSave(account.account_id)}
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
                        handleEdit(account);
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

export default CreditAccountsTable;
