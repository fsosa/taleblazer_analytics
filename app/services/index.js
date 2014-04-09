/**
 * Initializes and loads all of our service singletons into the app
 */

var draftStateService = require('./draft_state_service');
var sessionService = require('./session_service');

module.exports = function(app) {
	app.services = {};
	
	app.services.DraftStateService = draftStateService(app);
	app.services.SessionService = sessionService(app);
}