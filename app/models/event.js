/**
 * Custom Event
 * ===========
 * id, name
 */

module.exports = function(sequelize, DataTypes) {
	var CustomEvent = sequelize.define('CustomEvent',
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
			tableName: 'custom_events'
		});

	return CustomEvent;
};