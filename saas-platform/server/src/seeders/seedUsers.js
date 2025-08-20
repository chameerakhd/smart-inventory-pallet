const bcrypt = require("bcrypt");
const db = require("../models");

const seedUsers = async () => {
  try {
    await db.sequelize.authenticate(); // Ensure DB connection
    console.log("Database connected.");

    const users = [
      {
        username: "cnhdistributors@gmail.com",
        password: "cnh_main@2533",
        role: "admin",
      },
    ];

    for (const user of users) {
      const existingUser = await db.User.findOne({
        where: { username: user.username },
      });

      if (!existingUser) {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.User.create({
          username: user.username,
          password: user.password,
          role: user.role,
        });
        console.log(`User '${user.password}' created.`);
      } else {
        console.log(`User '${user.username}' already exists.`);
      }
    }
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await db.sequelize.close(); // Close DB connection properly
    console.log("Seeding complete.");
    process.exit(0);
  }
};

seedUsers();
