var request = require('supertest');
var should = require('chai').should();
var crypto = require('crypto');

var app = require('../server.js');

request = request(app);


/////////////////////
// Utility Methods //
/////////////////////

// Checks to see that the JSON response format conforms to the JSEND standard
var isSuccessResponseFormat = function(res) {
	res.body.should.have.property('status', 'success');
	res.body.should.have.property('data');
};

// Checks to see that the JSON response format conforms to the JSEND standard
var isErrorResponseFormat = function(res) {
	res.body.should.have.property('status', 'error');
	res.body.should.have.property('message');
};



///////////
// Tests //
///////////

describe('GET /device', function() {

	it('responds with a list of devices (GET /device)', function(done) {
		request
			.get('/device')
			.expect(200)
			.expect('Content-Type', /json/)
			.expect(isSuccessResponseFormat)
			.end(done);
	});
});

describe('POST /device', function() {
	random_device_id = crypto.randomBytes(8).toString('hex');

	it('creates a new device', function(done) {
		device = {
			device_id: random_device_id,
			os_type: 'ios',
			os_version: '1.5.2',
			screen_resolution: '640x400',
			model: 'iPhone 10'
		};

		request
			.post('/device')
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.send(device)
			.expect(201)
			.expect(isSuccessResponseFormat)
			.end(done);
	});

	it('errors if a parameter is missing', function(done) {
		device_missing_id = {
			os_type: 'ios',
			os_version: '1.5.2',
			screen_resolution: '640x400',
			model: 'iPhone 10'
		};

		request
			.post('/device')
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.send(device_missing_id)
			.expect(400)
			.expect(isErrorResponseFormat)
			.end(done);
	});

	it('errors if a duplicate device_id is encountered', function(done) {
		duplicate_device = {
			device_id: random_device_id,
			os_type: 'ios',
			os_version: '1.5.2',
			screen_resolution: '640x40f0',
			model: 'iPhone 10'
		};

		request
			.post('/device')
			.set('ContentType', 'application/json')
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.send(duplicate_device)
			.expect(409)
			.expect(isErrorResponseFormat)
			.end(done);
	});
});
