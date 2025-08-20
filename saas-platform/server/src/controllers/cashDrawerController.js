const db = require("../models");
const { CashDrawer } = db;

// Get all cash drawers
exports.getAllCashDrawers = async (req, res) => {
  try {
    const db = req.db; // Use the database instance from the request
    const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance
    const cashDrawers = await CashDrawer.findAll();
    return res.status(200).json(cashDrawers);
  } catch (error) {
    console.error("Error getting cash drawers:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get cash drawer by ID
exports.getCashDrawerById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance
    const cashDrawer = await CashDrawer.findByPk(id);

    if (!cashDrawer) {
      return res.status(404).json({ message: "Cash drawer not found" });
    }

    return res.status(200).json(cashDrawer);
  } catch (error) {
    console.error("Error getting cash drawer:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new cash drawer
exports.createCashDrawer = async (req, res) => {
  try {
    const { location, current_balance, last_counted } = req.body;
    const db = req.db; // Use the database instance from the request
    const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance

    // Validation
    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    const newCashDrawer = await CashDrawer.create({
      location,
      current_balance: current_balance || 0,
      last_counted: last_counted || new Date(),
    });

    return res.status(201).json(newCashDrawer);
  } catch (error) {
    console.error("Error creating cash drawer:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a cash drawer
exports.updateCashDrawer = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, current_balance, last_counted } = req.body;
    const db = req.db; // Use the database instance from the request
    const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance

    const cashDrawer = await CashDrawer.findByPk(id);

    if (!cashDrawer) {
      return res.status(404).json({ message: "Cash drawer not found" });
    }

    // Update cash drawer fields
    await cashDrawer.update({
      location: location || cashDrawer.location,
      current_balance:
        current_balance !== undefined
          ? current_balance
          : cashDrawer.current_balance,
      last_counted: last_counted || cashDrawer.last_counted,
    });

    return res.status(200).json(cashDrawer);
  } catch (error) {
    console.error("Error updating cash drawer:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a cash drawer
exports.deleteCashDrawer = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance
    const cashDrawer = await CashDrawer.findByPk(id);

    if (!cashDrawer) {
      return res.status(404).json({ message: "Cash drawer not found" });
    }

    await cashDrawer.destroy();
    return res
      .status(200)
      .json({ message: "Cash drawer deleted successfully" });
  } catch (error) {
    console.error("Error deleting cash drawer:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
