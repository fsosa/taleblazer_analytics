/**
 * Device
 * ===========
 * id, device_id, os_type, os_version, screen_resolution, model
 */

module.exports = function(sequelize, DataTypes) {
	var Device = sequelize.define('Device',
		// Column definitions
		{
			device_id: {
				type: DataTypes.STRING,
				allowNull: false
			},
			os_type: {
				type: DataTypes.ENUM('android', 'ios'),
				allowNull: false
			},
			os_version: {
				type: DataTypes.STRING,
				allowNull: false
			},
			model: {
				type: DataTypes.STRING,
				allowNull: false
			},
			screen_resolution: {
				type: DataTypes.STRING
			}
		},
		// Configuration options
		{
			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'devices'
		});

	return Device;
};