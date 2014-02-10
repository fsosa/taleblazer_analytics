/**
 * Event
 * ===========
 * id, name
 */

module.exports = function(sequelize, DataTypes) {
	var Event = sequelize.define('Event',
		// Column definitions
		{
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
			tableName: 'events'
		});

	return Event;
};