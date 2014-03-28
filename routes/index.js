var device_routes = require('./device.js');
var session_routes = require('./session.js');
var events_routes = require('./events.js');

var overview = require('../app/controllers/overview');
var games_played = require('../app/controllers/games_played');
var game_duration = require('../app/controllers/game_duration');

module.exports = function(app) {
	/////////////////
	// Mobile API //
	/////////////////
	device_routes(app);
	session_routes(app);
	events_routes(app);

	/////////////////////////////////
	// Analytics Site API / Views //
	/////////////////////////////////
	app.get('/overview/:draft_id', overview.index);
	app.get('/games-played/:draft_id', games_played.show);
	app.get('/gameplay-duration/:draft_id', game_duration.show);
};