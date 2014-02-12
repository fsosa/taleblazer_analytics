// This module contains the mapping between URL routes and the device controller methods
// Documentation regarding the API should precede every mapping

var device = require('../app/controllers/device');

module.exports = function(app) {
	// Returns a list of all existing devices
	//
	// GET /device
	// Content-Type: application/json
	//
	app.get('/device', device.index);

	// Creates a new device with given parameters if none exist
	//
	// POST /device
	// Content-Type: application/json
	//
	// Example payload:
	// 	{
	// 	device_id: STRING,
	// 	os_type: 'android'/'ios',
	// 	os_version: STRING,
	// 	screen_resolution: STRING,
	// 	model: STRING
	// }
	app.post('/device', device.create);
};
