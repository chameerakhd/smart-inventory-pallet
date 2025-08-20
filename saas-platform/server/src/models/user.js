"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Add associations if needed
      // For example, if users can create transactions:
      // User.hasMany(models.UnloadingTransaction, {
      //   foreignKey: "unloaded_by",
      //   as: "unloadingTransactions",
      // });
      // User.hasMany(models.LoadingTransaction, {
      //   foreignKey: "loaded_by",
      //   as: "loadingTransactions",
      // });
    }

    // Method to check password validity
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }

  User.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "user",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      timestamps: true,
      underscored: true,
      hooks: {
        // Hash password before saving
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};

// INSERT INTO public."Users" (username, password, role, created_at, updated_at)
// VALUES
//     ('admin', '$2b$10$X5mFnNfvMT.l1VMEB7J5i.YRxPJf1bZ7aJaGNAkH2XeBDXzRQJGPy', 'admin', NOW(), NOW()), -- password: admin123
//     ('manager', '$2b$10$lqPqHIoHLUID1SwRnj6cne.bJ.Z.mV1o5hCJx3y92RLaQH9QkKSk', 'manager', NOW(), NOW()); -- password: manager123
