var db = require('../models');
var _ = require('underscore');
var moment = require('moment');
var utils = require('../utils/utils');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default',
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
};

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;
	var custom_event_id = req.params.custom_event_id;

	// Render the page if it's not an AJAX request
	if (!req.xhr) {

		utils.getPageVariables(draft_id, function(error, page_vars) {
			if (error) {
				next(error);
			} else {
				renderPage(res, custom_event_id, page_vars);
			}
		});

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

	getCustomEventsAndVersionInfo(draft_id, custom_event_id, start_time, end_time, query_conditions, function(results, error) {
		if (error) {
			next(error);
			return;
		}

		if (results) {
			var stats = getCalculatedStats(results, categorize_by);
			var data = {
				results: stats
			}
			res.jsend(200, data);	
		}
		
	});

};

/////////////////////
// Utility Methods //
/////////////////////

var renderPage = function(res, custom_event_id, page_vars) {
	var eventTitle = null;

	_.each(page_vars.custom_events, function(event) {
		if (event.event_id == custom_event_id) {
			eventTitle = event.name;
		}
	});

	var title = page_vars.draft_info == null ? null : page_vars.draft_info.title;
	var draft_time_created = page_vars.draft_info == null ? null : page_vars.draft_info.time_created;

	res.render('custom-events.ect', {
		draft_id: page_vars.draft_id,
		title: eventTitle,
		draftStateTitle: title,
		draft_time_created: draft_time_created,
		customEvents: page_vars.custom_events,
		defaultCategorization: 'Date'
	});
};



var getBucketInfo = function(trigger, categorize_type, idToVersion) {
	var bucketInfo = {
		key: null
	};
	switch (categorize_type) {
		case CATEGORIZE_TYPE.DEFAULT:
			bucketInfo.key = moment(trigger.occurred_at).format('MMM D YYYY');
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			bucketInfo.key = trigger.session.draft_state_id;
			bucketInfo.keyEntityName = idToVersion[trigger.session.draft_state_id];
			break;
		case CATEGORIZE_TYPE.ROLE:
			bucketInfo.key = trigger.session.role_id;
			bucketInfo.keyEntityName = trigger.session.role_name;
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			bucketInfo.key = trigger.session.scenario_id;
			bucketInfo.keyEntityName = trigger.session.scenario_name;
			break;
		default:
			break;
	}

	return bucketInfo;
};

var getCalculatedStats = function(results, categorize_type) {
	var triggers = results.custom_event_triggers;
	var idToVersion = results.idToVersion;

	var stats = {};

	_.each(triggers, function(trigger) {
		var bucketInfo = getBucketInfo(trigger, categorize_type, idToVersion);
		var key = bucketInfo.key; // The key by which we group stats e.g. role id, scenario id
		var keyEntityName = bucketInfo.keyEntityName; // The name associated with the key e.g. role name

		var trigger_value = trigger.value;

		// Stats[key] is the bucket where we group related trigger values together
		// e.g. the stats for trigger values pertaining to a role, scenario, etc.
		if (stats[key] == null) {
			stats[key] = {};
		}

		if (stats[key][trigger_value] != null) {
			var triggerStats = stats[key][trigger_value];

			triggerStats.unique += 1;
			triggerStats.total += trigger.total;
		} else {
			stats[key][trigger_value] = {
				value: trigger_value,
				unique: 1,
				total: trigger.total
			};

			stats[key][trigger_value][categorize_type] = key;
			stats[key][trigger_value].entityName = keyEntityName;
		}
	});

	// The stats are nested as the values two levels deep (level 1: ID we group by, level 2: trigger value)
	// So we just have to get the values of all second levels
	var results = [];

	var firstLevel = _.values(stats);

	_.each(firstLevel, function(secondLevel) {
		var triggerStats = _.values(secondLevel);
		results = results.concat(triggerStats);
	});

	return results;
};

var getQueryConditions = function(categorize_by) {
	var attributes = null;
	var group = null;
	var sessionAttributes = [];

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// In general, we're building a query of this form:                                                                                                                                                                      //
	//                                                                                                                                                                                                                       //
	// SELECT `custom_event_triggers`.`occurred_at`, `custom_event_triggers`.`value`, COUNT(*) as `total` FROM `custom_event_triggers`, `sessions`
	// WHERE `session`.`id` = `custom_event_triggers`.`session_id` AND `session`.`draft_state_id` IN (DRAFT_STATE_IDS)
	// AND `custom_event_triggers`.`event_id`=CUSTOM_EVENT_ID AND  (`custom_event_triggers`.`occurred_at` BETWEEN '2014-03-01' AND '2014-04-22')
	// GROUP BY DATE(`occurred_at`), `value`, session.id;                                                                                                                                                                    //
	//                                                                                                                                                                                                                       //
	// -- This query will group the results by date, session id, and value resulting in a list of unique custom event triggers                                                                                               //
	//                                                                                                                                                                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var countAll = [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'total']; // Non-unique total

	var groupByDate = db.sequelize.fn('DATE', db.sequelize.col('occurred_at'));
	var groupBySessionId = db.sequelize.literal('session.id');
	var groupByDraftStateId = db.sequelize.literal('session.draft_state_id');
	var groupByRoleId = db.sequelize.literal('session.role_id');
	var groupByScenarioId = db.sequelize.literal('session.scenario_id');

	switch (categorize_by) {
		case CATEGORIZE_TYPE.DEFAULT:
			attributes = ['occurred_at', 'value', countAll];
			group = [groupByDate, 'value', groupBySessionId];
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			attributes = ['occurred_at', 'value', countAll];
			sessionAttributes = ['draft_state_id'];
			group = ['value', groupByDraftStateId, groupBySessionId];
			break;
		case CATEGORIZE_TYPE.ROLE:
			attributes = ['occurred_at', 'value', countAll];
			sessionAttributes = ['role_id', 'role_name'];
			group = ['value', groupByRoleId, groupBySessionId];
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			attributes = ['occurred_at', 'value', countAll];
			sessionAttributes = ['scenario_id', 'scenario_name'];
			group = ['value', groupByScenarioId, groupBySessionId];
			break;
		default:
			break;
	}

	var conditions = {
		attributes: attributes,
		group: group,
		sessionAttributes: sessionAttributes
	};

	return conditions;
};

var getCustomEventsAndVersionInfo = function(draft_id, custom_event_id, start_time, end_time, query_conditions, callback) {
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
			var idToVersion = {}; // Mapping of draft state ID to their version string

			_.each(results, function(draft_state) {
				draft_state_ids.push(draft_state.id);
				idToVersion[draft_state.id] = draft_state.version;
			});

			db.CustomEventTrigger
				.findAll({
					where: {
						event_id: custom_event_id,
						occurred_at: {
							between: [start_time, end_time]
						}
					},
					attributes: query_conditions.attributes,
					group: query_conditions.group,
					include: [{
						model: db.Session,
						where: {
							draft_state_id: draft_state_ids
						},
						attributes: query_conditions.sessionAttributes
					}]
				})
				.success(function(triggers) {
					var custom_event_triggers = _.map(triggers, function(trigger) {
						return trigger.values;
					});

					data = {
						custom_event_triggers: custom_event_triggers,
						idToVersion: idToVersion
					};

					callback(data, null);
				});
		})
		.error(function(error) {
			callback(null, error);
		});
};
