const express = require("express");
const router = express.Router();
const expiryReturnController = require("../controllers/expiryReturnController");

// Get all lorries
router.get("/", expiryReturnController.getExpiryReturnsByTimeFrame);

// Create a new expiry return
router.post("/", expiryReturnController.createExpiryReturn);

module.exports = router;
