/**
 * Region
 * ===========
 * id, in_game_id, name
 */

module.exports = function(sequelize, DataTypes) {
	var Region = sequelize.define('Region',
		// Column definition
		{
			in_game_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},

			name: {
				type: DataTypes.STRING,
				allowNull: false
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Session.hasMany(Region); // session_id (FK)
					models.Region.hasMany(Region); // region_id (FK)
				}
			},
			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'regions'
		});

	return Region;
};
