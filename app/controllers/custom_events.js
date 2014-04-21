var db = require('../models');
var _ = require('underscore');
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
	// if (!req.xhr) {

	// 	utils.getPageVariables(draft_id, function(error, page_vars) {
	// 		if (error) {
	// 			next(error);
	// 		} else {
	// 			renderPage(res, custom_event_id, page_vars);
	// 		}
	// 	});

	// 	return;
	// }

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
		res.jsend(results);
	})

};

/////////////////////
// Utility Methods //
/////////////////////

var renderPage = function(res, custom_event_id, page_vars) {
	var eventTitle = null;

	_.each(page_vars.custom_events, function(event) {
		if (event.id == custom_event_id) {
			eventTitle = event.name;
		}
	});

	res.render('custom-events.ect', {
		draft_id: page_vars.draft_id,
		title: eventTitle,
		draftStateTitle: page_vars.draft_title,
		customEvents: page_vars.custom_events,
		defaultCategorization: 'Date',
		script: 'overview.js'
	});
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
			group = ['value', groupByDraftStateId];
			break;
		case CATEGORIZE_TYPE.ROLE:
			attributes = ['occurred_at', 'value', countAll];
			sessionAttributes = ['role_id', 'role_name'];
			group = ['value', groupByRoleId];
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			attributes = ['occurred_at', 'value', countAll];
			sessionAttributes = ['scenario_id', 'scenario_name'];
			group = ['value', groupByScenarioId];
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
					data = {
						custom_event_triggers: triggers,
						idToVersion: idToVersion
					};

					callback(data, null);
				});
		})
		.error(function(error) {
			callback(null, error);
		});
};
