/**
 * Agent Bumps
 * ===========
 * id, bump_type, occurred_at, session_id (FK), agent_id (FK)
 *
 */

module.exports = function(sequelize, DataTypes) {
	var AgentBump = sequelize.define('Agent Bump', {
		bump_type: DataTypes.ENUM('INV', 'GPS', 'TAP', 'HUD'),
		occurred_at: DataTypes.DATE
	}, {

		classMethods: {
			associate: function(models) {
				models.Session.hasMany(AgentBump); // adds session_id ?
				models.Agent.hasMany(AgentBump);   // adds agent_id ?
			}
		},

		// Timestamp attributes are underscored
		underscored: true,

		// Database table name
		tableName: 'agent_bumps'
	});

	return AgentBump;
};
