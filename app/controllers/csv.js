var db = require('../models');
var _ = require('underscore');
var csv = require('express-csv');

exports.show = function(req, res, next) {
	var unionQuery = '(' + queryStringForAgentBumps() + ')' + ' UNION ' + '(' + queryStringForCustomEvents() + ');';

	db.sequelize.query(unionQuery, null, {
		raw: true,
		type: db.Sequelize.QueryTypes.SELECT
	})
		.success(function(results) {
			res.jsend(results);
		})
		.error(function(error) {
			next(error);
		});
}

//////////////////////
// Utility Methods  //
//////////////////////

var getAllAttributes = function() {
	var sessionAttributes = ['id', 'device_id', 'draft_state_id', 'started_at', 'last_event_at', 'role_id', 'role_name', 'scenario_id', 'scenario_name', 'tap_to_visit', 'completed']
	var agentBumpAttributes = ['occurred_at', 'bump_type', 'agent_id', 'agent_name']
	var customEventAttributes = ['occurred_at', 'event_id', 'event_name', 'value']

	return {
		sessionAttributes: sessionAttributes,
		agentBumpAttributes: agentBumpAttributes,
		customEventAttributes: customEventAttributes
	}
}

var queryStringForAgentBumps = function() {
	var attributes = getAllAttributes();
	var select = 'SELECT ';

	var fields = '';

	_.each(attributes.sessionAttributes, function(attr) {
		fields += '`sessions`.`' + attr + '` as' + '`session.' + attr + '`, ';
	})

	_.each(attributes.agentBumpAttributes, function(attr) {
		fields += '`agent_bumps`.`' + attr + '` as' + '`agentBump.' + attr + '`, '
	})

	_.each(attributes.customEventAttributes, function(attr, i) {
		fields += 'NULL as ' + '`customEvent.' + attr + '` ';
		var lastElem = attributes.customEventAttributes.length - 1;

		if (i != lastElem) {
			fields += ', '
		}
	})

	var from = 'FROM `agent_bumps` ';
	var leftJoin = 'LEFT JOIN `sessions` on `agent_bumps`.`session_id` = `sessions`.`id`'

	return select + fields + from + leftJoin;
}

var queryStringForCustomEvents = function() {
	var attributes = getAllAttributes();
	var select = 'SELECT ';

	var fields = '';

	_.each(attributes.sessionAttributes, function(attr) {
		fields += '`sessions`.`' + attr + '` as' + '`session.' + attr + '`, ';
	})

	_.each(attributes.agentBumpAttributes, function(attr) {
		fields += 'NULL as ' + '`agentBump.' + attr + '`, ';
	})

	_.each(attributes.customEventAttributes, function(attr, i) {
		fields += '`custom_event_triggers`.`' + attr + '` as' + '`customEvent.' + attr + '` '
		var lastElem = attributes.customEventAttributes.length - 1;

		if (i != lastElem) {
			fields += ', '
		}
	})

	var from = 'FROM `custom_event_triggers` ';
	var leftJoin = 'LEFT JOIN `sessions` on `custom_event_triggers`.`session_id` = `sessions`.`id`'

	return select + fields + from + leftJoin;
}


var getAgentBumps = function(start_time, end_time, callback) {
	db.AgentBump
		.findAll({
			where: {
				occurred_at: {
					between: [start_time, end_time]
				}
			},
			include: [{
				model: db.Session,
				where: {
					draft_state_id: 169
				}
			}]
		})
		.success(function(bumps) {
			var results = _.map(bumps, function(bump) {
				return bump.values;
			})
		})
}

// db.AgentBump
// 		.findAll({
// 			include: [{
// 				model: db.Session,
// 				where: {
// 					draft_state_id: 169
// 				}
// 			}]
// 		})
// 		.success(function(agentBumps) {
// 			db.RegionSwitch
// 				.findAll({
// 					include: [{
// 						model: db.Session,
// 						where: {
// 							draft_state_id: 169
// 						}
// 					}]
// 				})
// 				.success(function(regionSwitches) {
// 					var results = [];

// 					var sessionFields = Object.keys(agentBumps[0].values.session.values);
// 					var agentBumpFields = Object.keys(agentBumps[0].values);
// 					var regionFields = Object.keys(regionSwitches[0].values);
// 					var defaults = {};


// 					var fields = [];
// 					fields.push(sessionFields);
// 					fields.push(agentBumpFields);
// 					fields.push(regionFields);
// 					fields = _.flatten(fields);
// 					results.push(fields);

// 					_.each(agentBumpFields, function(field) {
// 						defaults[field] = null;
// 					})

// 					_.each(regionFields, function(field) {
// 						defaults[field] = null;
// 					})

// 					_.each(agentBumps, function(agentBump) {
// 						var finalresults = {};
// 						var rawSession = agentBump.values.session.values;

// 						_.each(rawSession, function(val, key) {
// 							finalresults[key] = val;
// 						});

// 						var raw = agentBump.values;
// 						var modified = _.defaults(raw, defaults);
// 						delete modified.session;

// 						_.extend(finalresults, modified);

// 						console.log(finalresults);

// 						results.push(finalresults);
// 					});

// 					_.each(regionSwitches, function(agentBump) {
// 						var finalresults = {};
// 						var rawSession = agentBump.values.session.values;

// 						_.each(rawSession, function(val, key) {
// 							finalresults[key] = val;
// 						});

// 						var raw = agentBump.values;
// 						var modified = _.defaults(raw, defaults);
// 						delete modified.session;

// 						_.extend(finalresults, modified);

// 						results.push(finalresults);
// 					});

// 					// res.jsend(results);
// 					res.csv(results);
// 				})
// 				.error(function(error) {
// 					next(error);
// 				});
// 		})
// 		.error(function(error) {
// 			next(error);
// 		})