/**
 * Draft
 * ===========
 *
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `game_code` varchar(255) NOT NULL,
  `save_draft_state_id` int(11) NOT NULL,
  `publish_draft_state_id` int(11) NOT NULL,
  `lat` float NOT NULL,
  `lon` float NOT NULL,
  `game_visibility_id` int(11) NOT NULL DEFAULT '1',
  `download_count` int(11) NOT NULL DEFAULT '0',
  `deleted` int(1) NOT NULL DEFAULT '0' COMMENT '0=not deleted, 1=user deleted, 2=deleted by system when user deleted account',
  `time_updated` datetime NOT NULL,
  `remix_count` int(11) NOT NULL DEFAULT '0',
  `favorites_count` int(11) NOT NULL DEFAULT '0' COMMENT 'Number of users that have this game in their favorites list.',
  `inappropriate` int(1) NOT NULL DEFAULT '0' COMMENT '0=not inappropriate, 1=inappropriate',
  `time_created` datetime NOT NULL,
  `time_published` datetime NOT NULL,
  `rating` int(11) NOT NULL DEFAULT '0',
  `number_of_raters` int(11) NOT NULL,
  `published` int(1) NOT NULL DEFAULT '0',
  `organization_draft_state_id` int(11) NOT NULL,
  `organization_id` int(11) NOT NULL,
 *
 *  NOTE: Many of these are not currently being used by our model
 */

module.exports = function(sequelize, DataTypes) {
	var Draft = sequelize.define('Draft',
		// Column definitions
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				allowNull: false
			},
			user_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			save_draft_state_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			publish_draft_state_id: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			game_visibility_id: {
				type: DataTypes.INTEGER,
				defaultValue: 1,
				allowNull: false
			},
			deleted: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				allowNull: false
			},
			time_updated: {
				type: DataTypes.DATE,
				allowNull: false
			},
			time_created: {
				type: DataTypes.DATE,
				allowNull: false
			},
			time_published: {
				type: DataTypes.DATE,
				allowNull: false
			}
		},
		// Configuration options
		{
			// Disable automatically added timestamp attributes
			timestamps: false,

			// Automatically added attributes and association methods are underscored
			underscored: true,

			// Database table name
			tableName: 'drafts',

			// This table uses MyISAM
			engine: 'MYISAM', 
		});

	return Draft;
};