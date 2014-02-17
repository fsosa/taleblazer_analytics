var request = require('supertest');
var should = require('chai').should();
var crypto = require('crypto');
var _ = require('underscore');

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

var saved_session_id = null;

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
				.end(function(err, res) {
					if (err) return done(err);
					saved_session_id = res.body.data.id;
					done();
				});
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

////////////
// Events //
////////////

describe('Events API', function() {

	events = {
		session_id: saved_session_id,
		last_event_at: Date.now(),
		events: [{
			event_type: 'AGENT_BUMP',
			bump_type: 'GPS',
			agent_id: 6,
			name: 'Bobby Beetle',
			occurred: (new Date() - 120)
		}, {
			event_type: 'REGION_SWITCH',
			region_id: 7,
			name: 'Jurassic Park',
			occurred: (new Date() - 60)
		}, {
			event_type: 'GAME_END',
			occurred: Date.now()
		}, {
			event_type: 'CUSTOM',
			event_id: 8,
			name: 'RAPTOR ATE PEOPLE',
			value: '4',
			occurred: (new Date() - 400)
		}, {
			event_type: 'CUSTOM',
			event_id: 8,
			name: 'RAPTOR ATE PEOPLE',
			value: '4',
			occurred: (new Date() - 1000)
		}]
	};

	describe('POST /events', function() {
		it('creates a list of events', function(done) {
			request
				.post('/events')
				.send(events)
				.expect(201)
				.expect(isSuccessResponseFormat)
				.end(done);
		});

		it('errors if parameters is missing from the request', function(done) {
			missing_session_id = _.extend({}, events);
			missing_session_id.session_id = null;

			request
				.post('/events')
				.send(missing_session_id)
				.expect(400)
				.expect(isErrorResponseFormat);

			missing_last_event_at = _.extend({}, events);
			missing_last_event_at.last_event_at = null;

			request
				.post('/events')
				.send(missing_last_event_at)
				.expect(400)
				.expect(isErrorResponseFormat)
				.end(done);

		});

		it('errors if events.data is not an array of events', function(done) {
			wrong_events = _.extend({}, events);
			wrong_events.events = {};

			request
				.post('/events')
				.send(events)
				.expect(400)
				.expect(isErrorResponseFormat)
				.end(done);
		});

	});
});