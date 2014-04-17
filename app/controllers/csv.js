var db = require('../models');
var _ = require('underscore');
var csv = require('express-csv');
require('../../lib/underscore-mixins');

exports.show = function(req, res, next) {
	var draft_id = req.params.draft_id;


	getDraftStateIds(draft_id, function(ids, error) {
		if (error) {
			next(error);
			return;
		}

		var agentQuery = queryStringForAgentBumps(ids);
		var customEventQuery = queryStringForCustomEvents(ids);
		var regionSwitchQuery = queryStringForRegionSwitches(ids);
		var unionQuery = '(' + agentQuery + ')' + ' UNION ALL ' + '(' + customEventQuery + ')' + ' UNION ALL' + '(' + regionSwitchQuery + ');';

		db.sequelize.query(unionQuery, null, {
			raw: true, // Returns an object instead of a Sequelize model (since we don't have a model for the union of all these tables)
			type: db.Sequelize.QueryTypes.SELECT // Must be defined in order to let Sequelize know that we're doing a SELECT query (https://github.com/sequelize/sequelize/issues/1259)
		})
			.success(function(results) {
				var cleaned = [];

				// The result object returns to as a nested object with keys for sessions, agent bumps, etc.
				// We flatten the nested object so that each object represents a row, with the table name prefixing the attributes
				var flattened = _.map(results, function(result) {
					return _.flattenObj(result);
				});

				// It doesn't make sense for booleans to be represented as 1 or 0 in a CSV
				// so we convert it to a human-readable TRUE or FALSE
				_.each(flattened, function(row) {
					var tapToVisitEnabled = row.session_tap_to_visit;
					var sessionCompleted = row.session_completed;
					row.session_tap_to_visit = tapToVisitEnabled ? 'TRUE' : 'FALSE';
					row.session_completed = sessionCompleted ? 'TRUE' : 'FALSE';
				});

				// We make sure to add a row containing just the column names (the keys of an object) for the CSV
				if (flattened.length > 0) {
					cleaned[0] = Object.keys(flattened[0]);
					cleaned = cleaned.concat(flattened);
				}

				// res.csv(cleaned);
				res.jsend(cleaned);

			})
			.error(function(error) {
				next(error);
			});
	});
};

//////////////////////
// Utility Methods  //
//////////////////////

var getDraftStateIds = function(draft_id, callback) {
	db.DraftState
		.findAll({
			where: {
				draft_id: draft_id,
				published_game: 1
			},
			attributes: ['id']
		})
		.success(function(draft_states) {
			var ids = _.map(draft_states, function(draft_state) {
				return draft_state.values['id'];
			});

			callback(ids, null);
		})
		.error(function(error) {
			callback(null, error);
		});
};


var getAllAttributes = function(draft_ids) {
	var sessionAttributes = ['id', 'device_id', 'draft_state_id', 'started_at', 'last_event_at', 'role_id', 'role_name', 'scenario_id', 'scenario_name', 'tap_to_visit', 'completed'];
	var agentBumpAttributes = ['occurred_at', 'bump_type', 'agent_id', 'agent_name'];
	var customEventAttributes = ['occurred_at', 'event_id', 'event_name', 'value'];
	var regionSwitchAttributes = ['occurred_at', 'region_id', 'region_name'];

	return {
		sessionAttributes: sessionAttributes,
		agentBumpAttributes: agentBumpAttributes,
		customEventAttributes: customEventAttributes,
		regionSwitchAttributes: regionSwitchAttributes
	};
};

/**
 * Constructs the portion of the SQL query that specifies the attributes (i.e. columns) that we want to be included in the query
 * 
 * @param  {Array}   attributes      [List of column names pertaining to a table]
 * @param  {String}  tableName       [The table name pertaining to the columns]
 * @param  {String}  aliasPrefix     [The prefix for the set of columns included in the final result e.g. aliasPrefix.attribute]
 * @param  {Boolean} isNull          [True if we're filling in NULL for the columns, false otherwise]
 * @param  {Boolean} lastSetOfFields [True if this is the last set of fields before the FROM statement, false otherwise]
 * @return {String}                  [the fields that we're interested in]
 *                                        e.g. "`sessions`.`id` as `session.id`, `sessions`.`draft_state_id` as `session.draft_state_id` "
 */
