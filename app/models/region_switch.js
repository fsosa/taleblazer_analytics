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
				allowNull: false,
				validate: {
					notNull: true,
					isInt: true
				}
			},
			region_name: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: true
				}
			},
			occurred_at: {
				type: DataTypes.DATE,
				allowNull: false,
				validate: {
					notNull: true,
					isDate: true
				}
			},
			session_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				validate: {
					notNull: true,
					isInt: true
				}
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					// Foreign keys from RegionSwitch to other models
					// region_switch.session_id
					RegionSwitch.belongsTo(models.Session, {
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