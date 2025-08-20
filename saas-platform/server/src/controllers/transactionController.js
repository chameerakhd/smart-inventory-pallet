const db = require("../models");
const {
  Transaction,
  TransactionType,
  PaymentMethod,
  BankAccount,
  CashDrawer,
  TransactionDetail,
  sequelize,
} = db;

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const Transaction = req.db.Transaction; // Use the Transaction model from the database instance
    const TransactionType = req.db.TransactionType; // Use the TransactionType model from the database instance
    const PaymentMethod = req.db.PaymentMethod; // Use the PaymentMethod model from the database instance
    const BankAccount = req.db.BankAccount; // Use the BankAccount model from the database instance
    const CashDrawer = req.db.CashDrawer; // Use the CashDrawer model from the database instance
    const TransactionDetail = req.db.TransactionDetail; // Use the TransactionDetail model from the database instance
    const transactions = await Transaction.findAll({
      include: [
        { model: TransactionType, as: "transactionType" },
        { model: PaymentMethod, as: "paymentMethod" },
        { model: BankAccount, as: "bankAccount" },
        { model: CashDrawer, as: "cashDrawer" },
        { model: TransactionDetail, as: "transactionDetails" },
      ],
    });
    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error getting transactions:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const Transaction = req.db.Transaction; // Use the Transaction model from the database instance
    const TransactionType = req.db.TransactionType; // Use the TransactionType model from the database instance
    const PaymentMethod = req.db.PaymentMethod; // Use the PaymentMethod model from the database instance
    const BankAccount = req.db.BankAccount; // Use the BankAccount model from the database instance
    const CashDrawer = req.db.CashDrawer; // Use the CashDrawer model from the database instance
    const TransactionDetail = req.db.TransactionDetail; // Use the TransactionDetail model from the database instance
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: TransactionType, as: "transactionType" },
        { model: PaymentMethod, as: "paymentMethod" },
        { model: BankAccount, as: "bankAccount" },
        { model: CashDrawer, as: "cashDrawer" },
        { model: TransactionDetail, as: "transactionDetails" },
      ],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    console.error("Error getting transaction:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  const Transaction = db.Transaction; // Use the Transaction model from the database instance
  const TransactionType = db.TransactionType; // Use the TransactionType model from the database instance
  const PaymentMethod = db.PaymentMethod; // Use the PaymentMethod model from the database instance
  const BankAccount = db.BankAccount; // Use the BankAccount model from the database instance
  const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance
  const TransactionDetail = db.TransactionDetail; // Use the TransactionDetail model from the database instance

  try {
    const {
      reference_number,
      transaction_date,
      transaction_time,
      transaction_type_id,
      amount,
      payment_method_id,
      bank_account_id,
      cash_drawer_id,
      description,
      status,
      reference_document,
      transaction_details,
    } = req.body;

    // Validation
    if (!reference_number) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Reference number is required" });
    }

    if (!transaction_date) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Transaction date is required" });
    }

    if (!transaction_time) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Transaction time is required" });
    }

    if (!transaction_type_id) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Transaction type is required" });
    }

    if (amount === undefined) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Amount is required" });
    }

    if (!payment_method_id) {
      await dbTransaction.rollback();
      return res.status(400).json({ message: "Payment method is required" });
    }

    // Create the transaction
    const newTransaction = await Transaction.create(
      {
        reference_number,
        transaction_date,
        transaction_time,
        transaction_type_id,
        amount,
        payment_method_id,
        bank_account_id,
        cash_drawer_id,
        description,
        status: status || "completed",
        reference_document,
      },
      { transaction: dbTransaction }
    );

    // Add transaction details if provided
    if (
      transaction_details &&
      Array.isArray(transaction_details) &&
      transaction_details.length > 0
    ) {
      const detailsToCreate = transaction_details.map((detail) => ({
        ...detail,
        transaction_id: newTransaction.transaction_id,
      }));

      await TransactionDetail.bulkCreate(detailsToCreate, {
        transaction: dbTransaction,
      });
    }

    await dbTransaction.commit();

    // Get the newly created transaction with related data
    const createdTransaction = await Transaction.findByPk(
      newTransaction.transaction_id,
      {
        include: [
          { model: TransactionType, as: "transactionType" },
          { model: PaymentMethod, as: "paymentMethod" },
          { model: BankAccount, as: "bankAccount" },
          { model: CashDrawer, as: "cashDrawer" },
          { model: TransactionDetail, as: "transactionDetails" },
        ],
      }
    );

    return res.status(201).json(createdTransaction);
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error creating transaction:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  const Transaction = db.Transaction; // Use the Transaction model from the database instance
  const TransactionType = db.TransactionType; // Use the TransactionType model from the database instance
  const PaymentMethod = db.PaymentMethod; // Use the PaymentMethod model from the database instance
  const BankAccount = db.BankAccount; // Use the BankAccount model from the database instance
  const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance
  const TransactionDetail = db.TransactionDetail; // Use the TransactionDetail model from the database instance

  try {
    const { id } = req.params;
    const {
      reference_number,
      transaction_date,
      transaction_time,
      transaction_type_id,
      amount,
      payment_method_id,
      bank_account_id,
      cash_drawer_id,
      description,
      status,
      reference_document,
    } = req.body;

    const transaction = await Transaction.findByPk(id, {
      transaction: dbTransaction,
    });

    if (!transaction) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if amount or transaction type has changed
    const amountChanged = amount !== undefined && amount !== transaction.amount;
    const typeChanged =
      transaction_type_id !== undefined &&
      transaction_type_id !== transaction.transaction_type_id;

    if (amountChanged || typeChanged) {
      // Revert previous balance changes
      const oldType = await TransactionType.findByPk(
        transaction.transaction_type_id,
        { transaction: dbTransaction }
      );

      if (
        oldType &&
        (transaction.bank_account_id || transaction.cash_drawer_id)
      ) {
        if (transaction.bank_account_id) {
          const bankAccount = await BankAccount.findByPk(
            transaction.bank_account_id,
            { transaction: dbTransaction }
          );
          if (bankAccount) {
            if (oldType.flow_direction === "in") {
              bankAccount.current_balance -= transaction.amount;
            } else if (oldType.flow_direction === "out") {
              bankAccount.current_balance += transaction.amount;
            }
            await bankAccount.save({ transaction: dbTransaction });
          }
        } else if (transaction.cash_drawer_id) {
          const cashDrawer = await CashDrawer.findByPk(
            transaction.cash_drawer_id,
            { transaction: dbTransaction }
          );
          if (cashDrawer) {
            if (oldType.flow_direction === "in") {
              cashDrawer.current_balance -= transaction.amount;
            } else if (oldType.flow_direction === "out") {
              cashDrawer.current_balance += transaction.amount;
            }
            await cashDrawer.save({ transaction: dbTransaction });
          }
        }
      }

      // Apply new balance changes
      const newTypeId = transaction_type_id || transaction.transaction_type_id;
      const newType = await TransactionType.findByPk(newTypeId, {
        transaction: dbTransaction,
      });
      const newAmount = amount !== undefined ? amount : transaction.amount;
      const accountId =
        bank_account_id !== undefined
          ? bank_account_id
          : transaction.bank_account_id;
      const drawerId =
        cash_drawer_id !== undefined
          ? cash_drawer_id
          : transaction.cash_drawer_id;

      if (newType && (accountId || drawerId)) {
        if (accountId) {
          const bankAccount = await BankAccount.findByPk(accountId, {
            transaction: dbTransaction,
          });
          if (bankAccount) {
            if (newType.flow_direction === "in") {
              bankAccount.current_balance += newAmount;
            } else if (newType.flow_direction === "out") {
              bankAccount.current_balance -= newAmount;
            }
            await bankAccount.save({ transaction: dbTransaction });
          }
        } else if (drawerId) {
          const cashDrawer = await CashDrawer.findByPk(drawerId, {
            transaction: dbTransaction,
          });
          if (cashDrawer) {
            if (newType.flow_direction === "in") {
              cashDrawer.current_balance += newAmount;
            } else if (newType.flow_direction === "out") {
              cashDrawer.current_balance -= newAmount;
            }
            await cashDrawer.save({ transaction: dbTransaction });
          }
        }
      }
    }

    // Update transaction fields
    await transaction.update(
      {
        reference_number: reference_number || transaction.reference_number,
        transaction_date: transaction_date || transaction.transaction_date,
        transaction_time: transaction_time || transaction.transaction_time,
        transaction_type_id:
          transaction_type_id || transaction.transaction_type_id,
        amount: amount !== undefined ? amount : transaction.amount,
        payment_method_id: payment_method_id || transaction.payment_method_id,
        bank_account_id:
          bank_account_id !== undefined
            ? bank_account_id
            : transaction.bank_account_id,
        cash_drawer_id:
          cash_drawer_id !== undefined
            ? cash_drawer_id
            : transaction.cash_drawer_id,
        description:
          description !== undefined ? description : transaction.description,
        status: status || transaction.status,
        reference_document:
          reference_document !== undefined
            ? reference_document
            : transaction.reference_document,
      },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    // Get the updated transaction with related data
    const updatedTransaction = await Transaction.findByPk(id, {
      include: [
        { model: TransactionType, as: "transactionType" },
        { model: PaymentMethod, as: "paymentMethod" },
        { model: BankAccount, as: "bankAccount" },
        { model: CashDrawer, as: "cashDrawer" },
        { model: TransactionDetail, as: "transactionDetails" },
      ],
    });

    return res.status(200).json(updatedTransaction);
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error updating transaction:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.Transaction.sequelize;
  const dbTransaction = await sequelizeInstance.transaction();

  const Transaction = db.Transaction; // Use the Transaction model from the database instance
  const TransactionType = db.TransactionType; // Use the TransactionType model from the database instance
  const BankAccount = db.BankAccount; // Use the BankAccount model from the database instance
  const CashDrawer = db.CashDrawer; // Use the CashDrawer model from the database instance
  const TransactionDetail = db.TransactionDetail; // Use the TransactionDetail model from the database instance

  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id, {
      include: [{ model: TransactionType, as: "transactionType" }],
      transaction: dbTransaction,
    });

    if (!transaction) {
      await dbTransaction.rollback();
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Revert balance changes
    if (
      transaction.transactionType &&
      (transaction.bank_account_id || transaction.cash_drawer_id)
    ) {
      if (transaction.bank_account_id) {
        const bankAccount = await BankAccount.findByPk(
          transaction.bank_account_id,
          { transaction: dbTransaction }
        );
        if (bankAccount) {
          if (transaction.transactionType.flow_direction === "in") {
            bankAccount.current_balance -= transaction.amount;
          } else if (transaction.transactionType.flow_direction === "out") {
            bankAccount.current_balance += transaction.amount;
          }
          await bankAccount.save({ transaction: dbTransaction });
        }
      } else if (transaction.cash_drawer_id) {
        const cashDrawer = await CashDrawer.findByPk(
          transaction.cash_drawer_id,
          { transaction: dbTransaction }
        );
        if (cashDrawer) {
          if (transaction.transactionType.flow_direction === "in") {
            cashDrawer.current_balance -= transaction.amount;
          } else if (transaction.transactionType.flow_direction === "out") {
            cashDrawer.current_balance += transaction.amount;
          }
          await cashDrawer.save({ transaction: dbTransaction });
        }
      }
    }

    // Delete transaction details first
    await TransactionDetail.destroy({
      where: { transaction_id: id },
      transaction: dbTransaction,
    });

    // Then delete the transaction
    await transaction.destroy({ transaction: dbTransaction });
    await dbTransaction.commit();

    return res
      .status(200)
      .json({ message: "Transaction deleted successfully" });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error deleting transaction:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
