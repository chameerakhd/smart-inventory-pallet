// const db = require("../models");
// const User = db.User;
const jwt = require("jsonwebtoken");

// Handle user login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Find user by username
    const User = req.db.User; // Use the User model from the database instance
    const user = await User.findOne({
      where: { username: username },
    });

    if (!user) {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords using bcrypt
    const isPasswordValid = await user.validatePassword(password);
    console.log("Password valid: ", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "jwtsecretkey",
      { expiresIn: process.env.JWT_EXPIRES || "6h" }
    );

    // Return token and user info (excluding password)
    const userWithoutPassword = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log("Login successful");

    res.status(200).json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Login failed",
    });
  }
};

// Verify token and return user data
exports.verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // decode JWT token into token, secret_key, user_data & exp_time
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired" });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check if username already exists
    const User = req.db.User; // Use the User model from the database instance
    const existingUser = await User.findOne({
      where: { username: username },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user
    const newUser = await User.create({
      username,
      password, // Will be hashed by model hooks
      role: role || "user", // Default to user role if not specified
    });

    // Generate token for new user
    const token = jwt.sign(
      { id: newUser.user_id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || "jwtsecretkey",
      { expiresIn: process.env.JWT_EXPIRES || "6h" }
    );

    // Return without password
    const userWithoutPassword = {
      user_id: newUser.user_id,
      username: newUser.username,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.status(201).json({
      message: "Registration successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Registration failed",
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const User = req.db.User; // Use the User model from the database instance
    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if requesting user has admin role
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Permission denied" });
    }
    const User = req.db.User; // Use the User model from the database instance
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions - only admins can update other users
    if (req.userRole !== "admin" && req.userId != id) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Don't allow role changes unless admin
    if (req.body.role && req.userRole !== "admin") {
      delete req.body.role;
    }
    const User = req.db.User; // Use the User model from the database instance
    const [updated] = await User.update(req.body, {
      where: { user_id: id },
    });

    if (updated) {
      const updatedUser = await User.findOne({
        where: { user_id: id },
        attributes: { exclude: ["password"] },
      });

      return res.status(200).json(updatedUser);
    }

    throw new Error("User not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete user (admin only or self-delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions - only admins can delete other users
    if (req.userRole !== "admin" && req.userId != id) {
      return res.status(403).json({ message: "Permission denied" });
    }
    const User = req.db.User; // Use the User model from the database instance
    const deleted = await User.destroy({
      where: { user_id: id },
    });

    if (deleted) {
      return res.status(204).send("User deleted");
    }

    throw new Error("User not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    const User = req.db.User; // Use the User model from the database instance
    // Find the user
    const user = await User.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.validatePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to change password",
    });
  }
};
