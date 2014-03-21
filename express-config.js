var express = require('express');

//////////////////////////////////////
// Express Middleware Configuration //
//////////////////////////////////////

module.exports = function(app, env) {
	///////////////////////////////////////////
	// IMPORTANT: DECLARATION ORDER MATTERS //
	//////////////////////////////////////////

	// Set the view directory and templating engine
	app.set('views', __dirname + '/app/views');
	app.set('view engine', 'jade');

	app.use(express.favicon());
	app.use(express.json());
	app.use(express.methodOverride());
	app.use(express.cookieParser());

	// Router should be the second to last to load (might need other middleware to register before the router - be safe)
	// The order that middleware is passed to app.use is the order that requests will be handled
	// e.g. static -> router serves static file first; router -> static serves the defined route first
	// http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work
	if (env == 'development') {
		app.use(express.logger('dev'));	
	}
	
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));

	// Development error handler
	if (env == 'development') {
		app.use(express.errorHandler());	
	}

};