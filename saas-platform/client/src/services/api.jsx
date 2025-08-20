import axios from "axios";

const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

// Create axios instance with custom config
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized responses
    if (error.response && error.response.status === 401) {
      // Clear localStorage and reload the app
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Financial management API functions
export const fetchCustomers = () => api.get("/customers");
export const fetchCustomerById = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const processCustomerCreditPayment = (id, data) =>
  api.post(`/customers/${id}/credit-payment`, data);

export const fetchSuppliers = () => api.get("/suppliers");
export const fetchSupplierById = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post("/suppliers", data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

export const fetchTransactions = (params) =>
  api.get("/transactions", { params });
export const fetchTransactionById = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (data) => api.post("/transactions", data);
export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const fetchTransactionDetails = (params) =>
  api.get("/transaction-details", { params });
export const createTransactionDetail = (data) =>
  api.post("/transaction-details", data);

export const fetchTransactionTypes = () => api.get("/transaction-types");
export const fetchPaymentMethods = () => api.get("/payment-methods");

export const fetchBankAccounts = () => api.get("/bank-accounts");
export const fetchBankAccountById = (id) => api.get(`/bank-accounts/${id}`);
export const createBankAccount = (data) => api.post("/bank-accounts", data);
export const updateBankAccount = (id, data) =>
  api.put(`/bank-accounts/${id}`, data);

export const fetchCashDrawers = () => api.get("/cash-drawers");
export const updateCashDrawer = (id, data) =>
  api.put(`/cash-drawers/${id}`, data);

export const fetchSalesInvoices = (params) =>
  api.get("/sales-invoices", { params });
export const fetchSalesInvoiceById = (id) => api.get(`/sales-invoices/${id}`);
export const createSalesInvoice = (data) => api.post("/sales-invoices", data);
export const updateSalesInvoice = (id, data) =>
  api.put(`/sales-invoices/${id}`, data);

export const fetchPurchaseInvoices = (params) =>
  api.get("/purchase-invoices", { params });
export const fetchPurchaseInvoiceById = (id) =>
  api.get(`/purchase-invoices/${id}`);
export const createPurchaseInvoice = (data) =>
  api.post("/purchase-invoices", data);
export const updatePurchaseInvoice = (id, data) =>
  api.put(`/purchase-invoices/${id}`, data);

export const fetchLorries = () => api.get("/lorries");

export default api;
