/**
 * Custom Event Triggers
 * ===========
 * id, value, occurred_at, session_id (FK), event_id (FK)
 *
 */

module.exports = function(sequelize, DataTypes) {
	var CustomEventTrigger = sequelize.define('CustomEventTrigger',
		// Column definitions
		{
			value: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: true
				}
			},
			event_name: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: true,
					notEmpty: true
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
			},
			event_id: {
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
					// Foreign keys from CustomEventTrigger to other models
					// custom_event_trigger.event_id
					CustomEventTrigger.belongsTo(models.CustomEvent, {
						foreignKey: 'event_id'
					});
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'custom_event_triggers'
		});

	return CustomEventTrigger;
};