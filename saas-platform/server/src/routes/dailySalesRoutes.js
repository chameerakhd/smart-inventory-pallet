const express = require("express");
const router = express.Router();
const dailySalesController = require("../controllers/dailySalesController");

// Get all daily sales details
router.get("/", dailySalesController.getDailySales);

// Get consolidated sales by product
router.get("/consolidated", dailySalesController.getConsolidatedDailySales);

// Get all daily sales records
router.get("/all", dailySalesController.getAllDailySales);

// Get a specific daily sales record by ID
router.get("/:id", dailySalesController.getDailySalesById);

// Create a new daily sales record
router.post("/", dailySalesController.createDailySales);

// Update a daily sales record
router.put("/:id", dailySalesController.updateDailySales);

// Delete a daily sales record
router.delete("/:id", dailySalesController.deleteDailySales);

// Get daily sales by date range
router.get(
  "/range/:startDate/:endDate",
  dailySalesController.getDailySalesByDateRange
);

// Get daily sales by lorry ID
router.get("/lorry/:lorryId", dailySalesController.getDailySalesByLorryId);

// Get daily sales by product ID
router.get(
  "/product/:productId",
  dailySalesController.getDailySalesByProductId
);

module.exports = router;
