/**
 * Games
 * ===========
 * id, user_id, organization_id
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Game', {
		user_id: DataTypes.INTEGER,
		organization_id: DataTypes.organization_id
	}, {
		// Database table name
		tableName: 'games'
	});
};