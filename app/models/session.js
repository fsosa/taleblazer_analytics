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
			role: {
				type: DataTypes.STRING
			},
			scenario: {
				type: DataTypes.STRING
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
			completion_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					isInt: true
				}
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Device.hasMany(Session, {
						foreignKey: 'device_id'
					});
					models.DraftState.hasMany(Session, {
						foreignKey: 'draft_state_id'
					});
					models.GameCompletion.hasOne(Session, {
						foreignKey: 'completion_id'
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