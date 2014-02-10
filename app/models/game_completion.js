/**
 * Game Completion
 * ===========
 * id, occurred_at, session_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Game Completion', {
		occurred_at: DataTypes.DATE
	}, {
		// Timestamp attributes are underscored
		underscored: true,

		// Database table name
		tableName: 'game_completions'
	});
};