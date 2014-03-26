var db = require('../models');
var _ = require('underscore');
var moment = require('moment');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default',
	GAME_VERSION: 'game_version',
	ROLE: 'roles',
	SCENARIO: 'scenarios'
};

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;

	// Render the page if it's not an AJAX request
	if (!req.xhr) {
		res.render('games-initiated.ect', {
			draft_id: draft_id,
			title: 'Games Played',
			script: 'overview.js'
		});
		return;
	}

	// Otherwise we start processing the query
	var start_time = req.body.start_time || req.query.start_time;
	var end_time = req.body.end_time || req.query.end_time;
	var categorize_by = req.body.categorize_by || req.query.categorize_by;

	if (start_time == null || end_time == null) {
		res.jerror(400, "start_time and end_time parameters are required");
		return;
	}

	var query_options = getCategorizeQueryOptions(categorize_by);

	getSessions(draft_id, start_time, end_time, next, query_options, function(sessions) {
		if (sessions) {
			// needs to bucket by categories
			// make a method
			var bucketed_values = {};

			var session_values = _.map(sessions.rows, function(session) {
				var sess = session.values;
				sess = _.omit(sess, 'id');
				var dateString = moment(sess.started_at).format('MMM D YYYY');
				sess.started_at = moment(sess.started_at).format('MMM D YYYY');
				sess.completed = (sess.completed == true);

				if (bucketed_values[dateString] == null) {
					if (sess.completed) {
						bucketed_values[dateString] = {
							initiated: 0,
							completed: sess.count
						};
					} else {
						bucketed_values[dateString] = {
							initiated: sess.count,
							completed: 0
						};
					}
				} else {
					if (sess.completed) {
						bucketed_values[dateString].completed = bucketed_values[dateString].completed + sess.count;
					} else {
						bucketed_values[dateString].initiated = bucketed_values[dateString].initiated + sess.count;
					}
				}
				return sess;
			});

			var results = _.map(Object.keys(bucketed_values), function(date) {
				var x = {
					date: date,
					total_games: (bucketed_values[date].completed + bucketed_values[date].initiated)
				};
				_.extend(x, bucketed_values[date]);
				return x;
			});

			data = {
				results: results,
			};

			if (req.xhr) {
				res.jsend(200, data);
			}
		}
	});


};

/////////////////////
// Utility Methods //
/////////////////////

/**
 * Given a category type, returns an object containing conditions for the Session query
 * @param  {String} categorize_by 	CATEGORIZE_TYPE 
 * @return {Object}                	- object with 'attributes' and 'group' options as used in Sequelize queries
 *                                    - attributes: Array of columns to return in the query result 
 *                                    - group: Array of grouping options
 *                                    - See: http://sequelizejs.com/docs/latest/models#finders
 */
var getCategorizeQueryOptions = function(categorize_by) {
	var attributes = null;
	var group = null;

	switch (categorize_by) {
		case CATEGORIZE_TYPE.DEFAULT:
			attributes = ['started_at', 'completed', [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = [db.sequelize.fn('DATE', db.sequelize.col('started_at')), 'completed'];
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			attributes = ['draft_state_id', 'started_at', 'completed', [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = [db.sequelize.fn('DATE', db.sequelize.col('started_at')), 'draft_state_id'];
			break;
		case CATEGORIZE_TYPE.ROLE:
			attributes = ['role_id', 'role_name', 'started_at', 'completed', [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = [db.sequelize.fn('DATE', db.sequelize.col('started_at')), 'role_id'];
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			attributes = ['scenario_id', 'scenario_name', 'started_at', 'completed', [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = [db.sequelize.fn('DATE', db.sequelize.col('started_at')), 'scenario_id'];
			break;
	}

	var options = {
		attributes: attributes,
		group: group
	};

	return options;
};

/**
 * Gets a list of sessions for the given draft, started between the start and end time
 * @param  {String}   draft_id   			[ID of the draft (game)]
 * @param  {String}   start_time 			[number of milliseconds from unix epoch]
 * @param  {String}   end_time   			[number of milliseconds from unix epoch]
 * @param  {Function} next       			[Express middleware function (for error processing)]
 * @param  {[type]}   queryConditions    	[object containing 'attributes' and 'group' arrays representing Sequelize query conditions]
 * @param  {Function} callback   			[function to call once queries have been processed]
 * @return {Array}              			[results of query as Session objects]
 */
var getSessions = function(draft_id, start_time, end_time, next, queryConditions, callback) {
	// Retrieve a list of all published draft states and then find all sessions pertaining to those
	start_time = new Date(parseInt(start_time));
	end_time = new Date(parseInt(end_time));

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
					attributes: queryConditions.attributes,
					group: queryConditions.group
				})
				.success(function(sessions) {
					callback(sessions);
				})
				.error(function(error) {
					next(error);
				});
		})
		.error(function(error) {
			next(error);
		});
};