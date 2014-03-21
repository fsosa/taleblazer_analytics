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
					// Foreign key from other models to this one (i.e. they exist on the other models)
				}
			},
			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'game_completions'
		});

	return GameCompletion;
};
