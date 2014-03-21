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


	// Loop through all events and chain the event creation queries
	// to run them all at once and get a callback when all are complete
	//
	// Also keep track of the most recent event per session id to update the sessions accordingly
	db.sequelize.transaction(function(t) {
		var session_changes = {}; // session_id => timestamps	
		console.log("START TRANSACTION");
		var chainer = new db.Sequelize.Utils.QueryChainer;

		for (i = 0; i < events.length; i++) {
			var raw_event = events[i];

			var session_id = raw_event.session_id;

			// If a single event in the batch is invalid, we fail the entire batch
			var validEvent = validateEvent(raw_event);
			if (!validEvent) {
				var message = {
					message: 'Invalid event',
					data: raw_event
				};
				res.jerror(400, message);
				return;
			}

			// Extract changes to sessions (latest event times / ttv enabled) into session_changes dictionary
			extractSessionChanges(raw_event, session_changes);

			runEventCreationQuery(raw_event, t, chainer);
		}

		// Update the session with the updated last_event_at timestamp
		for (var session_id in session_changes) {
			var updates = session_changes[session_id];
			runSessionUpdateQuery(session_id, updates, t, chainer);
		}
		console.log("CALLING RUN ON CHAINER");
		chainer.run()
			.success(function(results) {
				// console.log(results);
				t.commit().success(function() {
					console.log("COMMITTED");
					res.jsend(201, results);
				})
					.error(function(error) {
						console.log(error);
						res.jerror(500, results);
					});
			})
			.error(function(error) {
				console.log(error);
				t.rollback().success(function() {
					console.log("ROLLED BACK");
					console.log(error);
					res.jerror(500, error);
				}).error(function() {
					res.jerror(500, error);
				})
			})

	});
};


/////////////////////
// Utility Methods //
/////////////////////

var validateEvent = function(event) {
	// Events must have a valid session id
	if (event.session_id == null || event.session_id < 0) {
		return false;
	}

	// Events must have a valid event_type (as defined in EVENT_TYPES)
	if (EVENT_TYPES[event.event_type] == null) {
		return false;
	}

	return true;
};

var extractSessionChanges = function(event, session_changes) {
	var current_event_time = (event.event_type != EVENT_TYPES.TTV_ENABLED) ? event.occurred_at : null;
	var session = session_changes[event.session_id];
	var ttv_enabled = (event.event_type == EVENT_TYPES.TTV_ENABLED);

	// Here we create an object corresponding to a session's attributes that need to be updated/ 
	// The object is of the form: 
	// 		{ session_model_attribute: new_value, ... } 
	// The attribute update object is then directly used in getSessionUpdateQuery
	if (session != null) {


		var latest_time = session.last_event_at;

		// Keep track of the time the latest event occurred per session
		if (latest_time < current_event_time || latest_time == undefined) {
			session.last_event_at = current_event_time;
		}

		// If tap-to-visit was enabled, mark it as true and never change it back
		if (ttv_enabled) {
			session.tap_to_visit = ttv_enabled;
		}

	} else {
		// Haven't encountered this session id yet
		// Since we're building the attribute update object, we want to make sure there are no keys with null values
		// This could happen if a TTV_ENABLED event is the only event sent. 
		// We don't want that event to extend the time played, so last_event_at would be null
		// Kind of messy to build the object individually, but works for now. 
		session_changes[event.session_id] = {};
		if (ttv_enabled) {
			session_changes[event.session_id].tap_to_visit = ttv_enabled;
		}

		if (current_event_time != null) {
			session_changes[event.session_id].last_event_at = current_event_time;
		}
	}
};

var errorCallback = function(error) {
	res.jerror(400, error);
	return;
}


var runSessionUpdateQuery = function(session_id, updates, t, chainer) {
	var last_event_at = updates.last_event_at;
	var ttv_enabled = updates.tap_to_visit;
	db.Session.find({where: {id: session_id}})
	.success(function(session) {
		console.log(session.id ,session.started_at.getTime(), updates.last_event_at)
		console.log(session.started_at.getTime() < updates.last_event_at);
		chainer.add(session.updateAttributes(updates, {transaction: t}) );
	}).error(function(error) {
		console.log(error);
	})
	
	// console.log(session_id, last_event_at);
	// chainer.add(db.Session.update(
	// 	updates, {
	// 		id: session_id
	// 	},{
	// 		transaction: t
	// 	}
	// ).error(function(error) {
	// 	console.log("IN HERE");
	// 	console.log(error);
	// }));
	// return updateQuery;
};

var runEventCreationQuery = function(raw_event, t, chainer) {
	var event_fields = null;
	var event_type = raw_event.event_type;
	var query = null;
	var transaction = {
		transaction: t
	}
	switch (event_type) {
		case EVENT_TYPES.AGENT_BUMP:
			event_fields = parseAgentBumpFields(raw_event);
			chainer.add(db.AgentBump.create(event_fields, transaction).error(function(error) {
				console.log("IN HERE");
				console.log(error);
			}));
			break;
		case EVENT_TYPES.REGION_SWITCH:
			event_fields = parseRegionSwitchFields(raw_event);
			chainer.add(db.RegionSwitch.create(event_fields, transaction).error(function(error) {
				console.log("IN HERE");
				console.log(error);
			}));
			break;
		case EVENT_TYPES.GAME_COMPLETION:
			event_fields = parseGameCompletionFields(raw_event);
			chainer.add(query = db.GameCompletion.create(event_fields, transaction).error(function(error) {
				console.log("IN HERE");
				console.log(error);
			}));
			break;
		case EVENT_TYPES.CUSTOM_EVENT_TRIGGER:
			event_fields = parseCustomEventFields(raw_event);
			var cet = db.CustomEventTrigger.build(event_fields);
			// add validation
			cet.draft_id = raw_event.draft_id;
			cet.game_event_id = raw_event.event_id;
			chainer.add(cet.save(transaction).error(function(error) {
				console.log("IN HERE");
				console.log(error);
			}));

			break;
	}
};

var parseAgentBumpFields = function(event) {
	var agent_fields = {
		bump_type: event.bump_type,
		agent_id: event.agent_id,
		agent_name: event.agent_name,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return agent_fields;
};

var parseRegionSwitchFields = function(event) {
	var region_fields = {
		region_id: event.region_id,
		region_name: event.region_name,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return region_fields;
};

var parseGameCompletionFields = function(event) {
	var completion_fields = {
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return completion_fields;
};

var parseCustomEventFields = function(event) {
	var trigger_fields = {
		event_id: event.event_id,
		event_name: event.event_name,
		value: event.value,
		occurred_at: new Date(parseInt(event.occurred_at)),
		session_id: event.session_id
	};

	return trigger_fields;
};