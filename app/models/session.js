/**
 * Session
 * ===========
 * id, started_at, last_event_at, role, scenario, tap_to_visit, device_id (FK), draft_state_id (FK), completion_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	var Session = sequelize.define('Session',
		// Column definitions
		{
			started_at: {
				type: DataTypes.DATE,
				allowNull: false,
				validate: {
					notNull: true,
					isDate: true,
					isFirstDate: function(start_date) {
						if (start_date > this.last_event_at) {
							throw new Error('started_at must be less than or equal to last_event_at');
						}
					}
				}
			},
			last_event_at: {
				type: DataTypes.DATE,
				allowNull: false,
				validate: {
					notNull: true,
					isDate: true
				}
			},
			role_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					isInt: true
				}
			},
			role_name: {
				type: DataTypes.STRING,
				allowNull: true
			},
			scenario_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					isInt: true
				}
			},
			scenario_name: {
				type: DataTypes.STRING,
				allowNull: true
			},
			tap_to_visit: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			device_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				validate: {
					notNull: true,
					isInt: true
				}
			},
			draft_state_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				validate: {
					notNull: true,
					isInt: true
				}
			},
			completed: {
				type:DataTypes.BOOLEAN, 
				allowNull: true
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					// Foreign keys from other models to Session (i.e. they exist on the other models)
					Session.hasMany(models.AgentBump, {
						foreignKey: 'session_id'
					});

					Session.hasMany(models.RegionSwitch, {
						foreignKey: 'session_id'
					});

					Session.hasOne(models.GameCompletion, {
						foreignKey: 'session_id'
					});

					Session.hasMany(models.CustomEventTrigger, {
						foreignKey: 'session_id'
					});

					// Foreign keys from Session to other models
					// session.device_id
					Session.belongsTo(models.Device, {
						foreignKey: 'device_id'
					});

					// session.draft_state_id
					Session.belongsTo(models.DraftState, {
						foreignKey: 'draft_state_id'
					});


				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'sessions'
		});

	return Session;
};
