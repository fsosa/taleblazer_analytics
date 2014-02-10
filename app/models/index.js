/**
 * This module configures the database connection and collects all model definitions.
 */

var fs = require('fs'),
	path = require('path'),
	Sequelize = require('sequelize'),
	db = {};

module.exports = function(config, env) {
	// Configure the options hash
	var options = {
		host: config.db.host,
		dialect: 'mysql',
		dialectOptions: config.db.dialectOptions
	};

	// Disable logging if in production
	options.logging = (env == 'production') ? false : console.log;

	// Initialize the database connection
	var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, options);


	// Load model definitions
	// Find all the model files, import them, and assign them to the db object
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
	});

	// Extend the db object with references to the db connection and Sequelize
	db = Sequelize.Utils._.extend({
		sequelize: sequelize,
		Sequelize: Sequelize
	}, db);

	return db;
};