var express = require('express')
var Sequelize = require('sequelize')

var app = express();

// NOTE:
// For dev, uncomment 'skip-networking' in XAMPP_DIR/etc/my.cnf
// Or update sequelize with socket-passthrough
var sequelize = new Sequelize('test', 'root', 'itllbeok', {
	host:'localhost',
	dialect: 'mysql'
})

app.get('/', function(req, res) {
	sequelize.query('SELECT * FROM data').success(function(rows) {
		res.send(rows);
	}).failure(function(err) {
		res.send(err);
	})
	
});

app.listen(3000);
console.log('Listening on port 3000');
