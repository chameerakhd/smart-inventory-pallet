const express = require("express");
const router = express.Router();
const emptyReturnController = require("../controllers/emptyReturnController");

// Get all lorries
router.get("/", emptyReturnController.getEmptyReturnsByTimeFrame);

router.post("/", emptyReturnController.createEmptyReturn);

module.exports = router;
