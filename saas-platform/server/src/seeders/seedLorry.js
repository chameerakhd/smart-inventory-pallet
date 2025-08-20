const db = require("../models");

const seedLorry = async () => {
  try {
    await db.sequelize.authenticate(); // Ensure DB connection
    console.log("Database connected.");

    const lorryData = {
      lorry_number: "WP-AB-1234",
      driver_name: "John Doe",
      contact_number: "0712345678",
      active: true,
    };

    const existingLorry = await db.Lorry.findOne({
      where: { lorry_number: lorryData.lorry_number },
    });

    if (!existingLorry) {
      await db.Lorry.create(lorryData);
      console.log(`Lorry '${lorryData.lorry_number}' added.`);
    } else {
      console.log(`Lorry '${lorryData.lorry_number}' already exists.`);
    }
  } catch (error) {
    console.error("Error seeding lorry:", error);
  } finally {
    await db.sequelize.close(); // Close DB connection properly
    console.log("Seeding complete.");
    process.exit(0);
  }
};

seedLorry();
