var db = require('../models');
var _ = require('underscore');
var moment = require('moment');

var CATEGORIZE_TYPE = {
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario',
	DAY_TYPE: 'day_type'
}

exports.sessionsInitiated = function(req, res, next) {
	var draft_id = req.params.draft_id;
	var start_time = req.body.start_time || req.query.start_time;
	var end_time = req.body.end_time || req.query.end_time;

	if (start_time == null || end_time == null) {
		// Default: beginning of week to end of current day
		// start_time = moment().startOf('week');
		start_time = moment().subtract('days', 14);
		end_time = moment().endOf('day');
	} else {
		start_time = moment(start_time).startOf('day');
		end_time = moment(end_time).endOf('day');
	}

	getSessions(draft_id, start_time, end_time, next, function(sessions) {
		if (sessions) {
			var stats = getSessionStats(sessions);
			
			var session_values = _.map(sessions.rows, function(session) {
				var sess = session.values
				delete sess.created_at;
				delete sess.updated_at;
				return sess;
			})
		
			data = {
				sessions: session_values,
				stats: stats
			}

			if (req.xhr) {
				res.jsend(200, data);
			} else {
				res.render('games-initiated.ect', {
					draft_id: draft_id,
					title: 'Games Initiated',
					stats: stats,
					sessions: session_values,
					script: 'overview.js'
				})
			}

		}
	});


};

exports.sessionsCompleted = function(req, res, next) {

};

exports.completionTime = function(req, res, next) {

};

/////////////////////
// Utility Methods //
/////////////////////

var getSessionStats = function(sessions) {
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

	stats.download_count = 0;

	return stats;
};

var getSessions = function(draft_id, start_time, end_time, next, callback) {
	// Retrieve a list of all published draft states and then find all sessions pertaining to those
	start_time = start_time.toDate();
	end_time = end_time.toDate();

	db.DraftState
		.findAll({
			where: {
				draft_id: draft_id,
				published_game: 1
			},
			attributes: ['id']
		})
		.success(function(results) {
			var draft_state_ids = _.map(results, function(result) {
				return result.values['id'];
			});

			db.Session
				.findAndCountAll({
					where: {
						started_at: {
							between: [start_time, end_time]
						},
						draft_state_id: draft_state_ids
					},
					// attributes: [db.sequelize.col('*'), [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']],
					// group: [db.sequelize.fn('DATE', db.sequelize.col('started_at')), 'role_id'],
				})
				.success(function(sessions) {
					callback(sessions);
					return sessions; // WE DONT EVER GET HERE
				})
				.error(function(error) {
					next(error);
				});
		})
		.error(function(error) {
			next(error);
		});
};