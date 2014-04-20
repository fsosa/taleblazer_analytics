var express = require('express');
var ECT = require('ect');
var fs = require('fs');

// Logging
var winston = require('winston');
var expressWinston = require('./lib/express-winston');

//////////////////////////////////////
// Express Middleware Configuration //
//////////////////////////////////////

var setupLogDirectory = function(env) {
	var config = require('./config/config')[env];
	var LOG_DIR = config.LOG_DIR;

	// Create log directory if it doesn't exist
	if (!fs.existsSync(LOG_DIR)) {
		fs.mkdirSync(LOG_DIR);
	}

	return LOG_DIR;
};

var getRequestLogger = function(env, log_dir) {

	if (env == 'development') {
		return express.logger('dev');
	} else {
		return expressWinston.logger({
			transports: [
				new winston.transports.File({
					filename: log_dir + env + '.log',
					json: false
				})
			],
			meta: false,
			msg: "{{req.method}} {{req.url}} - {{res.statusCode}} {{res.responseTime}}ms"
		});
	}
};

var getErrorLogger = function(env, log_dir) {
	var transport = null;

	if (env == 'development') {
		transport = new winston.transports.Console({
			json: true,
			colorize: true
		});
	} else {
		transport = new winston.transports.File({
			filename: log_dir + env + '.error.log'
		});
	}

	return expressWinston.errorLogger({
		transports: [transport]
	});
};

module.exports = function(app, env) {

	//////////////////////////////////////////////////////////////////////////////////////////////////////
	// IMPORTANT: DECLARATION ORDER MATTERS                                                             //
	// The order that middleware is passed to app.use is the order in which requests will be handled    //
	// e.g. static -> router serves static file first; router -> static serves the defined route first  //
	// http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work          //
	//////////////////////////////////////////////////////////////////////////////////////////////////////
			
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
	app.use(express.cookieSession({key: 'ta.sess', secret: 'Q7DXD3EWMa', cookie: { maxAge: 60 * 60 * 1000 }, proxy: true }));

	app.use(express.static(__dirname + '/public'));

	// Request logger must come BEFORE the router
	var log_dir = setupLogDirectory(env);
	app.use(getRequestLogger(env, log_dir));

	app.use(app.router);	

	// Error logger must come AFTER the router (so that we can get the errors)
	app.use(getErrorLogger(env, log_dir));


	// Development error handler 
	// TODO: Write your own error handler before getting to production
	app.use(express.errorHandler());


};