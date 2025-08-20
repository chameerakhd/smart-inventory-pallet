const db = require("../models");
const { TransactionType } = db;

// Get all transaction types
exports.getAllTransactionTypes = async (req, res) => {
  try {
    const TransactionType = req.db.TransactionType; // Use the TransactionType model from the database instance
    const transactionTypes = await TransactionType.findAll();
    return res.status(200).json(transactionTypes);
  } catch (error) {
    console.error("Error getting transaction types:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get transaction type by ID
exports.getTransactionTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const TransactionType = req.db.TransactionType; // Use the TransactionType model from the database instance
    const transactionType = await TransactionType.findByPk(id);

    if (!transactionType) {
      return res.status(404).json({ message: "Transaction type not found" });
    }

    return res.status(200).json(transactionType);
  } catch (error) {
    console.error("Error getting transaction type:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new transaction type
exports.createTransactionType = async (req, res) => {
  try {
    const { name, description, flow_direction } = req.body;
    const TransactionType = req.db.TransactionType; // Use the TransactionType model from the database instance

    // Validation
    if (!name) {
      return res
        .status(400)
        .json({ message: "Transaction type name is required" });
    }

    if (!flow_direction) {
      return res.status(400).json({ message: "Flow direction is required" });
    }

    const newTransactionType = await TransactionType.create({
      name,
      description,
      flow_direction,
    });

    return res.status(201).json(newTransactionType);
  } catch (error) {
    console.error("Error creating transaction type:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a transaction type
exports.updateTransactionType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, flow_direction } = req.body;

    const TransactionType = req.db.TransactionType; // Use the TransactionType model from the database instance

    const transactionType = await TransactionType.findByPk(id);

    if (!transactionType) {
      return res.status(404).json({ message: "Transaction type not found" });
    }

    // Update transaction type fields
    await transactionType.update({
      name: name || transactionType.type_name,
      description:
        description !== undefined ? description : transactionType.description,
      flow_direction: flow_direction || transactionType.flow_direction,
    });

    return res.status(200).json(transactionType);
  } catch (error) {
    console.error("Error updating transaction type:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a transaction type
exports.deleteTransactionType = async (req, res) => {
  try {
    const { id } = req.params;
    const TransactionType = req.db.TransactionType; // Use the TransactionType model from the database instance

    const transactionType = await TransactionType.findByPk(id);

    if (!transactionType) {
      return res.status(404).json({ message: "Transaction type not found" });
    }

    await transactionType.destroy();
    return res
      .status(200)
      .json({ message: "Transaction type deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction type:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
