/**
 * Sessions
 * ===========
 * id, started_at, ended_at, role, scenario, tap_to_visit, device_id (FK), game_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Sessions', {
		started_at: DataTypes.DATE,
		ended_at: DataTypes.DATE,
		role: DataTypes.STRING,
		scenario: DataTypes.STRING,
		tap_to_visit: DataTypes.BOOLEAN
	}, {
		// Timestamp attributes are underscored
		underscored: true,

		// Database table name
		tableName: 'sessions'
	});
};