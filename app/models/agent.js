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
			classMethods: {
				associate: function(models) {
					// Set up one-way of the Agent-Draft n-m relationship
					Agent.hasMany(models.Draft, {through: 'draft_agents'}); 
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'agents'
		});

	return Agent;
};