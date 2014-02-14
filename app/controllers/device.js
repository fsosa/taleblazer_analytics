var db = require('../models');


exports.index = function(req, res) {
	db.Device.findAll()
		.success(function(devices) {
			res.jsend(devices);
		})
		.error(function(error) {
			res.jerror(error);
		});
};

// Example payload:
//
// {
// 	device_id: STRING,
// 	os_type: 'android'/'ios',
// 	os_version: STRING,
// 	screen_resolution: STRING,
// 	model: STRING
// }
//
exports.create = function(req, res) {
	console.log("got here")
	// Create an object with the required fields for the device from the request
	device_fields = {
		device_id: req.body.device_id,
		os_type: req.body.os_type,
		os_version: req.body.os_version,
		screen_resolution: req.body.screen_resolution,
		model: req.body.model
	};

	db.Device
		.findOrCreate(device_fields)
		.success(function(device, created) {
			if (created) {
				// No device with matching device_id found, so new one was created
				res.jsend(device);
			} else {
				// Found an existing device so let the API consumer know
				message = 'Device already exists with device_id: ' + device.device_id;
				res.status(409);
				res.jerror(message);
			}
		})
		.error(function(error) {
			res.status(500);
			res.jerror(error);
		});

};