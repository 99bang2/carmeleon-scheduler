'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
	  try {
		  await queryInterface.addColumn('ev_charge_stations', 'location', {
			  type: Sequelize.STRING
		  });
		  await queryInterface.addColumn('ev_charge_stations', 'is_parking_free', {
			  type: Sequelize.BOOLEAN
		  });
		  await queryInterface.addColumn('ev_charge_stations', 'is_limit', {
			  type: Sequelize.BOOLEAN
		  });
		  await queryInterface.addColumn('ev_charge_stations', 'limit_detail', {
			  type: Sequelize.STRING
		  });
		  await queryInterface.addColumn('ev_charge_stations', 'is_charger_delete', {
			  type: Sequelize.BOOLEAN
		  });
		  await queryInterface.addColumn('ev_charge_stations', 'charger_delete_detail', {
			  type: Sequelize.STRING
		  });
		  return Promise.resolve();
	  } catch (e) {
		  return Promise.reject(e);
	  }
  },

  down: async (queryInterface, Sequelize) => {
	  try {
		  await queryInterface.removeColumn('ev_charge_stations', 'location');
		  await queryInterface.removeColumn('ev_charge_stations', 'is_parking_free');
		  await queryInterface.removeColumn('ev_charge_stations', 'is_limit');
		  await queryInterface.removeColumn('ev_charge_stations', 'limit_detail');
		  await queryInterface.removeColumn('ev_charge_stations', 'is_charger_delete');
		  await queryInterface.removeColumn('ev_charge_stations', 'charger_delete_detail');
		  return Promise.resolve();
	  } catch (e) {
		  return Promise.reject(e);
	  }
  }
};
