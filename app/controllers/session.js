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
		draft_state_id: req.body.draft_state_id
	};


	// First look up the device with the client's device_id
	db.Device
		.find({
			where: {
				device_id: req.body.device_id
			}
		})
		.success(function(device) {
			if (device == null) {
				message = 'Device with id{' + req.body.device_id + '} not registered. Must register device first.';
				res.jerror(400, message);
				return;
			}

			// Then, create the new session with a FK to the device we just found
			session_fields.device_id = device.id;

			db.Session
				.create(session_fields)
				.success(function(session) {
					res.jsend(201, session);
				})
				.error(function(error) {
					// Session creation error e.g. model validation failed
					res.jerror(400, error);
				});
		})
		.error(function(error) {
			res.jerror(400, error);
		});



};
