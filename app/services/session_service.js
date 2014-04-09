var _ = require('underscore');

var SessionService = function(app) {
	this.app = app;
	this.Session = app.get('db').Session;
};

/**
 * Calls back with a list of Sessions for the specific draft_id, initiated between 
 * the start_time and end_time. 
 * 
 * @param  {Number}   draft_id        
 * @param  {Date}   start_time      
 * @param  {Date}   end_time        
 * @param  {Object}   queryConditions [Object with `attributes` and `group` keys, each is an array of Sequelize conditions]
 *                                    See http://sequelizejs.com/docs/latest/models#finders ('Manipulating the dataset with limit, offset, order, and group')
 *                                 
 * @param  {Function} callback        [signature: (sessions, error)]
 */
SessionService.prototype.getSessions = function(draft_id, start_time, end_time, queryConditions, callback) {
	var attributes = queryConditions == null ? null : queryConditions.attributes;
	var group = queryConditions == null ? null : queryCondition.group;

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
						callback(sessions, null);
					})
					.error(function(error) {
						callback(null, error);
					});
			}
	});
};

module.exports = function(app) {
	return new SessionService(app);
}
