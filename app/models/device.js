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
				allowNull: false,
				unique: true,
				validate: {
					notEmpty: true
				}
			},
			os_type: {
				type: DataTypes.ENUM('android', 'ios'),
				allowNull: false,
				validate: {
					notEmpty: true, 
					isIn: [['android', 'ios']]
				}
			},
			os_version: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notEmpty: true
				}
			},
			model: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notEmpty: true
				}
			},
			screen_resolution: {
				type: DataTypes.STRING,
				validate: {
					notEmpty: true
				}
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