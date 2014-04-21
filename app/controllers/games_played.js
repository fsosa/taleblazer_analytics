var db = require('../models');
var _ = require('underscore');
var moment = require('moment');
var csv = require('express-csv');
var utils = require('../utils/utils');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default', // Consider renaming this to DATE b/c that's what it really is
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
};

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;

	// Render the page if it's not an AJAX and we're not asking for CSV/JSON
	if (!req.xhr) {
		var draft_state_title = req.session.draft_state_title; // Check the session cookie for the most recent draft_state title

		if (draft_state_title) {
			renderPage(res, draft_id, draft_state_title);
		} else {
			utils.getPublishedDraftState(draft_id, function(draft_state, error) {
				req.session.draft_state_title = draft_state.name; // Store the title for later
				renderPage(res, draft_id, draft_state.name);
			});
		}

		return;
	}

	// Otherwise we start processing the API call
	var start_time = req.query.start_time;
	var end_time = req.query.end_time;
	var categorize_by = req.query.categorize_by;

	if (start_time == null || end_time == null) {
		res.jerror(400, 'start_time and end_time parameters are required');
		return;
	}

	var query_conditions = getQueryConditions(categorize_by);

	getSessionsAndVersionInfo(draft_id, start_time, end_time, next, query_conditions, function(results) {
		if (results) {

			var stats = getCalculatedStats(results, categorize_by);

			var data = {
				results: stats
			};

			res.jsend(200, data);
		}
	});


};

/////////////////////
// Utility Methods //
/////////////////////

var renderPage = function(res, draft_id, draft_state_title) {
	res.render('games-played.ect', {
		draft_id: draft_id,
		title: 'Games Played',
		draftStateTitle: draft_state_title,
		defaultCategorization: 'Date',
		script: 'overview.js'
	});

};

var getCalculatedStats = function(results, categorize_type) {
	var sessions = results.sessions;
	var idToVersion = results.idToVersion;

	var stats = {};

	// Bucket sessions
	_.each(sessions, function(session) {
		var rawSession = session.values;

		var sessionComplete = (rawSession.completed == true);

		var bucketInfo = getBucketInfo(rawSession, categorize_type, idToVersion);
		var key = bucketInfo.key;
		var keyEntityName = bucketInfo.keyEntityName;

		var bucketValue = stats[key];

		if (bucketValue != null) {
			var valToIncrement = sessionComplete ? 'completed' : 'initiated';
			bucketValue[valToIncrement] += rawSession.count;
			bucketValue.total += rawSession.count;
		} else {
			var completed = sessionComplete ? rawSession.count : 0;
			var initiated = sessionComplete ? 0 : rawSession.count;
			var total = completed + initiated;

			stats[key] = {
				initiated: initiated,
				completed: completed,
				total: total
			};
			
			stats[key][categorize_type] = key;
			stats[key].entityName = keyEntityName;	
		}
	});

	var results = _.values(stats);

	return results;
};

var getBucketInfo = function(session, categorize_type, idToVersion) {
	var bucketInfo = {
		key: null
	};
	switch (categorize_type) {
		case CATEGORIZE_TYPE.DEFAULT:
			bucketInfo.key = moment(session.started_at).format('MMM D YYYY');
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			bucketInfo.key = session.draft_state_id;
			bucketInfo.keyEntityName = idToVersion[session.draft_state_id];
			break;
		case CATEGORIZE_TYPE.ROLE:
			bucketInfo.key = session.role_id;
			bucketInfo.keyEntityName = session.role_name;
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			bucketInfo.key = session.scenario_id;
			bucketInfo.keyEntityName = session.scenario_name;
			break;
		default:
			break;
	}

	return bucketInfo;
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
			group = ['draft_state_id', 'completed'];
			break;
		case CATEGORIZE_TYPE.ROLE:
			attributes = ['role_id', 'role_name', 'started_at', 'completed', [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = ['role_id', 'completed'];
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			attributes = ['scenario_id', 'scenario_name', 'started_at', 'completed', [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = ['scenario_id', 'completed'];
			break;
		default:
			// The ordering of these attributes determines the order they get returned in the query
			attributes = [
				['id', 'session_id'],
				['draft_state_id', 'version_id'], 'device_id', 'started_at', 'last_event_at', 'role_id', 'role_name', 'scenario_id', 'scenario_name', 'tap_to_visit', 'completed'
			];
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
var getSessionsAndVersionInfo = function(draft_id, start_time, end_time, next, queryConditions, callback) {
	// Retrieve a list of all published draft states and then find all sessions pertaining to those
	start_time = new Date(parseInt(start_time));
	end_time = new Date(parseInt(end_time));

	db.DraftState
		.findAll({
			where: {
				draft_id: draft_id,
				published_game: 1
			},
			attributes: ['id', 'version']
		})
		.success(function(results) {
			var draft_state_ids = [];
			var idToVersion = {}; // Mapping of draft state IDs to their version string

			_.each(results, function(draft_state) {
				draft_state_ids.push(draft_state.id);
				idToVersion[draft_state.id] = draft_state.version;
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
					var data = {
						sessions: sessions,
						idToVersion: idToVersion
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
