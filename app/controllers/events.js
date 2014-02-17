var db = require('../models');
var util = require('util');
var _ = require('underscore');

var EVENT_TYPES = {
	AGENT_BUMP: 'AGENT_BUMP',
	REGION_SWITCH: 'REGION_SWITCH',
	GAME_END: 'GAME_END',
	CUSTOM_EVENT: 'CUSTOM_EVENT'
};

exports.create = function(req, res) {
	var session_id = req.body.session_id;
	var last_event_at = req.body.last_event_at;
	var events = req.body.events;

	// Validate required fields and types
	if (session_id == null) {
		res.jerror(400, 'Session id is required');
	}

	if (last_event_at == null) {
		res.jerror(400, "Field \'last_event_at\' is required");
	}


	if (util.isArray(events) == false) {
		res.jerror(400, 'Events should be an array');
	}

	var chainer = new db.Sequelize.Utils.QueryChainer;
	for (i = 0; i < events.length; i++) {
		var event_type = events[i].event_type;

		switch (event_type) {
			case EVENT_TYPES.AGENT_BUMP:
				chainer.add(createAgentBump(session_id, events[i]));
				break;
		}
	}

	chainer
		.run()
		.success(function(results) {
			res.jsend(201, results);
		})
		.error(function(error) {
			res.jerror(500, error);
		});


};


/////////////////////
// Utility Methods //
/////////////////////

var createAgentBump = function(session_id, fields) {
	console.log('running');
	agent_fields = {
		bump_type: fields.bump_type,
		agent_id: fields.agent_id,
		agent_name: fields.agent_name,
		occurred_at: new Date(parseInt(fields.occurred_at)),
		session_id: session_id
	};

	db.Agent.create(agent_fields);
};

var createRegionSwitch = function(session_id, fields) {
	region_fields = {
		region_id: fields.region_id,
		name: fields.name,
		occurred_at: new Date(parseInt(fields.occurred_at)),
		session_id: session_id
	};

	db.RegionSwitch.create(region_fields);
};

var createGameCompletion = function(session_id, fields) {
	completion_fields = {
		occurred_at: new Date(parseInt(fields.occurred_at)),
		session_id: session_id
	};

	db.GameCompletion.create(completion_fields);
};