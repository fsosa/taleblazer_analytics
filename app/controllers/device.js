var db = require('../models');
var _  = require('underscore');


exports.index = function(req, res) {
	// db.Device.findAll()
	// 	.success(function(devices) {
	// 		res.jsend(devices);
	// 	})
	// 	.error(function(error) {
	// 		res.jerror(500, error);
	// 	});
	// 	
	// 		select * from sessions where (started_at between '2014-01-14' and '2014-03-20') and draft_state_id IN (select id from draft_states where draft_id = 1 and published_game = 1); 
	// 		
	db.DraftState
		.findAll({ where: { draft_id: 4, published_game: 1 }, attributes: ['id'] })
		.success(function(resu) {
			var ids = _.map(resu, function(result) { return result.values['id'] });
			console.log(ids);
			db.Session
				.findAndCountAll({ where: { started_at: { between: ['2014-01-14', '2015-01-01'] }, draft_state_id: ids } })
				.success(function(results) {
					res.jsend(results);
				})
				.error(function(error){
					res.jerror(500, error);	
				})							
		})
		.error(function(error) {
			res.jerror(500, error);
		})

};

exports.create = function(req, res) {
	db.Device
		.find({ where: { device_id: req.body.device_id } })
		.success(function(device) {
			if (device) {
				// Found an existing device so let the API consumer know
				var message = 'Device already exists with device_id: ' + device.device_id;
				res.jerror(409, message);
			} else {
				// No device with matching device_id found, so create a new one
				createDevice(req, res);
			}
		})
		.error(function(error) {
			// There was an error retrieving the object from the database
			res.jerror(500, error);
		});
};

//////////////////////
// Utility Methods  //
//////////////////////

var createDevice = function(req, res) {
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
