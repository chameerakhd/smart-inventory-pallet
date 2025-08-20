const db = require("../models");

// Get all transaction details
exports.getAllTransactionDetails = async (req, res) => {
  try {
    const TransactionDetail = req.db.TransactionDetail; // Use the TransactionDetail model from the database instance
    const Transaction = req.db.Transaction; // Use the Transaction model from the database instance

    const transactionDetails = await TransactionDetail.findAll({
      include: [{ model: Transaction, as: "transaction" }],
    });
    return res.status(200).json(transactionDetails);
  } catch (error) {
    console.error("Error getting transaction details:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get transaction details by ID
exports.getTransactionDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const TransactionDetail = req.db.TransactionDetail; // Use the TransactionDetail model from the database instance
    const Transaction = req.db.Transaction; // Use the Transaction model from the database instance
    const SalesInvoice = req.db.SalesInvoice; // Use the SalesInvoice model from the database instance
    const PurchaseInvoice = req.db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance

    const transactionDetail = await TransactionDetail.findByPk(id, {
      include: [
        { model: Transaction, as: "transaction" },
        { model: SalesInvoice, as: "salesInvoice" },
        { model: PurchaseInvoice, as: "purchaseInvoice" },
      ],
    });

    if (!transactionDetail) {
      return res.status(404).json({ message: "Transaction detail not found" });
    }

    return res.status(200).json(transactionDetail);
  } catch (error) {
    console.error("Error getting transaction detail:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get transaction details by transaction ID
exports.getDetailsByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const TransactionDetail = req.db.TransactionDetail; // Use the TransactionDetail model from the database instance
    const SalesInvoice = req.db.SalesInvoice; // Use the SalesInvoice model from the database instance
    const PurchaseInvoice = req.db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance

    const transactionDetails = await TransactionDetail.findAll({
      where: { transaction_id: transactionId },
      include: [
        { model: SalesInvoice, as: "salesInvoice" },
        { model: PurchaseInvoice, as: "purchaseInvoice" },
      ],
    });

    return res.status(200).json(transactionDetails);
  } catch (error) {
    console.error(
      "Error getting transaction details by transaction ID:",
      error
    );
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new transaction detail
exports.createTransactionDetail = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  // Use the TransactionDetail model from the database instance
  const TransactionDetail = db.TransactionDetail;
  const Transaction = db.Transaction; // Use the Transaction model from the database instance
  const SalesInvoice = db.SalesInvoice; // Use the SalesInvoice model from the database instance
  const PurchaseInvoice = db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance

  try {
    const { transaction_id, entity_id, entity_type, amount, notes } = req.body;

    // Validation
    if (!transaction_id) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    if (!entity_id) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Entity ID is required" });
    }

    if (!entity_type) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Entity type is required" });
    }

    if (amount === undefined) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Amount is required" });
    }

    // Create the transaction detail
    const newTransactionDetail = await TransactionDetail.create(
      {
        transaction_id,
        entity_id,
        entity_type,
        amount,
        notes,
      },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    // Get the newly created detail with related data
    const createdDetail = await TransactionDetail.findByPk(
      newTransactionDetail.detail_id,
      {
        include: [
          { model: Transaction, as: "transaction" },
          { model: SalesInvoice, as: "salesInvoice" },
          { model: PurchaseInvoice, as: "purchaseInvoice" },
        ],
      }
    );

    return res.status(201).json(createdDetail);
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error creating transaction detail:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a transaction detail
exports.updateTransactionDetail = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  // Use the TransactionDetail model from the database instance
  const TransactionDetail = db.TransactionDetail;
  const Transaction = db.Transaction; // Use the Transaction model from the database instance
  const SalesInvoice = db.SalesInvoice; // Use the SalesInvoice model from the database instance
  const PurchaseInvoice = db.PurchaseInvoice; // Use the PurchaseInvoice model from the database instance

  try {
    const { id } = req.params;
    const { transaction_id, entity_id, entity_type, amount, notes } = req.body;

    const transactionDetail = await TransactionDetail.findByPk(id, {
      transaction: dbTransaction,
    });

    if (!transactionDetail) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Transaction detail not found" });
    }

    // Update transaction detail fields
    await transactionDetail.update(
      {
        transaction_id: transaction_id || transactionDetail.transaction_id,
        entity_id: entity_id || transactionDetail.entity_id,
        entity_type: entity_type || transactionDetail.entity_type,
        amount: amount !== undefined ? amount : transactionDetail.amount,
        notes: notes !== undefined ? notes : transactionDetail.notes,
      },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    // Get the updated detail with related data
    const updatedDetail = await TransactionDetail.findByPk(id, {
      include: [
        { model: Transaction, as: "transaction" },
        { model: SalesInvoice, as: "salesInvoice" },
        { model: PurchaseInvoice, as: "purchaseInvoice" },
      ],
    });

    return res.status(200).json(updatedDetail);
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error updating transaction detail:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a transaction detail
exports.deleteTransactionDetail = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  // Use the TransactionDetail model from the database instance
  const TransactionDetail = db.TransactionDetail;

  try {
    const { id } = req.params;
    const transactionDetail = await TransactionDetail.findByPk(id, {
      transaction: dbTransaction,
    });

    if (!transactionDetail) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Transaction detail not found" });
    }

    await transactionDetail.destroy({ transaction: dbTransaction });
    await dbTransaction.commit();

    return res
      .status(200)
      .json({ message: "Transaction detail deleted successfully" });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error deleting transaction detail:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
