var db = require('../models');
var _ = require('underscore');
var csv = require('express-csv');
var utils = require('../utils/utils');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default',
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
};

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;

	// Render the page if it's not an AJAX request
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

	getAgentBumps(draft_id, start_time, end_time, query_conditions, function(agent_bumps, error) {
		if (error) {
			next(error);
			return;
		}

		if (agent_bumps) {

			var stats = getCalculatedStats(agent_bumps, categorize_by);

			var data = {
				results: stats
			};

			res.jsend(200, data);
		}
	});

};

//////////////////////
// Utility Methods  //
//////////////////////

var renderPage = function(res, draft_id, draft_state_title) {
	res.render('agent-bumps.ect', {
		draft_id: draft_id,
		title: 'Agent Bumps',
		draftStateTitle: draft_state_title,
		defaultCategorization: 'Agent',
		script: 'overview.js'
	});
};

var getCalculatedStats = function(agent_bumps, categorize_type) {
	var stats = {};

	_.each(agent_bumps, function(agent_bump) {
		var bucketInfo = getBucketInfo(agent_bump, categorize_type);
		var key = bucketInfo.key; // The key by which we group stats i.e. agent id, role id
		var keyEntityName = bucketInfo.keyEntityName; // The name associated with the key e.g. role name

		var agent_id = agent_bump.agent_id;

		// Stats[key] is the bucket where we group related agent bumps together
		// e.g. the stats for agent bumps pertaining to a role, scenario, etc.
		if (stats[key] == null) {
			stats[key] = {};
		}

		if (stats[key][agent_id] != null) {
			var agentStats = stats[key][agent_id];

			agentStats.unique += 1;
			agentStats.total += agent_bump.total;
		} else {
			stats[key][agent_id] = {
				agent_name: agent_bump.agent_name,
				unique: 1,
				total: agent_bump.total
			};

			stats[key][agent_id][categorize_type] = key;

			// If we're categorizing by the default (which is by agent), then we already know the agent_id so no need to add
			if (categorize_type != CATEGORIZE_TYPE.DEFAULT) {
				stats[key][agent_id].agent_id = agent_id;
			}

			if (keyEntityName != null) {
				stats[key][agent_id].entityName = keyEntityName;
			}
		}
	});

	// The stats are nested as the values two levels deep (level 1: ID we group by, level 2: agent id)
	// So we just have to get the values of all second levels
	var results = [];

	var firstLevel = _.values(stats);

	_.each(firstLevel, function(secondLevel) {
		var agentStats = _.values(secondLevel);
		results = results.concat(agentStats);
	});

	return results;
};

var getBucketInfo = function(agent_bump, categorize_type) {
	var bucketInfo = {
		key: null
	};
	switch (categorize_type) {
		case CATEGORIZE_TYPE.DEFAULT:
			bucketInfo.key = agent_bump.agent_id;
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			bucketInfo.key = agent_bump.session.draft_state_id;
			// Need to figure out where this user-defined version name comes from: broadcasts table ?
			break;
		case CATEGORIZE_TYPE.ROLE:
			bucketInfo.key = agent_bump.session.role_id;
			bucketInfo.keyEntityName = agent_bump.session.role_name;
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			bucketInfo.key = agent_bump.session.scenario_id;
			bucketInfo.keyEntityName = agent_bump.session.scenario_name;
			break;
		default:
			break;
	}

	return bucketInfo;
};

var getQueryConditions = function(categorize_by) {
	var attributes = null;
	var group = null;
	var sessionAttributes = []; // include's attributes don't act the same way as regular attributes, have to be empty
	// TODO: probably better to change these all to empty arrays to be consistent

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// In general, we're building a query of this form:                                                                                                                                                                      //
	//                                                                                                                                                                                                                       //
	// SELECT `agent_bumps.role_id`, `agent_bumps.role_name`, COUNT(*) as `total` FROM `agent_bumps`, `sessions`                                                                                                             //
	// WHERE `agent_bumps.occurred_at` BETWEEN '2014-03-15' AND '2014-04-10' AND `sessions.draft_state_id` IN (DRAFT_STATE_IDS) AND `sessions.id` = `agent_bumps.session_id`                                                 //
	// GROUP by `agent_bumps.agent_id`, `sessions.sessions.id`                                                                                                                                                                //
	//                                                                                                                                                                                                                       //
	// -- This query will group the results by agent id and session id, resulting in a list of unique agent bumps                                                                                                            //
	//                                                                                                                                                                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var countAll = [db.sequelize.fn('COUNT', db.sequelize.col('*')), 'total']; // Non-unique total

	var groupBySessionId = db.sequelize.literal('session.id');
	var groupByDraftStateId = db.sequelize.literal('session.draft_state_id');
	var groupByRoleId = db.sequelize.literal('session.role_id');
	var groupByScenarioId = db.sequelize.literal('session.scenario_id');


	switch (categorize_by) {
		case CATEGORIZE_TYPE.DEFAULT:
			attributes = ['agent_id', 'agent_name', countAll];
			group = ['agent_id', groupBySessionId];
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			attributes = ['agent_id', 'agent_name', countAll];
			sessionAttributes = ['draft_state_id'];
			group = ['agent_id', groupByDraftStateId];
			break;
		case CATEGORIZE_TYPE.ROLE:
			attributes = ['agent_id', 'agent_name', countAll];
			sessionAttributes = ['role_id', 'role_name'];
			group = ['agent_id', groupByRoleId];
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			attributes = ['agent_id', 'agent_name', countAll];
			sessionAttributes = ['scenario_id', 'scenario_name'];
			group = ['agent_id', groupByScenarioId];
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

var getAgentBumps = function(draft_id, start_time, end_time, queryConditions, callback) {
	start_time = new Date(parseInt(start_time));
	end_time = new Date(parseInt(end_time));

	db.DraftState
		.findAll({
			where: {
				draft_id: draft_id,
				published_game: 1
			},
			attributes: ['id'] // game version name: get the version attribute here, save in a list, return with results and add as entityname
		})
		.success(function(results) {
			var draft_state_ids = _.map(results, function(result) {
				return result.values['id'];
			});

			db.AgentBump
				.findAll({
					where: {
						occurred_at: {
							between: [start_time, end_time]
						}
					},
					attributes: queryConditions.attributes,
					group: queryConditions.group,
					include: [{
						model: db.Session,
						where: {
							draft_state_id: draft_state_ids
						},
						attributes: queryConditions.sessionAttributes
					}]
				})
				.success(function(agent_bumps) {
					var result = _.map(agent_bumps, function(bump) {
						return bump.values;
					});
					callback(result, null);
				})
				.error(function(error) {
					callback(null, error);
				});
		})
		.error(function(error) {
			callback(null, error);
		});
};
