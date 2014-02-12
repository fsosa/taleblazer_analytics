var db = require('../models');


exports.index = function(req, res) {
	db.Device.findAll()
		.success(function(devices) {
			response = {
				status: 'success',
				data: {
					'devices': devices
				}
			};

			res.send(response);
		}).error(function(error) {
			response = {
				status: 'error',
				message: error
			};

			res.send(response);
		});
};

/**
 * POST /device
 * Content-Type: application/json
 *
 * Example Payload:
 	{
		device_id: STRING,
		os_type: 'android'/'ios',
		os_version: STRING,
		screen_resolution: STRING,
		model: STRING
	}
 *
 *
 */
exports.create = function(req, res) {
	// Create an object with the required fields for the device
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
			// No device with matching device_id found, so new one was created
			if (created) {
				response = {
					status: 'success',
					data: device
				};
			}
			// Found an existing device so let the API consumer know
			else {

				response = {
					status: 'failure',
					message: 'Device already exists with device_id: ' + device.device_id
				};

				res.status(409);
			}

			res.send(response);
		})
		.error(function(error) {
			response = {
				status: 'error',
				message: error
			};

			res.status(400);
			res.send(response);
		});

};
