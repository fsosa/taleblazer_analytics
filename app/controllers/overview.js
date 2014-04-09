var db = require('../models');
var _ = require('underscore');
var moment = require('moment');

/**
 * Given a draft id and a time range,
 * Returns:
 * - Number of sessions initiated
 * - Number of sessions completed
 * - Average completion time
 * - Number of downloads (Note: from draft_state.download_count)
 *
 */
exports.index = function(req, res, next) {
	var draft_id = req.params.draft_id;

	// Render the page if it's not an AJAX request
	if (!req.xhr) {
		res.render('overview.ect', {
			draft_id: draft_id,
			title: 'Overview',
			script: 'overview.js'
		});

		return;
	}

	var start_time = req.query.start_time;
	var end_time = req.query.end_time;

	if (start_time == null || end_time == null) {
		res.jerror(400, 'start_time and end_time parameters are required');
		return;
	} else {
		start_time = new Date(parseInt(start_time));
		end_time = new Date(parseInt(end_time));
	}

	var SessionService = req.app.services.SessionService;

	// Get the list of sessions for the draft between the start and end time
	SessionService.getSessions(draft_id, start_time, end_time, null, function(sessions, error) {
		if(error) {
			next(error);
		} else {
			if (sessions) {
				var stats = calculateSessionStats(sessions);
				res.jsend(stats);
			}
		}
	})

};


/////////////////////
// Utility Methods //
/////////////////////

var calculateSessionStats = function(sessions) {
	var stats = {
		sessions_initiated: sessions.length
	};

	var sessions_completed = 0;
	var sum_completion_time = 0;

	for (i = 0; i < sessions.length; i++) {
		var session = sessions[i];

		if (session.completed) {
			sessions_completed = sessions_completed + 1;

			var game_length_sec = (session.last_event_at - session.started_at) / 1000;

			sum_completion_time = sum_completion_time + game_length_sec;
		}
	}

	stats.sessions_completed = sessions_completed;

	var avg_completion_time = (sessions_completed == 0) ? 0 : Math.round((sum_completion_time / sessions_completed) / 60);
	stats.avg_completion_time = avg_completion_time;

	stats.download_count = 0;

	return stats;
};
