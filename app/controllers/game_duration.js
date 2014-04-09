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
	if (!req.xhr) {
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

	if (start_time == null || end_time == null) {
		res.jerror(400, 'start_time and end_time parameters are required');
		return;
	} else {
		start_time = new Date(parseInt(start_time));
		end_time = new Date(parseInt(end_time));
	}

	var query_conditions = getQueryConditions(categorize_by, 15);

	var SessionService = req.app.services.SessionService;

	SessionService.getSessions(draft_id, start_time, end_time, query_conditions, function(sessions, error) {
		if (error) {
			next(error);
			return;
		} 

		if (sessions) {
			var results = getCalculatedStats(sessions, categorize_by);

			data = {
				results: results
			}

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

	var timeKey = [
		'0-15',
		'15-30',
		'30-45',
		'45-60',
		'60-75',
		'75-90',
		'90-105',
		'105-120',
		'120+'
	]

	var timeBucketRange = 15;
	var maxTimeValue = 120;

	var timeBuckets = {}
	_.each(timeKey, function(key) {
		timeBuckets[key] = 0;
	})
	
	_.each(sessions, function(session) {
		var rawSession = session;
		rawSession = _.omit(rawSession, 'id'); // Remove the primary key

		// Our query already bucketed and grouped our sessions into timeBucketRange chunks (default: 15 min)
		// e.g. If 4 sessions took between 0-15 minutes, then there would be one result with count = 4 and durationBucket = 0 (i.e. the first bucket)
		// The bucket is calculated by dividing the time by the timeBucketRange and flooring the result (i.e. Math.floor(1/15) = 0 and Math.floor(20/15) = 1)
		// The SQL query does the exact same thing
		var timeKeyIndex = rawSession.durationBucket;
		// The last bucket always handles all values after the maxTimeValue
		if (timeKeyIndex >= timeKey.length) {
			timeKeyIndex = timeKey.length - 1;
		}

		// This just gets the label key for where we should increase the count (i.e. '0-15')
		var timeBucketKey = timeKey[timeKeyIndex]; 

		// As usual get the top-level bucketkey (e.g. what we categorize/group by) and the entity name for the key (e.g. ROLE has role_name, etc.)
		var bucketInfo = getBucketInfo(rawSession, categorize_type);
		var key = bucketInfo.key;
		var keyEntityName = bucketInfo.keyEntityName;

		var bucketValue = stats[key];

		if (bucketValue != null) {
			bucketValue[timeBucketKey] += rawSession.count;
		} else {
			stats[key] = _.defaults({}, timeBuckets);
			stats[key][timeBucketKey] = rawSession.count;

			// We make sure to save the grouping key in the object as well so we can just take the values of the object later to just return an array of entries
			stats[key][categorize_type] = key;
			if (keyEntityName != null) {
				stats[key].entityName = keyEntityName;
			}
		}
	});
	
	var results = _.values(stats);
	console.log(results);
	return results;
};

var getBucketInfo = function(session, categorize_type) {
	var bucketInfo = {
		key: null
	};
	switch (categorize_type) {
		case CATEGORIZE_TYPE.DEFAULT:
			bucketInfo.key = moment(session.started_at).format('MMM D YYYY');
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			bucketInfo.key = session.draft_state_id;
			// Need to figure out where this user-defined version name comes from: broadcasts table ?
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
var getQueryConditions = function(categorize_by, bucketRange) {
	var attributes = null;
	var group = null;

	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// NOTE: In general, we're trying to build a query of this form (with differing group by options)                                        //
	// 																																     	 //
	// SELECT `started_at`, ROUND(TIMESTAMPDIFF(MINUTE, `started_at`, `last_event_at`)/bucketRange) as `duration`, COUNT(*) as `count` FROM `sessions`   //
	// WHERE  (`started_at` BETWEEN `start_time_placeholder` AND 'end_time_placeholder')                                                     //
	// AND `draft_state_id` IN (list_of_draft_state_ids_corresponding_to_this_draft_id)                                                      //
	// GROUP BY DATE(`started_at`), `duration`;                                                                                              //
	// 																																		 //
	// -- This query will automatically group sessions by date first and then by their duration in buckets of time ranges -- 		 		 //
	// -- For example, if bucketRange is 15, then the query will bucket times into buckets of 15 --											 //
	// -- e.g. if 4 games took between 0-15 minutes, then those 4 games would be bucketed into the 0th bucket (buckets are 0-indexed)		 //
	// -- The difference between the queries are the GROUP BY options																	     //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var roundedDuration = db.sequelize.literal('ROUND(TIMESTAMPDIFF(MINUTE, `started_at`, `last_event_at`)/' + bucketRange +')  as `durationBucket`');

	switch (categorize_by) {
		case CATEGORIZE_TYPE.DEFAULT:
			attributes = ['started_at', roundedDuration, [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = [db.sequelize.fn('DATE', db.sequelize.col('started_at')), 'durationBucket'];
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			attributes = ['draft_state_id', roundedDuration, [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = ['draft_state_id', 'durationBucket'];
			break;
		case CATEGORIZE_TYPE.ROLE:
			attributes = ['role_id', 'role_name', roundedDuration, [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = ['role_id', 'durationBucket'];
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			attributes = ['scenario_id', 'scenario_name', roundedDuration, [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'count']];
			group = ['scenario_id', 'durationBucket'];
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