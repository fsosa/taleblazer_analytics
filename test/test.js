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

///////////////
// API Tests //
///////////////

////////////
// Device //
////////////

describe('Device API', function() {

	describe('GET /device', function() {

		it('responds with a list of devices', function(done) {
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

		it('errors if a parameter is missing or invalid', function(done) {
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
				.expect(isErrorResponseFormat);

			invalid_os = device_missing_id;
			invalid_os.os_type = 'INVALID OS';

			request
				.post('/device')
				.send(invalid_os)
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

});



/////////////
// Session //
/////////////

describe('Session API', function() {

	describe('GET /session', function() {
		it('responds with a list of sessions', function(done) {
			request
				.get('/session')
				.expect(200)
				.expect('Content-Type', /json/)
				.expect(isSuccessResponseFormat)
				.end(done);
		});
	});

	describe('POST /session', function() {
		it('creates a new session', function(done) {
			random_device_id = crypto.randomBytes(8).toString('hex');
			var session_id;

			session = {
				started_at: Date.now(),
				last_event_at: Date.now(),
				role: 'Tester',
				scenario: 'Testing Scenario',
				tap_to_visit: false,
				device_id: 1,
				draft_state_id: 42
			};

			request
				.post('/session')
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.send(session)
				.expect(201)
				.expect(isSuccessResponseFormat)
				.end(done);
		});

		it('errors if a parameter is missing or invalid', function(done) {
			session_missing_start_time = {
				started_at: Date.now(),
				last_event_at: Date.now(),
				role: 'Tester',
				scenario: 'Testing Scenario',
				tap_to_visit: false,
				device_id: 1,
				draft_state_id: 42
			};

			request
				.post('/session')
				.send(session_missing_start_time)
				.expect(400)
				.expect(isErrorResponseFormat);

			missing_device_id = session_missing_start_time;
			missing_device_id.device_id = null;

			request
				.post('/session')
				.send(missing_device_id)
				.expect(400)
				.expect(isErrorResponseFormat)
				.end(done);
		});


	});
});