var buildAttributeString = function(attributes, tableName, aliasPrefix, isNull, lastSetOfFields) {
	var fields = '';

	_.each(attributes, function(attr, i) {
		// The field right before the FROM statement cannot have a trailing comma; this tells us when we can append the comma (i.e. what fieldSeparator should be)
		var appendComma = !(lastSetOfFields && attributes.length - 1 == i);
		var fieldSeparator = appendComma ? ', ' : ' ';

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// In general, we're building one of two types of fields.                                                                    //
		// 1. If we're getting fields related to the query (i.e. the agent_bump fields for the agentBump query), we build a string:  //
		//     "`tableName`.`field` as `aliasPrefix.field`, "                                                                        //
		// 2. If the fields are unrelated to the query (i.e. the region switch fields for the agentBump query), we build:            //
		//     "NULL as `aliasPrefix.field`, "                                                                                       //
		//                                                                                                                           //
		// (Note the backticks (`): They're not strictly necessary, but they're good practice!)                                       //
		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		if (isNull) {
			fields += 'NULL as ' + '`' + aliasPrefix + '.' + attr + '`' + fieldSeparator;
		} else {
			fields += '`' + tableName + '`.`' + attr + '` as ' + '`' + tableName + '.' + attr + '`' + fieldSeparator;
		}

	});

	return fields;
};

var queryStringForAgentBumps = function(draft_ids) {
	var attributes = getAllAttributes();
	var select = 'SELECT ';

	var fields = '';

	fields += buildAttributeString(attributes.sessionAttributes, 'sessions', 'session', false, false);
	fields += buildAttributeString(attributes.agentBumpAttributes, 'agent_bumps', 'agentBump', false, false);
	fields += buildAttributeString(attributes.customEventAttributes, 'custom_event_triggers', 'customEvent', true, false);
	fields += buildAttributeString(attributes.regionSwitchAttributes, 'region_switches', 'regionSwitch', true, true);


	var from = 'FROM `agent_bumps` ';
	var leftJoin = 'LEFT JOIN `sessions` on `agent_bumps`.`session_id` = `sessions`.`id`';
	var availableDrafts = ' AND `sessions`.`draft_state_id` IN (' + draft_ids.toString() + ')';

	return select + fields + from + leftJoin + availableDrafts;
};

var queryStringForCustomEvents = function(draft_ids) {
	var attributes = getAllAttributes();
	var select = 'SELECT ';

	var fields = '';

	fields += buildAttributeString(attributes.sessionAttributes, 'sessions', 'session', false, false);
	fields += buildAttributeString(attributes.agentBumpAttributes, 'agent_bumps', 'agentBump', true, false);
	fields += buildAttributeString(attributes.customEventAttributes, 'custom_event_triggers', 'customEvent', false, false);
	fields += buildAttributeString(attributes.regionSwitchAttributes, 'region_switches', 'regionSwitch', true, true);


	var from = 'FROM `custom_event_triggers` ';
	var leftJoin = 'LEFT JOIN `sessions` on `custom_event_triggers`.`session_id` = `sessions`.`id`';
	var availableDrafts = ' AND `sessions`.`draft_state_id` IN (' + draft_ids.toString() + ')';

	return select + fields + from + leftJoin + availableDrafts;
};

var queryStringForRegionSwitches = function(draft_ids) {
	var attributes = getAllAttributes();
	var select = 'SELECT ';

	var fields = '';
	fields += buildAttributeString(attributes.sessionAttributes, 'sessions', 'session', false, false);
	fields += buildAttributeString(attributes.agentBumpAttributes, 'agent_bumps', 'agentBump', true, false);
	fields += buildAttributeString(attributes.customEventAttributes, 'custom_event_triggers', 'customEvent', true, false);
	fields += buildAttributeString(attributes.regionSwitchAttributes, 'region_switches', 'regionSwitch', false, true);


	var from = 'FROM `region_switches` ';
	var leftJoin = 'LEFT JOIN `sessions` on `region_switches`.`session_id` = `sessions`.`id`';
	var availableDrafts = ' AND `sessions`.`draft_state_id` IN (' + draft_ids.toString() + ')';

	return select + fields + from + leftJoin + availableDrafts;
};
