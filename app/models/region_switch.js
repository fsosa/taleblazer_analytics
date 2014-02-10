/**
 * Region Switch
 * ===========
 * id, occurred_at, session_id (FK), region_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	var RegionSwitch = sequelize.define('Region Switch',
		// Column definitions
		{
			occurred_at: {
				type: DataTypes.DATE,
				allowNull: false
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Session.hasMany(RegionSwitch); // session_id (FK)
					models.Region.hasMany(RegionSwitch); // region_id (FK)
				}
			},

			// Automatically added attributes are underscored
			underscored: true,


			// Database table name
			tableName: 'region_switches'
		});

	return RegionSwitch;
};