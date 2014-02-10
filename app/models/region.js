/**
 * Regions
 * ===========
 * id, in_game_id, name
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Regions', {
		in_game_id: DataTypes.INTEGER,
		name: DataTypes.STRING
	}, {
		// Database table name
		tableName: 'regions'
	});
};