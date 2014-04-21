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

		utils.getPageVariables(draft_id, function(error, page_vars) {
			if (error) {
				next(error);
			} else {
				renderPage(res, page_vars);
			}
		})

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

	getAgentBumpsAndVersionInfo(draft_id, start_time, end_time, query_conditions, function(results, error) {
		if (error) {
			next(error);
			return;
		}

		if (results) {

			var stats = getCalculatedStats(results, categorize_by);

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

var renderPage = function(res, page_vars) {
	res.render('agent-bumps.ect', {
		draft_id: page_vars.draft_id,
		title: 'Agent Bumps',
		draftStateTitle: page_vars.draft_title,
		customEvents: page_vars.custom_events,
		defaultCategorization: 'Agent',
		script: 'overview.js'
	});
};

var getCalculatedStats = function(results, categorize_type) {
	var agent_bumps = results.agent_bumps;
	var idToVersion = results.idToVersion;

	var stats = {};

	_.each(agent_bumps, function(agent_bump) {
		var bucketInfo = getBucketInfo(agent_bump, categorize_type, idToVersion);
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

			stats[key][agent_id].entityName = keyEntityName;
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

var getBucketInfo = function(agent_bump, categorize_type, idToVersion) {
	var bucketInfo = {
		key: null
	};
	switch (categorize_type) {
		case CATEGORIZE_TYPE.DEFAULT:
			bucketInfo.key = agent_bump.agent_id;
			break;
		case CATEGORIZE_TYPE.GAME_VERSION:
			bucketInfo.key = agent_bump.session.draft_state_id;
			bucketInfo.keyEntityName = idToVersion[agent_bump.session.draft_state_id];
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
			group = ['agent_id', groupByDraftStateId, groupBySessionId];
			break;
		case CATEGORIZE_TYPE.ROLE:
			attributes = ['agent_id', 'agent_name', countAll];
			sessionAttributes = ['role_id', 'role_name'];
			group = ['agent_id', groupByRoleId, groupBySessionId];
			break;
		case CATEGORIZE_TYPE.SCENARIO:
			attributes = ['agent_id', 'agent_name', countAll];
			sessionAttributes = ['scenario_id', 'scenario_name'];
			group = ['agent_id', groupByScenarioId, groupBySessionId];
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

var getAgentBumpsAndVersionInfo = function(draft_id, start_time, end_time, queryConditions, callback) {
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
					var agentBumps = _.map(agent_bumps, function(bump) {
						return bump.values;
					});

					data = {
						agent_bumps: agentBumps,
						idToVersion: idToVersion 
					}

					callback(data, null);
				})
				.error(function(error) {
					callback(null, error);
				});
		})
		.error(function(error) {
			callback(null, error);
		});
};
