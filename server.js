/**
 * Module Dependencies
 * Please note that the module load order matters!
 */
var express = require('express');

// Extend Express with JSend responses
require('./lib/jsend.js')(express);

// Environment Configuration
var env = process.env.NODE_ENV || 'development';

// Database
var db = require('./app/models');

var app = express();

// Express Middleware Configuration - TODO: Consider moving to own configuration file
app.use(express.favicon());
app.use(express.logger());

app.use(express.json());
app.use(express.methodOverride());
app.use(express.cookieParser());


// Router should be the last to load (might need other middleware to register before the router - be safe)
// The order that middleware is passed to app.use is the order that requests will be handled
// e.g. static -> router serves static file; router -> static serves the defined route
// http://stackoverflow.com/questions/12695591/node-js-express-js-how-does-app-router-work
app.use(app.router);

if (env == 'development') {
  app.use(express.errorHandler());
}

// Setup routes
require('./routes')(app);


// Define the port for the server to listen on - TODO: Consider adding to configuration file.
var PORT = 3000;

// Sync the database and launch the server
db
  .sequelize
  .sync()
  .complete(function(err) {
    if (err) {
      throw err;
    } else {
      app.listen(PORT);
      console.log('Listening on port %d', PORT);
    }
  });