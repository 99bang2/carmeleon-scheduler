'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
	  try {
		  await queryInterface.addColumn('ev_chargers', 'last_charge_start_date', {
			  type: Sequelize.STRING
		  });
		  await queryInterface.addColumn('ev_chargers', 'last_charge_end_date', {
			  type: Sequelize.STRING
		  });
		  await queryInterface.addColumn('ev_chargers', 'output', {
			  type: Sequelize.INTEGER
		  });
		  await queryInterface.addColumn('ev_chargers', 'method', {
			  type: Sequelize.STRING
		  });
		  return Promise.resolve();
	  } catch (e) {
		  return Promise.reject(e);
	  }
  },

  down: async (queryInterface, Sequelize) => {
	  try {
		  await queryInterface.removeColumn('ev_chargers', 'last_charge_start_date');
		  await queryInterface.removeColumn('ev_chargers', 'last_charge_end_date');
		  await queryInterface.removeColumn('ev_chargers', 'output');
		  await queryInterface.removeColumn('ev_chargers', 'method');
		  return Promise.resolve();
	  } catch (e) {
		  return Promise.reject(e);
	  }
  }
};
