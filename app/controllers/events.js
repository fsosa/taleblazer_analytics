var db = require('../models');

exports.create = function(req, res) {

};


/////////////////////
// Utility Methods //
/////////////////////

var createAgentBump = function(session_id, fields) {
	agent_fields = {
		bump_type: fields.bump_type, 
		session_id: session_id, 
		agent_id = fields.agent_id, 
		occurred_at: new Date(parseInt(fields.occurred_at));
	}

	db.Agent.create(agent_fields);
};

var createRegionSwitch = function(session_id, fields) {
	region_fields = {
		region_id:
	}
}