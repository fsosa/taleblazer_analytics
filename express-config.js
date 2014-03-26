var express = require('express');
var ECT = require('ect');
var fs = require('fs');

// Logging
var winston = require('winston');
var expressWinston = require('./lib/express-winston');

//////////////////////////////////////
// Express Middleware Configuration //
//////////////////////////////////////

var setupWinston = function(env) {
	var config = require('./config/config')[env];
	var LOG_DIR = config.LOG_DIR;

	// Create log directory if it doesn't exist
	if (!fs.existsSync(LOG_DIR)) {
		fs.mkdirSync(LOG_DIR);
	}

	var filename = LOG_DIR + env + '.log'; // Make configurable
	var consoleOptions = { colorize: true };
	var fileOptions = { filename: filename, json: false, timestamp: false };

	if (env != 'dev') {
		// By default, the Console transport is set on the default logger (winston)
		winston.remove(winston.transports.Console); 
	}

	winston.add(winston.transports.File, fileOptions);
}

var getRequestLogger = function(env) {
	setupWinston(env);

	var winstonStream = {
		write: function(message, encoding) {
			winston.info(message.trim());
		}
	}

	// See (http://www.senchalabs.org/connect/logger.html) for format options
	var format = (env == 'development') ? 'dev' : 'default';

	return express.logger({ stream: winstonStream, format: format });
}

module.exports = function(app, env) {
	///////////////////////////////////////////
	// IMPORTANT: DECLARATION ORDER MATTERS //
	//////////////////////////////////////////

	// Set the view directory and templating engine
	app.set('views', __dirname + '/app/views');
	var ectRenderer = ECT({
		watch: true,
		root: app.get('views')
	});
	app.engine('.ect', ectRenderer.render);

	app.use(express.favicon());
	app.use(express.json());
	app.use(express.methodOverride());
	app.use(express.cookieParser());

	var requestLogger = getRequestLogger(env);
	app.use(requestLogger);

	// Router should be the second to last to load
	// The order that middleware is passed to app.use is the order that requests will be handled
	// e.g. static -> router serves static file first; router -> static serves the defined route first
	// http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));

	// Error logger
	// if (true) {
	// 	app.use(expressWinston.errorLogger({
	// 		transports: [
	// 			new winston.transports.File({
	// 				json: true,
	// 				filename: './logs/error.log' // TODO: MAKE CONFIGURABLE VIA LOG_DIRECTORY OPTION
	// 			})
	// 		]
	// 	}))
	// }


	// Development error handler 
	app.use(express.errorHandler());

};