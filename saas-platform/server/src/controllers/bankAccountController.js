// Get all bank accounts
exports.getAllBankAccounts = async (req, res) => {
  try {
    const BankAccount = req.db.BankAccount; // Use the BankAccount model from the database instance
    const bankAccounts = await BankAccount.findAll();
    return res.status(200).json(bankAccounts);
  } catch (error) {
    console.error("Error getting bank accounts:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get bank account by ID
exports.getBankAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const BankAccount = req.db.BankAccount; // Use the BankAccount model from the database instance
    const bankAccount = await BankAccount.findByPk(id);

    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    return res.status(200).json(bankAccount);
  } catch (error) {
    console.error("Error getting bank account:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Create a new bank account
exports.createBankAccount = async (req, res) => {
  try {
    const {
      bank_name,
      account_number,
      account_name,
      current_balance,
      account_type,
    } = req.body;

    const BankAccount = req.db.BankAccount; // Use the BankAccount model from the database instance

    // Validation
    if (!bank_name) {
      return res.status(400).json({ message: "Bank name is required" });
    }

    if (!account_number) {
      return res.status(400).json({ message: "Account number is required" });
    }

    if (!account_name) {
      return res.status(400).json({ message: "Account name is required" });
    }

    if (!account_type) {
      return res.status(400).json({ message: "Account type is required" });
    }

    const newBankAccount = await BankAccount.create({
      bank_name,
      account_number,
      account_name,
      current_balance: current_balance || 0,
      account_type,
    });

    return res.status(201).json(newBankAccount);
  } catch (error) {
    console.error("Error creating bank account:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Update a bank account
exports.updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bank_name,
      account_number,
      account_name,
      current_balance,
      account_type,
    } = req.body;

    const BankAccount = req.db.BankAccount; // Use the BankAccount model from the database instance

    const bankAccount = await BankAccount.findByPk(id);

    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    // Update bank account fields
    await bankAccount.update({
      bank_name: bank_name || bankAccount.bank_name,
      account_number: account_number || bankAccount.account_number,
      account_name: account_name || bankAccount.account_name,
      current_balance:
        current_balance !== undefined
          ? current_balance
          : bankAccount.current_balance,
      account_type: account_type || bankAccount.account_type,
    });

    return res.status(200).json(bankAccount);
  } catch (error) {
    console.error("Error updating bank account:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a bank account
exports.deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const BankAccount = req.db.BankAccount; // Use the BankAccount model from the database instance
    const bankAccount = await BankAccount.findByPk(id);

    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    await bankAccount.destroy();
    return res
      .status(200)
      .json({ message: "Bank account deleted successfully" });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
