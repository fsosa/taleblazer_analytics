/**
 * Draft State
 * ===========
 * `id` int(11) NOT NULL AUTO_INCREMENT,
 * `draft_id` int(11) NOT NULL,
 * `name` varchar(255) NOT NULL,
 * `description` text NOT NULL,
 * `intro` text NOT NULL,
 * `image` varchar(255) NOT NULL,
 * `game_file` mediumtext NOT NULL,
 * `time_saved` datetime NOT NULL,
 * `lon` varchar(255) NOT NULL,
 * `lat` varchar(255) NOT NULL,
 * `single_player` tinyint(1) NOT NULL,
 * `min_players` int(11) NOT NULL,
 * `max_players` int(11) NOT NULL,
 * `media_size` int(11) NOT NULL DEFAULT '0',
 * `published_game` tinyint(1) NOT NULL,
 * `location_type` varchar(256) NOT NULL,
 * `previous_draft_state_id` int(11) NOT NULL COMMENT
 *
 * NOTE: Many of these are not used in the model definition below
 */

module.exports = function(sequelize, DataTypes) {
	var DraftState = sequelize.define('DraftState',
		// Column definitions
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				allowNull: false
			},
			draft_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			name: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			time_saved: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			single_player: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			published_game: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			previous_draft_state_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			}, 
			version: {
				type: DataTypes.STRING, 
			}, 
			download_count: {
				type: DataTypes.INTEGER, 
			}

		},
		// Configuration options
		{
			classMethods: {
				associate: function(models) {
					// Foreign keys from other models to DraftState (i.e. they exist on the other models)
					DraftState.hasMany(models.Session, {
						foreignKey: 'draft_state_id'
					});
				}
			},

			// Disable automatically added timestamp attributes
			timestamps: false,

			// Automatically added attributes are underscored
			underscored: true,

			// Database table name
			tableName: 'draft_states',

			// This table uses MyISAM
			engine: 'MYISAM'

		});

	return DraftState;
};
