var express = require('express')
var Sequelize = require('sequelize')

var app = express();

var sequelize = new Sequelize('test', 'root', 'itllbeok', {
	host:'localhost',
	dialect: 'mysql', 
	dialectOptions: {
		// Necessary for XAMPP-specific local development - Update with the path to your mysql socket (XAMPP_DIR/etc/my.conf)
		socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock'	
	}
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
