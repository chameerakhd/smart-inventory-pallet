const express = require("express");
const router = express.Router();
const lorryController = require("../controllers/lorryController");

// Get all lorries
router.get("/", lorryController.getAllLorries);

// Get a specific lorry by ID
router.get("/:id", lorryController.getLorryById);

// Create a new lorry
router.post("/", lorryController.createLorry);

// Update a lorry
router.put("/:id", lorryController.updateLorry);

// Delete a lorry
router.delete("/:id", lorryController.deleteLorry);

module.exports = router;
