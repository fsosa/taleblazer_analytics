var device_routes = require('./device.js');
var session_routes = require('./session.js');

module.exports = function(app) {
	device_routes(app);
	session_routes(app);
};