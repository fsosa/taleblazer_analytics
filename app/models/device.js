/**
 * Device
 * ===========
 * id, device_id, os_type, os_version, screen_resolution, model
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Device', {
		device_id: DataTypes.STRING,
		os_type: DataTypes.ENUM('android', 'ios'),
		os_version: DataTypes.STRING,
		screen_resolution: DataTypes.STRING,
		model: DataTypes.STRING
	}, {
		// Database table name
		tableName: 'devices'
	});
};