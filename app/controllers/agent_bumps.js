var db = require('../models');
var _ = require('underscore');
var moment = require('moment');
var csv = require('express-csv');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default', // Consider renaming this to DATE b/c that's what it really is
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
};

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;

	// Render the page if it's not an AJAX request 
	// TODO: or JSON/CSV
	if (!req.xhr) {
		res.render('agent-bumps.ect', {
			draft_id: draft_id,
			title: 'Agent Bumps', 
			script: 'overview.js'
		})

		return;
	}

	// Otherwise we start processing the API call
	var start_time = req.query.start_time;
	var end_time = req.query.end_time;
	var categorize_by = req.query.categorize_by;
	// TODO: ADD TYPE options (JSON or CSV)
	

	if (start_time == null || end_time == null) {
		res.jerror(400, 'start_time and end_time parameters are required');
		return;
	}


};
