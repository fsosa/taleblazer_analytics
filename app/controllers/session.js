var db = require('../models');
var _ = require('underscore');

exports.index = function(req, res, next) {
	db.Session.findAll()
		.success(function(sessions) {
			res.jsend(sessions);
		}).error(function(error) {
			res.jerror(error);
			next(error);
		});
};

exports.create = function(req, res, next) {
	createSession(req, res, next);
};

exports.update = function(req, res, next) {
	// Currently we only update sessions if tap_to_visit was enabled
	if (!_.isBoolean(req.body.tap_to_visit)) {
		res.jsend(400, "tap_to_visit must be a boolean");
	} else {
		db.Session.update(
			{ tap_to_visit: req.body.tap_to_visit }, /* new attribute value */
			{ id: req.params.id } /* where criteria */
		).success(function(result) {
			res.jsend(200, result);
		}).error(function(err) {
			res.jerror(500, err);
			next(error);
		});
	}
};

/////////////////////
// Utility Methods //
/////////////////////

var createSession = function(req, res, next) {
	if (req.body.draft_state_id == null || req.body.device_id == null || req.body.started_at == null) {
		res.jerror(400, "Missing required parameter");
		return;
	}

	var session_fields = {
		started_at: new Date(parseInt(req.body.started_at)),
		last_event_at: new Date(parseInt(req.body.last_event_at)),
		role_id: req.body.role_id,
		role_name: req.body.role_name,
		scenario_id: req.body.scenario_id,
		scenario_name: req.body.scenario_name,
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
					next(error);
				});
		})
		.error(function(error) {
			res.jerror(400, error);
			next(error);
		});



};
