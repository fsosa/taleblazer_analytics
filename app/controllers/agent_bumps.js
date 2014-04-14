var db = require('../models');
var _ = require('underscore');
var moment = require('moment');
var csv = require('express-csv');

var CATEGORIZE_TYPE = {
	DEFAULT: 'default', // Consider renaming this to DATE b/c that's what it really is
	GAME_VERSION: 'game_version',
	ROLE: 'role',
	SCENARIO: 'scenario'
};

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;

	// Render the page if it's not an AJAX request
	// TODO: or JSON/CSV
	// if (!req.xhr) {
	// 	res.render('agent-bumps.ect', {
	// 		draft_id: draft_id,
	// 		title: 'Agent Bumps',
	// 		script: 'overview.js'
	// 	});

	// 	return;
	// }

	// Otherwise we start processing the API call
	var start_time = req.query.start_time;
	var end_time = req.query.end_time;
	var categorize_by = req.query.categorize_by;
	// TODO: ADD TYPE options (JSON or CSV)

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
			res.jsend(200, agent_bumps);
		}
	});

};

//////////////////////
// Utility Methods  //
//////////////////////

var getQueryConditions = function(categorize_by) {
	var attributes = null;
	var group = null;

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// In general, we're building a query of this form:                                                                                                                                                                      //
	//                                                                                                                                                                                                                       //
	// SELECT `agent_bumps.role_id`, `agent_bumps.role_name`, COUNT(*) as `total` FROM `agent_bumps`, `sessions`                                                                                                             //
	// WHERE `agent_bumps.occurred_at` BETWEEN '2014-03-15' AND '2014-04-10' AND `sessions.draft_state_id` IN (DRAFT_STATE_IDS) AND `sessions.id` = `agent_bumps.session_id`                                                 //
	// GROUP by `agent_bumps.agent_id`, `sesions.sessions.id`                                                                                                                                                                //
	//                                                                                                                                                                                                                       //
	// -- This query will group the results by agent id and session id, resulting in a list of unique agent bumps                                                                                                            //
	//                                                                                                                                                                                                                       //
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var conditions = {
		attributes: attributes,
		group: group
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
			attributes: ['id']
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
						}
					}]
				})
				.success(function(agent_bumps) {
					callback(agent_bumps, null);
				})
				.error(function(error) {
					callback(null, error);
				});
		})
		.error(function(error) {
			callback(null, error);
		});
};