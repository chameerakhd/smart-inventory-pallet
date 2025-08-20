const express = require("express");
const router = express.Router();
const salesInvoiceController = require("../controllers/salesInvoiceController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all sales invoices
router.get("/", verifyToken, salesInvoiceController.getAllSalesInvoices);

// Get sales invoice by ID
router.get("/:id", verifyToken, salesInvoiceController.getSalesInvoiceById);

// Create a new sales invoice
router.post("/", verifyToken, salesInvoiceController.createSalesInvoice);

// Update a sales invoice
router.put("/:id", verifyToken, salesInvoiceController.updateSalesInvoice);

// Delete a sales invoice
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  salesInvoiceController.deleteSalesInvoice
);

module.exports = router;
