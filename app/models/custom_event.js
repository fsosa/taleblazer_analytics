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
				allowNull: false,
				validate: {
					notNull: true,
					isEmpty: false
				}
			},
			draft_id: {
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
					models.Draft.hasMany(CustomEvent, {
						foreignKey: 'draft_id'
					});

					CustomEvent.belongsTo(models.Draft, {
						foreignKey: 'draft_id'
					});
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'custom_events'
		});

	return CustomEvent;
};