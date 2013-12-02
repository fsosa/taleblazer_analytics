var express = require('express')
  , db		= require('./models') 

var app = express();

app.get('/', function(req, res) {

	db.Event.findAll().success(function(events) {
		console.log(events);
		res.send(events);
	}).failure(function(error) {
		res.send(error);
	});

});

app.get('/event', function(req, res) {

	db.Event.create({
		name: 'Agent Bump',
		occurred: new Date()
	}).success(function(event) {
		res.send(event);
	}).failure(function(err) {
		res.send(err);
	});
})

db.sequelize.sync().complete(function(err) {
	if (err) {
		throw err;
	} else {
		app.listen(3000);
		console.log('Listening on port 3000');
	}
});


