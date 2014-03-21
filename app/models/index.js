/**
 * This module configures the database connection and collects all model definitions.
 */

 /**
 * Module Dependencies
 */
var fs = require('fs'),
	path = require('path'),
	Sequelize = require('sequelize'),
	db = {};

// Environment configuration
var env = process.env.NODE_ENV || 'development';
var config = require('../../config/config')[env];

// Configure database options
var options = {
	host: config.db.host,
	dialect: 'mysql',
	dialectOptions: config.db.dialectOptions
};

// Disable logging if in production
// options.logging = (env == 'development') ? console.log : false;
options.logging = console.log;
// Initialize the database connection
var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, options);

// Load model definitions
// Finds all the model files, imports them, and assigns them to the db object
fs
	.readdirSync(__dirname)
	.filter(function(file) {
		return (file.indexOf('.') !== 0) && (file !== 'index.js');
	})
	.forEach(function(file) {
		var model = sequelize.import(path.join(__dirname, file));
		db[model.name] = model;
	});


// Run the model associations via each model's `associate` class method
Object.keys(db).forEach(function(modelName) {
	if ('associate' in db[modelName]) {
		db[modelName].associate(db);
	}

	if ('setupHooks' in db[modelName]) {
		db[modelName].setupHooks(db);
	}
});

// Extend the db object with references to the db connection (sequelize) and Sequelize
db = Sequelize.Utils._.extend({
	sequelize: sequelize,
	Sequelize: Sequelize
}, db);

// Export the database object containing all model definitions
module.exports = db;

