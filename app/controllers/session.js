var db = require('../models');

exports.index = function(req, res) {
	db.Session.findAll()
		.success(function(sessions) {
			res.jsend(sessions);
		}).error(function(error) {
			res.jerror(error);
		});
};

exports.create = function(req, res) {
	createSession(req, res);
};

/////////////////////
// Utility Methods //
/////////////////////

var createSession = function(req, res) {
	session_fields = {
		started_at: new Date(parseInt(req.body.started_at)),
		last_event_at: new Date(parseInt(req.body.last_event_at)),
		role: req.body.role,
		scenario: req.body.scenario,
		tap_to_visit: req.body.tap_to_visit,
		device_id: req.body.device_id,
		draft_state_id: req.body.draft_state_id
	};

	db.Session
		.create(session_fields)
		.success(function(session) {
			res.jsend(201, session);
		})
		.error(function(error) {
			// Session creation error e.g. model validation failed
			res.jerror(400, error);
		});

}