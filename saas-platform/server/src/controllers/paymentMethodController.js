const db = require("../models");
const { PaymentMethod } = db;

// Get all payment methods
exports.getAllPaymentMethods = async (req, res) => {
  try {
    const PaymentMethod = req.db.PaymentMethod; // Use the PaymentMethod model from the database instance
    const paymentMethods = await PaymentMethod.findAll();
    return res.status(200).json(paymentMethods);
  } catch (error) {
    console.error("Error getting payment methods:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get payment method by ID
exports.getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const PaymentMethod = req.db.PaymentMethod; // Use the PaymentMethod model from the database instance
    const paymentMethod = await PaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    return res.status(200).json(paymentMethod);
  } catch (error) {
    console.error("Error getting payment method:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new payment method
exports.createPaymentMethod = async (req, res) => {
  try {
    const { name, description } = req.body;
    const PaymentMethod = req.db.PaymentMethod; // Use the PaymentMethod model from the database instance

    // Validation
    if (!name) {
      return res
        .status(400)
        .json({ message: "Payment method name is required" });
    }

    const newPaymentMethod = await PaymentMethod.create({
      name,
      description,
    });

    return res.status(201).json(newPaymentMethod);
  } catch (error) {
    console.error("Error creating payment method:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const PaymentMethod = req.db.PaymentMethod; // Use the PaymentMethod model from the database instance

    const paymentMethod = await PaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    // Update payment method fields
    await paymentMethod.update({
      name: name || paymentMethod.name,
      description:
        description !== undefined ? description : paymentMethod.description,
    });

    return res.status(200).json(paymentMethod);
  } catch (error) {
    console.error("Error updating payment method:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const PaymentMethod = req.db.PaymentMethod; // Use the PaymentMethod model from the database instance
    const paymentMethod = await PaymentMethod.findByPk(id);

    if (!paymentMethod) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    await paymentMethod.destroy();
    return res
      .status(200)
      .json({ message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
