/**
 * Agent Bump
 * ===========
 * id, bump_type, occurred_at, session_id (FK), agent_id (FK)
 *
 */

module.exports = function(sequelize, DataTypes) {
	var AgentBump = sequelize.define('AgentBump',
		// Column definitions
		{
			bump_type: {
				type: DataTypes.ENUM('INV', 'GPS', 'TAP', 'HUD'),
				allowNull: false
			},
			occurred_at: {
				type: DataTypes.DATE,
				allowNull: false
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Session.hasMany(AgentBump); // session_id (FK)
					models.Agent.hasMany(AgentBump); // agent_id (FK)
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'agent_bumps'
		});

	return AgentBump;
};