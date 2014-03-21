/**
 * Module Dependencies
 * Please note that the module load order matters!
 */
var express = require('express');

// Extend Express with JSend responses
require('./lib/jsend')(express);

// Environment Configuration
var env = process.env.NODE_ENV || 'development';
var config = require('./config/config')[env];
console.log("Environment: " + env);

// Database
var db = require('./app/models');

var app = express();
app.set('db', db); // SINGLETON


//////////////////////////////////////
// Express Middleware Configuration //
//////////////////////////////////////

app.configure(function() {
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
  // app.use(express.logger());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.logger());  
  app.use(express.errorHandler());
});

app.configure('test', function() {
  app.use(express.errorHandler());
})

// Setup routes
require('./routes')(app);

// Sync the database and launch the server
db
  .sequelize
  .sync()
  .complete(function(err) {
    if (err) {
      throw err;
    } else {
      app.listen(config.PORT);
      console.log('Listening on port %d', config.PORT);
    }
  });

// Export the app object for testing purposes
module.exports = app;