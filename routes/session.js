// This module contains the mapping between URL routes and the session controller methods
// Documentation regarding the API should precede every mapping

var session = require('../app/controllers/session');

module.exports = function(app) {
	app.get('/session', session.index);
	app.post('/session', session.create);
};
