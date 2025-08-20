import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";

// Updated API URL handling using the getApiUrl function
const getApiUrl = () => {
  if (window.location.hostname === "localhost") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `https://${window.location.hostname}/api`;
};

const API_URL = getApiUrl();

const ManagementPage = () => {
  const [activeTab, setActiveTab] = useState("lorry");
  const [isLoading, setIsLoading] = useState(false);

  // Lorry state
  const [lorries, setLorries] = useState([]);
  const [newLorry, setNewLorry] = useState({
    lorry_number: "",
    driver_name: "",
    contact_number: "",
    active: true,
  });

  // Product state
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProduct, setEditProduct] = useState({
    product_name: "",
    size: "",
    unit_price: 0,
    selling_price: 0,
    bottles_per_case: 0,
  });

  // New product state
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    unit_price: 0,
    selling_price: 0,
    bottles_per_case: 0,
    size: "",
    active: true,
  });

  // Product filters
  const [filters, setFilters] = useState({
    size: "",
    brand: "",
    sortBy: "",
  });

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "lorry" || tab === "product" || tab === "add-product") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch lorries and products on component mount
  useEffect(() => {
    fetchLorries();
    fetchProducts();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchLorries = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/lorries`);
      setLorries(response.data);
    } catch (err) {
      console.error("Failed to fetch lorries:", err);
      toast.error("Failed to load lorries");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (!filters.sortBy) queryParams.append("sortBy", "Size");
      if (filters.size) queryParams.append("size", filters.size);
      if (filters.brand) queryParams.append("brand", filters.brand);
      if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);

      const response = await axios.get(`${API_URL}/products?${queryParams}`);
      setProducts(response.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLorryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLorry({
      ...newLorry,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleProductInputChange = (e) => {
    const { name, value, type } = e.target;
    setEditProduct({
      ...editProduct,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  const handleNewProductInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProduct({
      ...newProduct,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value)
          : value,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleAddLorry = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/lorries`, newLorry);
      toast.success("Lorry added successfully");
      setNewLorry({
        lorry_number: "",
        driver_name: "",
        contact_number: "",
        active: true,
      });
      fetchLorries();
    } catch (err) {
      console.error("Failed to add lorry:", err);
      toast.error(err.response?.data?.message || "Failed to add lorry");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/products`, newProduct);
      toast.success("Product added successfully");
      setNewProduct({
        product_name: "",
        unit_price: 0,
        selling_price: 0,
        bottles_per_case: 0,
        size: "",
        active: true,
      });
      fetchProducts();
    } catch (err) {
      console.error("Failed to add product:", err);
      toast.error(err.response?.data?.message || "Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setEditProduct({
      product_id: product.product_id,
      product_name: product.product_name,
      size: product.size,
      unit_price: product.unit_price,
      selling_price: product.selling_price,
      bottles_per_case: product.bottles_per_case,
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsLoading(true);
      await axios.put(
        `${API_URL}/products/${selectedProduct.product_id}`,
        editProduct
      );
      toast.success("Product updated successfully");
      fetchProducts();
      setSelectedProduct(null);
      setEditProduct({
        product_name: "",
        size: "",
        unit_price: 0,
        selling_price: 0,
        bottles_per_case: 0,
      });
    } catch (err) {
      console.error("Failed to update product:", err);
      toast.error(err.response?.data?.message || "Failed to update product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedProduct(null);
    setEditProduct({
      product_name: "",
      size: "",
      unit_price: 0,
      selling_price: 0,
      bottles_per_case: 0,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

      <div className="border-b-2 border-gray-200 mb-6">
        <nav className="flex flex-wrap">
          <button
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === "lorry"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("lorry")}
          >
            Manage Lorries
          </button>
          <button
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === "product"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("product")}
          >
            Manage Products
          </button>
          <button
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === "add-product"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("add-product")}
          >
            Add New Product
          </button>
        </nav>
      </div>

      {activeTab === "lorry" && (
        <div>
          <div className="mb-8 p-6 bg-white rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Add New Lorry</h2>
            <form onSubmit={handleAddLorry}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lorry Number*
                  </label>
                  <input
                    type="text"
                    name="lorry_number"
                    value={newLorry.lorry_number}
                    onChange={handleLorryInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name*
                  </label>
                  <input
                    type="text"
                    name="driver_name"
                    value={newLorry.driver_name}
                    onChange={handleLorryInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number*
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={newLorry.contact_number}
                    onChange={handleLorryInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    name="active"
                    id="active"
                    checked={newLorry.active}
                    onChange={handleLorryInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Active
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 focus:outline-none focus:ring-none disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Lorry"}
              </button>
            </form>
          </div>

          <div className="p-6 bg-white rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Lorry List</h2>
            {isLoading && !lorries.length ? (
              <div className="text-center py-4">Loading lorries...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lorry Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lorries.map((lorry) => (
                      <tr key={lorry.lorry_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lorry.lorry_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lorry.driver_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lorry.contact_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              lorry.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {lorry.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {lorries.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No lorries found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "product" && (
        <div>
          <div className="mb-8 p-6 bg-white rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              {selectedProduct ? "Edit Product" : "Select a Product to Edit"}
            </h2>
            {selectedProduct ? (
              <form onSubmit={handleUpdateProduct}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name*
                    </label>
                    <input
                      type="text"
                      name="product_name"
                      value={editProduct.product_name}
                      onChange={handleProductInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size*
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={editProduct.size}
                      onChange={handleProductInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bottles Per Case*
                    </label>
                    <input
                      type="number"
                      name="bottles_per_case"
                      value={editProduct.bottles_per_case}
                      onChange={handleProductInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price*
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      value={editProduct.unit_price}
                      onChange={handleProductInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price*
                    </label>
                    <input
                      type="number"
                      name="selling_price"
                      value={editProduct.selling_price}
                      onChange={handleProductInputChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Product"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-500">
                Please select a product from the list below to edit
              </p>
            )}
          </div>

          <div className="p-6 bg-white rounded shadow-sm">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Product List</h2>

              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <div className="relative">
                  <input
                    type="text"
                    name="brand"
                    value={filters.brand}
                    onChange={handleFilterChange}
                    placeholder="Filter by brand"
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="relative">
                  <input
                    type="text"
                    name="size"
                    value={filters.size}
                    onChange={handleFilterChange}
                    placeholder="Filter by size"
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="relative">
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sort by</option>
                    <option value="Brand">Brand</option>
                    <option value="Size">Size</option>
                    <option value="Count">Bottles Per Case</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading && !products.length ? (
              <div className="text-center py-4">Loading products...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bottles/Case
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        In Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr
                        key={product.product_id}
                        className={
                          selectedProduct?.product_id === product.product_id
                            ? "bg-blue-50"
                            : ""
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.bottles_per_case}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.selling_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.cases_qty} cases, {product.bottles_qty}{" "}
                          bottles
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleSelectProduct(product)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "add-product" && (
        <div className="p-6 bg-white rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name*
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={newProduct.product_name}
                  onChange={handleNewProductInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size*
                </label>
                <input
                  type="text"
                  name="size"
                  value={newProduct.size}
                  onChange={handleNewProductInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bottles Per Case*
                </label>
                <input
                  type="number"
                  name="bottles_per_case"
                  value={newProduct.bottles_per_case}
                  onChange={handleNewProductInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price*
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={newProduct.unit_price}
                  onChange={handleNewProductInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price*
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={newProduct.selling_price}
                  onChange={handleNewProductInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  checked={newProduct.active}
                  onChange={handleNewProductInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 focus:outline-none focus:ring-none disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Product"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
