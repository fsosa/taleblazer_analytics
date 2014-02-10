/**
 * Game
 * ===========
 * id, user_id, organization_id
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Game', {
		user_id: DataTypes.INTEGER,
		organization_id: DataTypes.INTEGER
	}, {
		// Database table name
		tableName: 'games'
	});
};