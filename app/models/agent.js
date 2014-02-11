/**
 * Agent
 * ===========
 * id, in_game_id, name
 */

module.exports = function(sequelize, DataTypes) {
	var Agent = sequelize.define('Agent',
		// Column definitions
		{
			in_game_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false
			}
		},
		// Configuration options
		{
			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'agents'
		});

	return Agent;
};