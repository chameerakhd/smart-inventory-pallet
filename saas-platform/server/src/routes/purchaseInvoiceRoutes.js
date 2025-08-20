const express = require("express");
const router = express.Router();
const purchaseInvoiceController = require("../controllers/purchaseInvoiceController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all purchase invoices
router.get("/", verifyToken, purchaseInvoiceController.getAllPurchaseInvoices);

// Get purchase invoice by ID
router.get(
  "/:id",
  verifyToken,
  purchaseInvoiceController.getPurchaseInvoiceById
);

// Create a new purchase invoice
router.post("/", verifyToken, purchaseInvoiceController.createPurchaseInvoice);

// Update a purchase invoice
router.put(
  "/:id",
  verifyToken,
  purchaseInvoiceController.updatePurchaseInvoice
);

// Delete a purchase invoice
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  purchaseInvoiceController.deletePurchaseInvoice
);

module.exports = router;
