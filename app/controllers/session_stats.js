var db = require('../models');
var _ = require('underscore');
var moment = require('moment');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default', // Consider renaming this to DATE b/c that's what it really is
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
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

	// Otherwise we start processing the API call
	var start_time = req.query.start_time;
	var end_time = req.query.end_time;
	var categorize_by = req.query.categorize_by;
	// TODO: add CSV option (which would just stop the bucketing from happening)

	if (start_time == null || end_time == null) {
		res.jerror(400, 'start_time and end_time parameters are required');
		return;
	}

	var query_conditions = getQueryConditions(categorize_by);

	getSessions(draft_id, start_time, end_time, next, query_conditions, function(sessions) {
		if (sessions) {

			var results = getCalculatedStats(sessions, categorize_by);
			console.log(results);

			data = {
				results: results
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

var getCalculatedStats = function(sessions, categorize_type) {
	var stats = {};

	// Bucket sessions by 
	_.each(sessions, function(session) {
		var rawSession = session.values;
		rawSession = _.omit(rawSession, 'id'); // Remove the primary key

		var sessionComplete = (rawSession.completed == true);

		var bucketKey = getBucketKey(rawSession, categorize_type);

		var bucketValue = stats[bucketKey];

		if (bucketValue != null) {
			var valToIncrement = sessionComplete ? 'completed' : 'initiated';
			bucketValue[valToIncrement] += rawSession.count;
			bucketValue.total += rawSession.count;
		} else {
			var completed = sessionComplete ? rawSession.count : 0;
			var initiated = sessionComplete ? 0 : rawSession.count;

			stats[bucketKey] = {};
			stats[bucketKey][categorize_type] = bucketKey;
			stats[bucketKey].initiated = initiated;
			stats[bucketKey].completed = completed;
			stats[bucketKey].total = completed + initiated;
		}
	});

	var results = _.values(stats);

	return results;
};

var getBucketKey = function(session, categorize_type) {
	var bucket_key = null;
	switch (categorize_type) {
		case CATEGORIZE_TYPE.DEFAULT:
			bucket_key = moment(session.started_at).format('MMM D YYYY');
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			bucket_key = session.draft_state_id;
			break;
		case CATEGORIZE_TYPE.ROLE:
			bucket_key = session.role_id;
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			bucket_key = session.scenario_id;
			break;
		default:
			break;
	}

	return bucket_key;
};

/**
 * Given a category type, returns an object containing conditions for the Session query
 * @param  {String} categorize_by 	CATEGORIZE_TYPE
 * @return {Object}                	- object with 'attributes' and 'group' options as used in Sequelize queries
 *                                    - attributes: Array of columns to return in the query result
 *                                    - group: Array of grouping options
 *                                    - See: http://sequelizejs.com/docs/latest/models#finders
 *                                    	(specifically the section: "Manipulating the dataset with limit, offset, order and group")
 */
var getQueryConditions = function(categorize_by) {
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
		default:
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
				.findAll({
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
