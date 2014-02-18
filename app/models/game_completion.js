/**
 * Game Completion
 * ===========
 * id, occurred_at, session_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	var GameCompletion = sequelize.define('GameCompletion',
		// Column definition
		{
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
					models.Session.hasOne(GameCompletion, {
						foreignKey: 'session_id'
					});
				},
				setupHooks: function(models) {
					// On successful creation of a game completion event, 
					// we update the session with the id of the event so as to
					// note that analytics for the session have been finalized

					GameCompletion.afterCreate(function(game_completion, callback) {
						models.Session
							.update(
								{ completion_id: game_completion.id },
								{ id: game_completion.session_id }
							).success(function(session) {
								callback(null, session);
							}).error(function(error) {
								callback(error, null);
							})
					});
				}
			},
			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'game_completions'
		});

	return GameCompletion;
};
