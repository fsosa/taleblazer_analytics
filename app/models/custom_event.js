/**
 * Custom Event
 * ===========
 * id, name
 */

module.exports = function(sequelize, DataTypes) {
	var CustomEvent = sequelize.define('CustomEvent',
		// Column definitions
		{
			event_id: {
				type: DataTypes.INTEGER, 
				allowNull: false, 
				unique: 'event_and_draft_id',
				validate: {
					notNull: true, 
					isInt: true
				}
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: true,
					notEmpty: false
				}
			},
			draft_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				unique: 'event_and_draft_id',
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
					// Foreign keys from other models to CustomEvent (i.e. they exist on the other models)
					CustomEvent.hasMany(models.CustomEventTrigger, {
						foreignKey: 'event_id'
					});

					// Foreign keys from CustomEvent to other models
					// custom_event.draft_id
					CustomEvent.belongsTo(models.Draft, {
						foreignKey: 'draft_id'
					});
				}, 
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'custom_events'
		});

	return CustomEvent;
};
