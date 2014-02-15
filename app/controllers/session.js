var db = require('../models');

exports.index = function(req, res) {
	db.Session.findAll()
		.success(function(sessions) {
			res.jsend(sessions);
		}).error(function(error) {
			res.jerror(error);
		});
};

// Creates a new unique session with given parameters
//
// Example payload:
// 	 {
//		session_id: INT / null,
// 	 	started_at: DATE (ONLY unix timestamp int),
// 	 	last_event_at: DATE,
// 	 	role: STRING,
// 	 	scenario: STRING,	
// 	 	tap_to_visit: BOOLEAN,
// 	 	device_id: STRING,
// 	 	draft_state_id: INT,
// 	 }

exports.create = function(req, res) {
	session_fields = {
		id: req.body.session_id,
		started_at: new Date(parseInt(req.body.started_at)),
		last_event_at: new Date(parseInt(req.body.last_event_at)),
		role: req.body.role,
		scenario: req.body.scenario,
		tap_to_visit: req.body.tap_to_visit,
		device_id: req.body.device_id,
		draft_state_id: req.body.draft_state_id
	};

	// Ensure that this device does not have an existing session
	db.Session
		.findOrCreate(session_fields)
		.success(function(session, created) {
			// Created new session, respond with session id
			if (created) {
				res.jsend(session);
			} else {
				message = 'Session with id ' + session.id + ' already exists';
				res.status(409);
				res.jerror(message);
			}
		})
		.error(function(error) {
			res.status(400);
			res.jerror(error);
		});


};
