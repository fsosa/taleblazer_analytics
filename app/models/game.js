/**
 * Game
 * ===========
 * id, user_id, organization_id
 */

module.exports = function(sequelize, DataTypes) {
	var Game = sequelize.define('Game',
		// Column definitions
		{
			user_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			organization_id: {
				type: DataTypes.INTEGER
			}
		},
		// Configuration options
		{
			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'games'
		});

	return Game;
};