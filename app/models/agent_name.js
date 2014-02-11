/**
 * Agent Name
 * ===========
 * agent_id, agent_name
 */

module.exports = function(sequelize, DataTypes) {
	var AgentName = sequelize.define('AgentName',
		// Column definitions
		{
			agent_id: {
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
					models.Agent.hasMany(AgentName, {
						foreignKey: 'agent_id'
					});
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'agents'
		});

	return Agent;
};