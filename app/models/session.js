/**
 * Session
 * ===========
 * id, started_at, last_event_at, role, scenario, tap_to_visit, device_id (FK), draft_state_id (FK), completion_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	var Session = sequelize.define('Session',
		// Column definitions
		{
			started_at: {
				type: DataTypes.DATE,
				allowNull: false
			},
			last_event_at: {
				type: DataTypes.DATE,
				allowNull: false
			},
			role: {
				type: DataTypes.STRING
			},
			scenario: {
				type: DataTypes.STRING
			},
			tap_to_visit: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			device_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			draft_state_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			completion_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Device.hasMany(Session, {
						foreignKey: 'device_id'
					});
					models.DraftState.hasMany(Session, {
						foreignKey: 'draft_state_id'
					});
					models.GameCompletion.hasOne(Session, {
						foreignKey: 'completion_id'
					});

				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'sessions'
		});

	return Session;
};