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
				allowNull: true,
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
			setterMethods: {
				draft_id: function(draft_id) {
					this.draftId = draft_id
				},
				game_event_id: function(game_event_id) {
					this.gameEventId = game_event_id
				}
			},
			getterMethods: {
				draft_id: function() {
					return this.draftId
				},
				game_event_id: function() {
					return this.gameEventId
				}
			},
			classMethods: {
				associate: function(models) {
					// Foreign keys from CustomEventTrigger to other models
					// custom_event_trigger.event_id
					CustomEventTrigger.belongsTo(models.CustomEvent, {
						foreignKey: 'event_id'
					});

					CustomEventTrigger.belongsTo(models.Session, {
						foreignKey: 'session_id'
					});
				},

				setupHooks: function(models) {
					CustomEventTrigger.beforeCreate(function(custom_event_trigger, callback) {
						createParentCustomEvent(models, custom_event_trigger, callback);
					})
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'custom_event_triggers'
		});

	return CustomEventTrigger;
};

var createParentCustomEvent = function(models, custom_event_trigger, callback) {
	models.CustomEvent
		.create({
				event_id: custom_event_trigger.game_event_id,
				draft_id: custom_event_trigger.draft_id, 
				name: custom_event_trigger.event_name,
		})
		.success(function(custom_event, created) {
			callback(null, custom_event_trigger);
		})
		.error(function(error) {
			// NOTE: Somewhat of a workaround to the parallel nature of the event API requests
			// The unique index on custom_events prevents there from being two rows with the same event_id/draft_id combination
			// Need to find a better way of creating the unique custom events per game
			// Maybe an API call to analytics from the editor on creation? Would be a simple POST for creation and PUT for event name change
			if (error.code == 'ER_DUP_ENTRY'){
				callback(null, custom_event_trigger);
				return;
			}

			callback(error, null);
		});
}