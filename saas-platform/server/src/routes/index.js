const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require("./authRoutes");
const customerRoutes = require("./customerRoutes");
const supplierRoutes = require("./supplierRoutes");
const transactionTypeRoutes = require("./transactionTypeRoutes");
const paymentMethodRoutes = require("./paymentMethodRoutes");
const bankAccountRoutes = require("./bankAccountRoutes");
const cashDrawerRoutes = require("./cashDrawerRoutes");
const salesInvoiceRoutes = require("./salesInvoiceRoutes");
const purchaseInvoiceRoutes = require("./purchaseInvoiceRoutes");
const transactionRoutes = require("./transactionRoutes");
const transactionDetailRoutes = require("./transactionDetailRoutes");
const productRoutes = require("./productRoutes");
const lorryRoutes = require("./lorryRoutes");
const emptyReturnRoutes = require("./emptyReturnRoutes");
const expiryReturnRoutes = require("./expiryReturnRoutes");
const stockInventoryRoutes = require("./stockInventoryRoutes");
const loadingTransactionRoutes = require("./loadingTransactionRoutes");
const unloadingTransactionRoutes = require("./unloadingTransactionRoutes");
const loadingDetailRoutes = require("./loadingDetailRoutes");
const unloadingDetailRoutes = require("./unloadingDetailRoutes");
const discountRoutes = require("./discountRoutes");
const dailySalesRoutes = require("./dailySalesRoutes");
const cocaColaMonthRoutes = require("./cocaColaMonthRoutes");
const shopRoutes = require("./shopRoutes");
const subDiscountTypeRoutes = require("./subDiscountTypeRoutes");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

const adminOnly = authorize("admin");

// Use the imported routes
router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/transaction-types", transactionTypeRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use("/bank-accounts", bankAccountRoutes);
router.use("/cash-drawers", cashDrawerRoutes);
router.use("/sales-invoices", salesInvoiceRoutes);
router.use("/purchase-invoices", purchaseInvoiceRoutes);
router.use("/transactions", transactionRoutes);
router.use("/transaction-details", transactionDetailRoutes);
router.use("/products", productRoutes);
router.use("/lorries", lorryRoutes);
router.use("/empty-returns", emptyReturnRoutes);
router.use("/expiry-returns", expiryReturnRoutes);
router.use("/stock-inventory", stockInventoryRoutes);
router.use("/loading-transactions", loadingTransactionRoutes);
router.use("/unloading-transactions", unloadingTransactionRoutes);
router.use("/loading-details", loadingDetailRoutes);
router.use("/unloading-details", unloadingDetailRoutes);
router.use("/discounts", discountRoutes);
router.use("/daily-sales", dailySalesRoutes);
router.use("/coca-cola-months", cocaColaMonthRoutes);
router.use("/shops", shopRoutes);
router.use("/sub-discount-types", subDiscountTypeRoutes);

module.exports = router;
