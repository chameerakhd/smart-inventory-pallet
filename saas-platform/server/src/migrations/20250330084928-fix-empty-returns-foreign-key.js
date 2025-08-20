"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if the incorrect constraint exists before dropping it
    const [checkResults] = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_constraint WHERE conname = 'EmptyReturnsDetails_empty_return_detail_id_fkey' LIMIT 1;`
    );

    if (checkResults.length > 0) {
      // Only drop if the constraint exists
      await queryInterface.sequelize.query(
        'ALTER TABLE "EmptyReturnsDetails" DROP CONSTRAINT "EmptyReturnsDetails_empty_return_detail_id_fkey";'
      );
    }

    // Check if the correct constraint already exists
    const [constraintExists] = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_constraint WHERE conname = 'EmptyReturnsDetails_empty_return_id_fkey' LIMIT 1;`
    );

    if (constraintExists.length === 0) {
      // Only add if the constraint doesn't exist
      await queryInterface.sequelize.query(
        'ALTER TABLE "EmptyReturnsDetails" ADD CONSTRAINT "EmptyReturnsDetails_empty_return_id_fkey" FOREIGN KEY ("empty_return_id") REFERENCES "EmptyReturns" ("empty_return_id") ON DELETE CASCADE ON UPDATE CASCADE;'
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if constraint exists before trying to drop it
    const [constraintExists] = await queryInterface.sequelize.query(
      `SELECT 1 FROM pg_constraint WHERE conname = 'EmptyReturnsDetails_empty_return_id_fkey' LIMIT 1;`
    );

    if (constraintExists.length > 0) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "EmptyReturnsDetails" DROP CONSTRAINT IF EXISTS "EmptyReturnsDetails_empty_return_id_fkey";'
      );
    }
  },
};
