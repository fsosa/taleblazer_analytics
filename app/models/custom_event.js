/**
 * Custom Event
 * ===========
 * id, value, occurred_at, session_id (FK), event_id (FK)
 *
 */

module.exports = function(sequelize, DataTypes) {
	var CustomEvent = sequelize.define('CustomEvent',
		// Column definitions
		{
			value: {
				type: DataTypes.STRING,
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
					models.Session.hasMany(CustomEvent); // session_id (FK)
					models.Event.hasMany(CustomEvent); // event_id (FK)
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'custom_events'
		});

	return CustomEvent;
};