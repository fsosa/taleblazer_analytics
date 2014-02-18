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
					isIn: {
						args: [
							['android', 'ios']
						],
						msg: 'os_type must be either \'android\' or \'ios\''
					}
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
			classMethods: {
				associate: function(models) {
					// Foreign keys from other models to Device (i.e. they exist on the other models)
					Device.hasMany(models.Session, {
						foreignKey: 'device_id'
					});
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'devices'
		});

	return Device;
};