/**
 * Region Switch
 * ===========
 * id, region_id, region_name, occurred_at, session_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	var RegionSwitch = sequelize.define('RegionSwitch',
		// Column definitions
		{
			region_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			region_name: {
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
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Session.hasMany(RegionSwitch, {
						foreignKey: 'session_id'
					});
				}
			},

			// Automatically added attributes are underscored
			underscored: true,


			// Database table name
			tableName: 'region_switches'
		});

	return RegionSwitch;
};