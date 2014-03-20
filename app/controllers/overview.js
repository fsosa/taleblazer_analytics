var db = require('../models');
var _ = require('underscore');
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
	var draft_id = req.body.draft_id;
	var start_time = req.body.start_time;
	var end_time = req.body.end_time;

	if (draft_id == null || start_time == null || end_time == null) {
		res.jerror(400, 'Missing required parameter');
		return;
	}

	// Get the list of sessions for the draft between the start and end time
	var sessions = getSessions(draft_id, start_time, end_time, next,
		function(results, err) {
			if (err) {
				next(err);
			} else {
				var stats = getSessionStats(results);
				res.jsend(stats);
			}
		});

};


/////////////////////
// Utility Methods //
/////////////////////

var getSessionStats = function(sessions) {
	var stats = {
		sessions_initiated: sessions.count,
	}

	var sessions_completed = 0;
	var sum_completion_time = 0;

	for(i = 0; i < sessions.rows.length; i++) {
		var session = sessions.rows[i]
		if (session.completion_id != null) {
			sessions_completed = sessions_completed + 1;	

			var game_length_sec = (session.last_event_at - session.started_at) / 1000;

			console.log(game_length_sec);
			sum_completion_time = sum_completion_time  + game_length_sec;
		}
	}

	stats.sessions_completed = sessions_completed;
	stats.avg_completion_time = Math.round( ( sum_completion_time  / sessions_completed ) / 60 );

	return stats;
}


var getSessions = function(draft_id, start_time, end_time, next, callback) {
	// Retrieve a list of all published draft states and then find all sessions pertaining to those
	db.DraftState
		.findAll({
			where: {
				draft_id: draft_id,
				published_game: 1
			},
			attributes: ['id'],
		})
		.success(function(results) {
			var draft_state_ids = _.map(results, function(result) {
				return result.values['id'];
			})

			db.Session
				.findAndCountAll({
					where: {
						started_at: {
							between: [start_time, end_time]
						},
						draft_state_id: draft_state_ids // IN LIST
					}
				})
				.success(function(sessions) {
					callback(sessions, null);
					return sessions;
				})
				.error(function(error) {
					next(error);
				});
		})
		.error(function(error) {
			next(error);
		});
};