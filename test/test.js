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
	app.get('db').sequelize.sync({
		force: true
	}).complete(function(err) {
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

	describe('GET /device', function() {

		it('responds with a list of devices', function(done) {
			request
				.get('/device')
				.expect(200)
				.expect(isSuccessResponseFormat)
				.end(function(err, res) {
					if (err) {
						done(err);
					} else {
						res.body.data.should.be.a('array');
						res.body.data[0].model.should.equal('iPhone 10');
						res.body.data[0].id.should.equal(1);
						done();
					}
				});
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
					// done();
				})
				.error(function(error) {
					// done(error);
				});

			app.get('db').DraftState.create({
				id: 42,
				draft_id: 90,
				name: 'a name',
				time_saved: Date.now(),
				single_player: true,
				published_game: true,
				previous_draft_state_id: 97
			})
				.success(function(device) {
					done()
				})
				.error(function(error) {
					done(error)
				});
		});

		it('creates a new session', function(done) {
			session = {
				started_at: Date.now(),
				last_event_at: Date.now(),
				role_id: 52,
				role_name: 'Tester',
				scenario_id: 90,
				scenario_name: 'The Session',
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
});


////////////
// Events //
////////////

describe('Events API', function() {
	var latest_time = Date.now(); // in milliseconds

	var events = {
		events: [{
				event_type: 'TTV_ENABLED',
				session_id: 1
			}, {
				event_type: 'AGENT_BUMP',
				bump_type: 'GPS',
				agent_id: 6,
				agent_name: 'Bobby Beetle',
				session_id: 1,
				occurred_at: latest_time + 1000,
			}, {
				event_type: 'REGION_SWITCH',
				region_id: 7,
				region_name: 'Jurassic Park',
				session_id: 1,
				occurred_at: latest_time + 1000
			}, {
				event_type: 'GAME_COMPLETION',
				occurred_at: latest_time + 4000,
				session_id: 3,
			}, {
				event_type: 'CUSTOM_EVENT_TRIGGER',
				event_id: 8,
				event_name: 'RAPTOR ATE PEOPLE',
				value: '4',
				occurred_at: latest_time + 2000,
				session_id: 2,
				draft_id: 89
			}, {
				event_type: 'CUSTOM_EVENT_TRIGGER',
				event_id: 9,
				event_name: 'DINOSAURS ESCAPED',
				value: '4',
				occurred_at: latest_time + 10000,
				session_id: 1,
				draft_id: 90
			}, {
				event_type: 'CUSTOM_EVENT_TRIGGER',
				event_id: 9,
				event_name: 'FUTURE COP MET',
				occurred_at: latest_time + 5000,
				session_id: 2,
				draft_id: 89
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
				scenario_name: 'Testing Sessions',
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
				.end(function(err, res) {
					// console.log(JSON.stringify(res.body));
					done(err);
				});
		});


		it('correctly updates the session with the time of the latest event, tap to visit status, and completion status', function(done) {
			app.get('db').Session
				.find({
					where: {
						id: 1
					}
				})
				.success(function(session) {
					assert.equal(session.last_event_at.toString(), new Date(latest_time + 10000).toString(), "Session date and latest time should be equal");
					assert.equal(session.tap_to_visit, true);
					assert.notEqual(session.completed, true);

					app.get('db').Session
						.find({
							where: {
								id: 3
							}
						})
						.success(function(session) {
							assert.equal(session.completed, true);
							done();
						})
						.error(function(error) {
							done(err);
						})

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

		it('creates the correct number of unique custom events (identified by event_id and draft_id, jointly)', function(done) {
			app.get('db').CustomEvent
				.findAndCountAll()
				.success(function(result) {
					assert.equal(result.count, 3, "There should be 3 unique custom events (as per the test data)");
					done();
				})
				.error(function(error) {
					done(error);
				})
		})

		it('rolls back db operations for a batch if there was an error with one of the events (request performed 2x)', function(done) {
			var bad_events = {
				events: [{
					event_type: 'GAME_COMPLETION',
					occurred_at: Date.now(),
					session_id: 2
				}, {
					event_type: 'AGENT_BUMP',
					agent_id: 6,
					agent_name: 'BAD PERSON',
					session_id: 1,
					occurred_at: (new Date() - 10000) // i.e. bad b/c missing BUMP_TYPE
				}]
			}

			request
				.post('/events')
				.send(bad_events)
				.expect(500)
				.expect(isErrorResponseFormat)
				.end(function(err, res) {

					request
						.post('/events')
						.send(bad_events)
						.expect(500)
						.expect(isErrorResponseFormat)
						.end(function(err, res) {
							app.get('db').Session
								.find({
									where: {
										id: 2
									}
								})
								.success(function(session) {
									assert.equal(session.completion_id, null);
									done();
								})
								.error(function(error) {
									done(err);
								})

						})

				})


		});

	});

});