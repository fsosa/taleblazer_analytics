/**
 * Drafts
 * ===========
 * id, draft_number, name, published_at, game_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Revisions', {
		draft_number: DataTypes.INTEGER,
		name: DataTypes.STRING,
		published_at: DataTypes.DATE
	}, {
		// Database table name
		tableName: 'drafts'
	});
};