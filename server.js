/**
 * Module Dependencies
 * Please note that the module load order matters!
 */
var express = require('express');

// Environment Configuration
var env = process.env.NODE_ENV || 'development';

// Database
var db = require('./app/models');

// API / Routes
var api = require('./app/controllers/api');
var device = require('./app/controllers/device')

var app = express();


// Express Middleware Configuration - TODO: Consider moving to own configuration file
app.use(express.favicon());
app.use(express.logger());

app.use(express.json());
app.use(express.methodOverride());
app.use(express.cookieParser());

// Router should be the last to load (might need other middleware to register before the router - be safe)
app.use(app.router); 

if (env == 'development') {
  app.use(express.errorHandler());
}

/** ROUTES GO HERE UNTIL I EXTRACT THEM TO ANOTHER FILE **/
app.post('/api/track', api.track);
app.get('/api/identify', api.identify);

app.get('/device', device.index);
app.post('/device', device.create);

// Define the port for the server to listen on - TODO: Consider adding to configuration file.
var PORT = 3000;

// Sync the database and launch the server
db
  .sequelize
  .sync()
  .complete(function(err) {
    if (err) {
      console.log(err);
    } else {
      app.listen(PORT);
      console.log('Listening on port %d', PORT);
    }
  });




