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
				allowNull: false,
				validate: {
					notNull: true,
					notEmpty: true,
					isIn: [
						['INV', 'GPS', 'TAP', 'HUD']
					]
				}
			},
			occurred_at: {
				type: DataTypes.DATE,
				allowNull: false,
				validate: {
					notNull: true,
					isDate: true
				}
			},
			session_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				validate: {
					notNull: true,
					isInt: true
				}
			},
			agent_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				validate: {
					notNull: true,
					isInt: true
				}
			},
			agent_name: {
				type: DataTypes.STRING,
				allowNull: false,
				validat: {
					notNull: true
				}
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					// Foreign keys from AgentBump to other models
					// agent_bump.session_id
					AgentBump.belongsTo(models.Session, {
						foreignKey: 'session_id'
					});
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'agent_bumps'
		});

	return AgentBump;
};
