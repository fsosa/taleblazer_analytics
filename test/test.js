var request = require('supertest');
var should = require('chai').should();
var assert = require('assert')
var crypto = require('crypto');
var _ = require('underscore');

process.env.NODE_ENV = 'test';

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

//////////////////////////
// Global Preconditions //
//////////////////////////

before(function(done) {
	// Synchronize the database before we start
	// {force: true} drops the tables and recreates them each test run
	app.get('db').sequelize.sync({ force:true }).complete(function(err) {
		console.log('--- Test DB tables dropped ---');
		console.log('--- Database synchronized ---');
		if (err) return done(err);
		done();
	});
});

////////////
// Device //
////////////

describe('Device API', function() {

	describe('GET /device', function() {

		it('responds with a list of devices', function(done) {
			request
				.get('/device')
				.expect(200)
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

		// Create the device that we use in the first test
		// NOTE: Runs before all tests in this describe block
		before(function(done) {
			device = {
				device_id: "TE-STING-DEV1CE-1D3",
				os_type: 'ios',
				os_version: '1.5.2',
				screen_resolution: '640x400',
				model: 'iPhone 10'
			};
			app.get('db').Device.create(device)
				.success(function(device) {
					done();
				})
				.error(function(error) {
					done(error);
				});
		});

		it('creates a new session', function(done) {
			session = {
				started_at: Date.now(),
				last_event_at: Date.now(),
				role_id: 52, 
				role_name: 'Tester',
				scenario_id: 90,
				scenario_name: 'Testing Scenario',
				tap_to_visit: false,
				device_id: "TE-STING-DEV1CE-1D3",
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

		it('errors if there is no matching device in the db', function(done) {
				session = {
				started_at: Date.now(),
				last_event_at: Date.now(),
				tap_to_visit: false,
				device_id: "OBVIOUSLY-FAKE-ID",
				draft_state_id: 42
			};

			request
				.post('/session')
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.send(session)
				.expect(400)
				.expect(isErrorResponseFormat)
				.end(done);

		});

		it('errors if start_time or device_id are missing', function(done) {
			session_missing_start_time = {
				started_at: Date.now(),
				last_event_at: Date.now(),
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

	describe('PUT /session/', function() {
		it('updates a session with the new tap_to_visit value', function(done) {
			var session_id = 1;
			request
				.put('/session/' + session_id)
				.send({ tap_to_visit: true })
				.expect(200)
				.expect(isSuccessResponseFormat)
				.end(done);
		});

		it('only updates if session_id is part of the URL', function(done) {
			request
				.put('/session')
				.send({ tap_to_visit: true })
				.expect(404)
				.end(done);

		});

		it('errors if tap_to_visit is not a boolean', function(done) {
			var session_id = 1;
			request
				.put('/session/' + session_id)
				.send({ tap_to_visit: true })
				.expect(isSuccessResponseFormat)
				.end(done);

		});
	});
});


////////////
// Events //
////////////

describe('Events API', function() {
	var latest_time = Date.now();

	var events = {
		events: [{
				event_type: 'AGENT_BUMP',
				bump_type: 'GPS',
				agent_id: 6,
				agent_name: 'Bobby Beetle',
				session_id: 1,
				occurred_at: (new Date() - 10000)
			}, {
				event_type: 'REGION_SWITCH',
				region_id: 7,
				region_name: 'Jurassic Park',
				session_id: 1,
				occurred_at: (new Date() - 4000)
			}, {
				event_type: 'GAME_COMPLETION',
				occurred_at: (new Date() - 2000),
				session_id: 3,
			}, {
				event_type: 'CUSTOM_EVENT_TRIGGER',
				event_id: 8,
				event_name: 'RAPTOR ATE PEOPLE',
				value: '4',
				occurred_at: (new Date() - 1000),
				session_id: 2,
			}, {
				event_type: 'CUSTOM_EVENT_TRIGGER',
				event_id: 8,
				event_name: 'RAPTOR ATE PEOPLE',
				value: '4',
				occurred_at: latest_time,
				session_id: 1,
			}

		]
	};

	describe('POST /events', function() {
		before(function(done) {
			session = {
				started_at: Date.now(),
				last_event_at: Date.now(),
				role_id: 52, 
				role_name: 'Tester',
				scenario_id: 90,
				scenario_name: 'Testing Scenario',
				tap_to_visit: false,
				device_id: "TE-STING-DEV1CE-1D3",
				draft_state_id: 42
			};

			app.get('db').Session.bulkCreate([
				session, 
				session, 
				session, 
				session, 
				session
			]).success(function() {
				done();
			}).error(function(err) {
				done(err);
			})
		});

		it('creates a list of events', function(done) {
			request
				.post('/events')
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.send(events)
				.expect(201)
				.expect(isSuccessResponseFormat)
				.end(done);
		});


		it('correctly updates the session with the latest event', function(done) {
			app.get('db').Session
				.find({ where: { id: 1} })
				.success(function(session) {
					assert.equal(session.last_event_at.toString(), new Date(latest_time).toString(), "Session date and latest time should be equal");
					done();
				})
				.error(function(err) {
					done(err);
				})
		});

		it('errors if any of the events is missing a session_id (and does not create any event)', function(done) {
			events.events[0].session_id = null;
			request
				.post('/events')
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.send(events)
				.expect(400)
				.expect(isErrorResponseFormat)
				.end(done);
		});

		it('errors if data is not an array of events', function(done) {
			wrong_events = _.extend({}, events);
			wrong_events.events = {};

			request
				.post('/events')
				.send(wrong_events)
				.expect(400)
				.expect(isErrorResponseFormat)
				.end(done);
		});

	});
});
