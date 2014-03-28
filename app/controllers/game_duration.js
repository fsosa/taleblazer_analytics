var db = require('../models');
var _ = require('underscore');
var moment = require('moment');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default', 
	GAME_VERSION: 'game_version', 
	ROLE: 'role', 
	SCENARIO: 'scenario'
}

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;

	// Render the page if it's not an AJAX request
	if(!req.xhr) {
		res.render('game-duration.ect', {
			draft_id: draft_id, 
			title: 'Gameplay Duration',
			script: 'overview.js' 
		});

		return;
	}

	// Otherwise we start processing the API call
	var start_time = req.query.start_time;
	var end_time = req.query.end_time;
	var categorize_by = req.query.categorize_by;
	// TODO: Add CSV option (which would just stop the bucketing from happening)
};

/////////////////////
// Utility Methods //
/////////////////////
