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
				allowNull: false
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Session.hasOne(GameCompletion); // session_id (FK)
				}
			},
			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'game_completions'
		});

	return GameCompletion;
};