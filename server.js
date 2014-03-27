/**
 * Module Dependencies
 * Please note that the module load order matters!
 */
var express = require('express');

// Extend Express with JSend responses
require('./lib/jsend')(express);

// Environment Configuration
var env = process.env.NODE_ENV || process.argv[2] || 'development';
var config = require('./config/config')[env];

if (config == null) {
  console.log("Environment must be development / test / production");
  return;
}

console.log("Environment: " + env);

// Database
var db = require('./app/models');

var app = express();
app.set('db', db); // SINGLETON

// Express Configuration
require('./express-config.js')(app, env);

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