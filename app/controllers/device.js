var db = require('../models');
var _  = require('underscore');


exports.index = function(req, res, next) {
	db.Device
		.findAll()
		.success(function(devices) {
			res.jsend(200, devices);
		})
		.error(function(error) {
			next(error);
		})

};

exports.create = function(req, res, next) {
	db.Device
		.find({ where: { device_id: req.body.device_id } })
		.success(function(device) {
			if (device) {
				// Found an existing device so let the API consumer know
				var message = 'Device already exists with device_id: ' + device.device_id;
				res.jerror(409, message);
			} else {
				// No device with matching device_id found, so create a new one
				createDevice(req, res, next);
			}
		})
		.error(function(error) {
			// There was an error retrieving the object from the database
			next(error);
		});
};

//////////////////////
// Utility Methods  //
//////////////////////

var createDevice = function(req, res, next) {
	var device_fields = {
		device_id: req.body.device_id,
		os_type: req.body.os_type,
		os_version: req.body.os_version,
		screen_resolution: req.body.screen_resolution,
		model: req.body.model
	};

	db.Device.create(device_fields)
		.success(function(new_device) {
			res.jsend(201, new_device);
		})
		.error(function(error) {
			// There was an error creating the object e.g. model validation failed
			res.jerror(400, error);
		});
};
