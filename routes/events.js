// This module contains the mapping between URL routes and the events controller methods
// Documentation regarding the API should precede every mapping

var events = require('../app/controllers/events');

module.exports = function(app) {
	app.post('/events', events.create);
};
