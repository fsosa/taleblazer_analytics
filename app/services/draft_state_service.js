var _ = require('underscore');

var DraftStateService = function(app) {
	this.app = app;
	this.DraftState = app.get('db').DraftState;
};

/**
 * Calls back with a list of published DraftStates for a specific draft_id
 * @param  {Number}   draft_id 
 * @param  {Function} callback [signature: (draft_states, error) ]
 */
DraftStateService.prototype.getDraftStates = function(draft_id, callback) {
	this.DraftState
		.findAll({
			where: {
				draft_id: draft_id,
				published_game: 1
			}
		})
		.success(function(draft_states) {
			callback(draft_states, null);
		})
		.error(function(error) {
			callback(null, error);
		});
};

/**
 * Calls back with a list of IDs for published DraftStates for a specific draft_id
 * @param  {Number}   draft_id 
 * @param  {Function} callback [signature: (draft_states, error)]
 */
DraftStateService.prototype.getDraftStateIDs = function(draft_id, callback) {
	this.getDraftStates(draft_id, function(draft_states, error) {
		if (error) {
			callback(null, error);
		} else {
			var draft_state_ids = _.map(draft_states, function(draft_state) {
				return draft_state.values['id'];
			});

			callback(draft_state_ids, null);
		}
	});
};

module.exports = function(app) {
	return new DraftStateService(app);
};
