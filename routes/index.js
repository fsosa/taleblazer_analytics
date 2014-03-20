var device_routes = require('./device.js');
var session_routes = require('./session.js');
var events_routes = require('./events.js');

var overview = require('../app/controllers/overview');

module.exports = function(app) {
	/////////////////
	// Mobile API //
	/////////////////
	device_routes(app);
	session_routes(app);
	events_routes(app);

	/////////////
	// Views  //
	/////////////
	app.get('/overview/:draft_id', overview.index);
};