const express = require("express");
const router = express.Router();
const cocaColaMonthController = require("../controllers/cocaColaMonthController");

router.get("/", cocaColaMonthController.getAllCocaColaMonths);
router.get("/current", cocaColaMonthController.getCurrentCocaColaMonth);
router.get("/:id", cocaColaMonthController.getCocaColaMonthById);
router.post("/", cocaColaMonthController.createCocaColaMonth);
router.put("/:id", cocaColaMonthController.updateCocaColaMonth);
router.delete("/:id", cocaColaMonthController.deleteCocaColaMonth);

module.exports = router;
