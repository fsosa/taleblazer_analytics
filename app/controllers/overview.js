var db = require('../models');
var _ = require('underscore');
var moment = require('moment');
var utils = require('../utils/utils');

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

		utils.getPageVariables(draft_id, function(error, page_vars) {
			if (error) {
				next(error);
			} else {
				renderPage(res, page_vars);
			}
		});

		return;
	}

	// Otherwise, process the API request
	var start_time = req.query.start_time;
	var end_time = req.query.end_time;

	if (start_time == null || end_time == null) {
		res.jerror(400, 'start_time and end_time parameters are required');
		return;
	}

	// Get the list of sessions for the draft between the start and end time
	var sessions = getSessionsAndDownloadCount(draft_id, start_time, end_time, next,
		function(results) {
			if (results) {
				var stats = getSessionStats(results);
				res.jsend(200, stats);
			}
		});

};


/////////////////////
// Utility Methods //
/////////////////////

var renderPage = function(res, page_vars) {
	res.render('overview.ect', {
		draft_id: page_vars.draft_id,
		title: 'Overview',
		draftStateTitle: page_vars.draft_title,
		customEvents: page_vars.custom_events,
		defaultCategorization: 'Date'
	});
};

var getSessionStats = function(results) {
	var sessions = results.sessions;

	var stats = {
		sessions_initiated: sessions.count
	};

	var sessions_completed = 0;
	var sum_completion_time = 0;

	for (i = 0; i < sessions.rows.length; i++) {
		var session = sessions.rows[i];
		if (session.completed) {
			sessions_completed = sessions_completed + 1;

			var game_length_sec = (session.last_event_at - session.started_at) / 1000;

			sum_completion_time = sum_completion_time + game_length_sec;
		}
	}

	stats.sessions_completed = sessions_completed;

	var avg_completion_time = (sessions_completed == 0) ? 0 : Math.round((sum_completion_time / sessions_completed) / 60);
	stats.avg_completion_time = avg_completion_time;

	stats.download_count = results.download_count;

	return stats;
};


var getSessionsAndDownloadCount = function(draft_id, start_time, end_time, next, callback) {
	// Retrieve a list of all published draft states and then find all sessions pertaining to those
	start_time = new Date(parseInt(start_time));
	end_time = new Date(parseInt(end_time));

	db.DraftState
		.findAll({
			where: {
				draft_id: draft_id,
				published_game: 1
			},
			attributes: ['id', 'download_count']
		})
		.success(function(results) {
			var draft_state_ids = [];
			var download_count = 0;

			_.each(results, function(draft_state) {
				draft_state_ids.push(draft_state.id);
				download_count += draft_state.download_count;
			});

			db.Session
				.findAndCountAll({
					where: {
						started_at: {
							between: [start_time, end_time]
						},
						draft_state_id: draft_state_ids
					}
				})
				.success(function(sessions) {
					var data = {
						sessions: sessions,
						download_count: download_count
					};

					callback(data);
				})
				.error(function(error) {
					next(error);
				});
		})
		.error(function(error) {
			next(error);
		});
};
