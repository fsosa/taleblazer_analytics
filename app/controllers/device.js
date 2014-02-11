var db = require('../models');


exports.index = function(req, res) {
	db.Device.findAll()
		.success(function(devices) {
			response = {
				status: 'success',
				data: { "devices": devices}
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
	// Verify that the device is not already in the database
	db.Device.find({
		where: {
			device_id: req.body.device_id
		}
	}).success(function(device) {
		console.log(device);
		// Found an existing device so let the API consumer know
		if (device != null) {
			response = {
				status: 'error',
				message: 'Device already exists with device_id: ' + req.body.device_id
			};

			res.status(409);
			res.send(response);
		} else {
			// Create the new object since it doesn't already exist
			db.Device.create({
				device_id: req.body.device_id,
				os_type: req.body.os_type,
				os_version: req.body.os_version,
				screen_resolution: req.body.screen_resolution,
				model: req.body.model
			}).success(function(device) {
				response = {
					status: 'success',
					data: device
				};

				res.send(response);
			}).error(function(error) {
				response = {
					status: 'error',
					message: error
				};

				res.status(400);
				res.send(response);
			});
		}

	});
	//

};
