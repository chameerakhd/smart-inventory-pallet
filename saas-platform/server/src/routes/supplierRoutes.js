const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");
const { verifyToken, authorize } = require("../middleware/authMiddleware");

// Get all suppliers
router.get("/", verifyToken, supplierController.getAllSuppliers);

// Get supplier by ID
router.get("/:id", verifyToken, supplierController.getSupplierById);

// Create a new supplier
router.post("/", verifyToken, supplierController.createSupplier);

// Update a supplier
router.put("/:id", verifyToken, supplierController.updateSupplier);

// Delete a supplier
router.delete(
  "/:id",
  verifyToken,
  authorize(["admin"]),
  supplierController.deleteSupplier
);

module.exports = router;
