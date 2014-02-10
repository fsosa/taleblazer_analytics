/**
 * Draft
 * ===========
 * id, draft_number, name, published_at, game_id (FK)
 */

module.exports = function(sequelize, DataTypes) {
	var Draft = sequelize.define('Draft',
		// Column definitions
		{
			draft_number: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false
			},
			published_at: {
				type: DataTypes.DATE
			}
		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					models.Game.hasMany(Draft); // game_id (FK)

					// Set up one-way of the Agent-Draft n-m relationship
					Draft.hasMany(models.Agent, {through: 'draft_agents'}) 
				}
			},

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'drafts'
		});

	return Draft;
};