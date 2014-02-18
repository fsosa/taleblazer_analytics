var db = require('../models');
var util = require('util');
var _ = require('underscore');

var EVENT_TYPES = {
	AGENT_BUMP: 'AGENT_BUMP',
	REGION_SWITCH: 'REGION_SWITCH',
	GAME_COMPLETION: 'GAME_COMPLETION',
	CUSTOM_EVENT_TRIGGER: 'CUSTOM_EVENT_TRIGGER'
};

exports.create = function(req, res) {
	var session_id = req.body.session_id;
	var last_event_at = req.body.last_event_at;
	var events = req.body.events;

	// Validate required fields and types
	if (session_id == null) {
		res.jerror(400, 'Session id is required');
		return;
	}

	if (last_event_at == null) {
		res.jerror(400, "Field \'last_event_at\' is required");
		return;
	}

	if (util.isArray(events) == false) {
		res.jerror(400, 'Events should be an array');
		return;
	}

	var chainer = new db.Sequelize.Utils.QueryChainer;

	// Loop through all events and chain the event creation queries
	// to run them all at once and get a callback when all are complete
	for (i = 0; i < events.length; i++) {
		var raw_event = events[i];

		var creationQuery = getEventCreationQuery(session_id, raw_event);
		chainer.add(creationQuery);
	}

	// Update the session with the updated last_event_at timestamp
	var sessionUpdateQuery = getSessionUpdateQuery(session_id, last_event_at);
	chainer.add(sessionUpdateQuery);

	// Run the queries and callback once they're done
	// NOTE: Chained queries occur in parallel
	chainer
		.run()
		.success(function(results) {
			res.jsend(201, results);
		})
		.error(function(error) {
			console.log(error);
			res.jerror(500, error);
		});
};


/////////////////////
// Utility Methods //
/////////////////////

var getSessionUpdateQuery = function(session_id, last_event_at) {
	var updateQuery = db.Session.update(
		{ last_event_at: new Date(parseInt(last_event_at)) }, /* new attribute value */
		{ id: session_id } /* `where` criteria */
	);

	return updateQuery
};

var getEventCreationQuery = function(session_id, raw_event) {
	var event_fields = null;
	var event_type = raw_event.event_type;
	var query = null;

	switch (event_type) {
		case EVENT_TYPES.AGENT_BUMP:
			event_fields = parseAgentBumpFields(session_id, raw_event);
			query = db.AgentBump.create(event_fields);
			break;
		case EVENT_TYPES.REGION_SWITCH:
			event_fields = parseRegionSwitchFields(session_id, raw_event);
			query = db.RegionSwitch.create(event_fields);
			break;
		case EVENT_TYPES.GAME_COMPLETION:
			event_fields = parseGameCompletionFields(session_id, raw_event);
			query = db.GameCompletion.create(event_fields);
			break;
		case EVENT_TYPES.CUSTOM_EVENT_TRIGGER:
			event_fields = parseCustomEventFields(session_id, raw_event);
			// query = db.CustomEventTrigger.create(event_fields);
			break;
	}

	return query;
};

var parseAgentBumpFields = function(session_id, event) {
	agent_fields = {
		bump_type: event.bump_type,
		agent_id: event.agent_id,
		agent_name: event.agent_name,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: session_id
	};

	return agent_fields;
};

var parseRegionSwitchFields = function(session_id, event) {
	region_fields = {
		region_id: event.region_id,
		region_name: event.region_name,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: session_id
	};

	return region_fields;
};

var parseGameCompletionFields = function(session_id, event) {
	completion_fields = {
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: session_id
	};

	return completion_fields;
};
