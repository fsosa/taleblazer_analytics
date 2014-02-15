/**
 * Custom Event Triggers
 * ===========
 * id, value, occurred_at, session_id (FK), event_id (FK)
 *
 */

module.exports = function(sequelize, DataTypes) {
	var CustomEventTriggers = sequelize.define('CustomEventTriggers',
		// Column definitions
		{
			value: {
				type: DataTypes.STRING,
				allowNull: false
			},
			occurred_at: {
				type: DataTypes.DATE,
				allowNull: false
			},
			session_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			event_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Session.hasMany(CustomEventTriggers, {
						foreignKey: 'session_id'
					});
					models.CustomEvent.hasMany(CustomEventTriggers, {
						foreignKey: 'event_id'
					});
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'custom_event_triggers'
		});

	return CustomEventTriggers;
};