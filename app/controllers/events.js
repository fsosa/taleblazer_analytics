var db = require('../models');
var util = require('util');


var EVENT_TYPES = {
	AGENT_BUMP: 'AGENT_BUMP',
	REGION_SWITCH: 'REGION_SWITCH',
	GAME_COMPLETION: 'GAME_COMPLETION',
	CUSTOM_EVENT_TRIGGER: 'CUSTOM_EVENT_TRIGGER'
};

exports.create = function(req, res) {
	var events = req.body.events;

	// Validate required fields and types
	if (util.isArray(events) == false) {
		res.jerror(400, 'Events should be an array');
		return;
	}
	var last_session_event_times = {}; // session_id => timestamps

	var chainer = new db.Sequelize.Utils.QueryChainer;

	// Loop through all events and chain the event creation queries
	// to run them all at once and get a callback when all are complete
	// 
	// Also keep track of the most recent event per session id to update the sessions accordingly
	// 
	// NOTE: If one of the events is missing a session ID, the others will be still be created but we will return an error. 
	// The Mobile client should not send up those types of events. 
	for (i = 0; i < events.length; i++) {
		var raw_event = events[i];

		var session_id = raw_event.session_id;
		var current_event_time = raw_event.occurred_at;
		var latest_time = last_session_event_times[session_id];

		if (latest_time != null) {
			if (latest_time < current_event_time) {
				last_session_event_times[session_id] = current_event_time;
			}
		} else {
			last_session_event_times[session_id] = current_event_time;
		}

		var creationQuery = getEventCreationQuery(raw_event);
		chainer.add(creationQuery);
	}

	// Update the session with the updated last_event_at timestamp
	for(var session_id in last_session_event_times) {
		var last_event_at = last_session_event_times[session_id];
		var sessionUpdateQuery = getSessionUpdateQuery(session_id, last_event_at);
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

var getSessionUpdateQuery = function(session_id, last_event_at) {
	var updateQuery = db.Session.update(
		{ last_event_at: new Date(parseInt(last_event_at)) }, /* new attribute value(s) */
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