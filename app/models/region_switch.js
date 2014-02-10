/**
 * Region Switch
 * ===========
 * id, occurred_at, session_id (FK), region_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Region Switch', {
		occurred_at: DataTypes.DATE
	}, {
		// Database table name
		tableName: 'region_switches'
	});
};