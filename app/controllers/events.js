var db = require('../models');
var util = require('util');


var EVENT_TYPES = {
	AGENT_BUMP: 'AGENT_BUMP',
	REGION_SWITCH: 'REGION_SWITCH',
	GAME_COMPLETION: 'GAME_COMPLETION',
	CUSTOM_EVENT_TRIGGER: 'CUSTOM_EVENT_TRIGGER',
	TTV_ENABLED: 'TTV_ENABLED'
};

exports.create = function(req, res) {
	var events = req.body.events;

	// Validate required fields and types
	if (util.isArray(events) == false) {
		res.jerror(400, 'Events should be an array');
		return;
	}
	var session_changes = {}; // session_id => timestamps

	var chainer = new db.Sequelize.Utils.QueryChainer;

	// Loop through all events and chain the event creation queries
	// to run them all at once and get a callback when all are complete
	//
	// Also keep track of the most recent event per session id to update the sessions accordingly
	for (i = 0; i < events.length; i++) {
		var raw_event = events[i];

		var session_id = raw_event.session_id;

		// If a single event in the batch is invalid, we fail the entire batch
		var validEvent = validateEvent(raw_event);
		if (!validEvent) {
			message = { message: 'Invalid event', data: raw_event };
			res.jerror(400, message);
			return;
		}

		// Extract changes to sessions (latest event times / ttv enabled) into session_changes dictionary
		extractSessionChanges(raw_event, session_changes);

		var creationQuery = getEventCreationQuery(raw_event);

		if (creationQuery != null) {
			chainer.add(creationQuery);	
		}
	}

	// Update the session with the updated last_event_at timestamp
	for (var session_id in session_changes) {
		var updates = session_changes[session_id];
		var sessionUpdateQuery = getSessionUpdateQuery(session_id, updates);
		chainer.add(sessionUpdateQuery);
	}


	// Run the queries and callback once they're done
	// NOTE: Chained queries occur in parallel
	chainer
		.run()
		.success(function(results) {
			res.jsend(201, results);
		})
		.error(function(error) {
			res.jerror(500, error);
		});
};


/////////////////////
// Utility Methods //
/////////////////////

var validateEvent = function(event) {
	// Events must have a valid session id
	if (event.session_id == null) {
		return false;
	}

	// Events must have a valid event_type (as defined in EVENT_TYPES)
	if (EVENT_TYPES[event.event_type] == null) {
		return false;
	}

	return true;
};

var extractSessionChanges = function(event, session_changes) {
	// Keep track of the latest event times
	var current_event_time = (event.event_type != EVENT_TYPES.TTV_ENABLED) ? event.occurred_at : null;
	var session = session_changes[event.session_id];
	var ttv_enabled = (event.event_type == EVENT_TYPES.TTV_ENABLED);

	if (session != null) {
		var latest_time = session.latest_time;

		// Keep track of the time the latest event occurred per session
		if (latest_time < current_event_time) {
			session.latest_time = current_event_time;
		}

		// If tap-to-visit was enabled, mark it as true and never change it back
		if (ttv_enabled) {
			session.ttv_enabled = ttv_enabled;
		}

	} else {
		// Haven't encountered this session yet so create a stub with this event's time
		session_changes[event.session_id] = { latest_time: current_event_time, ttv_enabled: ttv_enabled };
	}

};


var getSessionUpdateQuery = function(session_id, updates) {
	var last_event_at = updates.latest_time;
	var ttv_enabled = updates.ttv_enabled;
	var attribute_updates = { tap_to_visit: ttv_enabled };

	if (last_event_at != null) {
		attribute_updates.last_event_at = new Date(parseInt(last_event_at));
	} 

	var updateQuery = db.Session.update(
		attribute_updates, /* new attribute value(s) */
		{ id: session_id } /* `where` criteria */
	);

	return updateQuery;
};

var getEventCreationQuery = function(raw_event) {
	var event_fields = null;
	var event_type = raw_event.event_type;
	var query = null;

	switch (event_type) {
		case EVENT_TYPES.AGENT_BUMP:
			event_fields = parseAgentBumpFields(raw_event);
			query = db.AgentBump.create(event_fields);
			break;
		case EVENT_TYPES.REGION_SWITCH:
			event_fields = parseRegionSwitchFields(raw_event);
			query = db.RegionSwitch.create(event_fields);
			break;
		case EVENT_TYPES.GAME_COMPLETION:
			event_fields = parseGameCompletionFields(raw_event);
			query = db.GameCompletion.create(event_fields);
			break;
		case EVENT_TYPES.CUSTOM_EVENT_TRIGGER:
			event_fields = parseCustomEventFields(raw_event);
			query = db.CustomEventTrigger.create(event_fields);
			break;
	}

	return query;
};

var parseAgentBumpFields = function(event) {
	agent_fields = {
		bump_type: event.bump_type,
		agent_id: event.agent_id,
		agent_name: event.agent_name,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return agent_fields;
};

var parseRegionSwitchFields = function(event) {
	region_fields = {
		region_id: event.region_id,
		region_name: event.region_name,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return region_fields;
};

var parseGameCompletionFields = function(event) {
	completion_fields = {
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return completion_fields;
};

var parseCustomEventFields = function(event) {
	trigger_fields = {
		event_id: event.event_id,
		event_name: event.event_name,
		value: event.value,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return trigger_fields;
};
