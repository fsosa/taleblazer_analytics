var _ = require('underscore');

var SessionService = function(app) {
	this.app = app;
	this.Session = app.get('db').Session;
};

/**
 * Gets a list of Sessions for the given draft, initiated between the start and end times
 *
 * @param  {Sting}	draft_id        [ID of the draft (game)]
 * @param  {Date}   start_time		
 * @param  {Date}   end_time
 * @param  {Object} queryConditions [Object with `attributes` and `group` keys; each is an array of Sequelize query conditions]
 *                                  [See http://sequelizejs.com/docs/latest/models#finders ('Manipulating the dataset with limit, offset, order, and group')]
 *
 * @param  {Function} callback        [signature: (sessions, error)]
 */
SessionService.prototype.getSessions = function(draft_id, start_time, end_time, queryConditions, callback) {
	var attributes = queryConditions == null ? null : queryConditions.attributes;
	var group = queryConditions == null ? null : queryConditions.group;

	var self = this;

	this.app.services.DraftStateService.getDraftStateIDs(draft_id, function(draft_state_ids, error) {
		if (error) {
			callback(null, error);
		} else {
			self.Session
				.findAll({
					where: {
						started_at: {
							between: [start_time, end_time]
						},
						draft_state_id: draft_state_ids
					},
					attributes: attributes,
					group: group
				})
				.success(function(sessions) {
					var rawSessions = getRawValues(sessions);
					callback(rawSessions, null);
				})
				.error(function(error) {
					callback(null, error);
				});
		}
	});
};

var getRawValues = function(results) {
	return _.map(results, function(result) {
		return result.values;
	})
}

module.exports = function(app) {
	return new SessionService(app);
};
