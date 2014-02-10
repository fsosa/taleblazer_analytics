/**
 * Session
 * ===========
 * id, started_at, last_event_at, role, scenario, tap_to_visit, device_id (FK), draft_id (FK), completion_id (FK)
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
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Device.hasMany(Session); // device_id (FK)
					models.Draft.hasMany(Session); // draft_id (FK)
					models.GameCompletion.hasOne(Session); // completion_id (FK)

				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'sessions'
		});

	return Session;
};