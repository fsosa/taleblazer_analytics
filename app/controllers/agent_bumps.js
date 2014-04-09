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
	db.AgentBump
		.findAll({
			include: [{
				model: db.Session,
				where: {
					draft_state_id: 169
				}
			}]
		})
		.success(function(agentBumps) {
			db.RegionSwitch
				.findAll({
					include: [{
						model: db.Session,
						where: {
							draft_state_id: 169
						}
					}]
				})
				.success(function(regionSwitches) {
					var results = [];

					var sessionFields = Object.keys(agentBumps[0].values.session.values);
					var agentBumpFields = Object.keys(agentBumps[0].values);
					var regionFields = Object.keys(regionSwitches[0].values);
					var defaults = {};


					var fields = [];
					fields.push(sessionFields);
					fields.push(agentBumpFields);
					fields.push(regionFields);
					fields = _.flatten(fields);
					results.push(fields);

					_.each(agentBumpFields, function(field) {
						defaults[field] = null;
					})

					_.each(regionFields, function(field) {
						defaults[field] = null;
					})

					_.each(agentBumps, function(agentBump) {
						var finalresults = {};
						var rawSession = agentBump.values.session.values;

						_.each(rawSession, function(val, key) {
							finalresults[key] = val;
						});

						var raw = agentBump.values;
						var modified = _.defaults(raw, defaults);
						delete modified.session;

						_.extend(finalresults, modified);

						console.log(finalresults);

						results.push(finalresults);
					});

					_.each(regionSwitches, function(agentBump) {
						var finalresults = {};
						var rawSession = agentBump.values.session.values;

						_.each(rawSession, function(val, key) {
							finalresults[key] = val;
						});

						var raw = agentBump.values;
						var modified = _.defaults(raw, defaults);
						delete modified.session;

						_.extend(finalresults, modified);

						results.push(finalresults);
					});

					// res.jsend(results);
					res.csv(results);
				})
				.error(function(error) {
					next(error);
				});
		})
		.error(function(error) {
			next(error);
		})
}

// exports.show = function(req, res, next) {
// 	var draft_id = req.params.draft_id;

// 	// Render the page if it's not an AJAX request 
// 	// TODO: or JSON/CSV
// 	if (!req.xhr) {
// 		res.render('agent-bumps.ect', {
// 			draft_id: draft_id,
// 			title: 'Agent Bumps', 
// 			script: 'overview.js'
// 		})

// 		return;
// 	}

// 	// Otherwise we start processing the API call
// 	var start_time = req.query.start_time;
// 	var end_time = req.query.end_time;
// 	var categorize_by = req.query.categorize_by;
// 	// TODO: ADD TYPE options (JSON or CSV)


// 	if (start_time == null || end_time == null) {
// 		res.jerror(400, 'start_time and end_time parameters are required');
// 		return;
// 	}


// };