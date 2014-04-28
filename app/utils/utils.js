var db = require('../models');
var _ = require('underscore');
var async = require('async');


/**
 * Gets the page variables common to all site pages
 * e.g. draft_title (game name), custom_events (for the menu sidebar), and the draft_id (for convenience)
 * @param  {String}   draft_id
 * @param  {Function} callback(error, results) [results is an object with named keys corresponding to the keys of the first argument to async.parallel below]
 */
exports.getPageVariables = function(draft_id, callback) {
	// This uses the wonderful async library which allows us to avoid multiple levels of nesting
	// In particular, async.parallel takes an object with functions as the key values.
	// Each function takes a callback(err, results) (named 'cb', in this case), where results is the value that you would like to return from the function call.
	// The second argument to async.parallel is the final callback which will get called when all the parallel tasks complete,
	// which has signature callback(error, results), where results is an object with the same named keys and values corresponding to the output of the function calls
	// 
	// Key Takeaway: Future development should use this library as it increases readability and reduces nesting levels, of which there can be significantly many at points.
	// See https://github.com/caolan/async for documentation

	async.parallel({
		draft_info: function(cb) {
			getCurrentDraftInfo(draft_id, function(err, data) {
				if (err) {
					cb(err, null);
				} else {
					if (data) {
						cb(null, data);	
					} else {
						cb(null, null);
					}
					
				}
			});
		},
		custom_events: function(cb) {
			getCustomEvents(draft_id, function(err, custom_events) {
				if (err) {
					cb(err, null);
				} else {
					if (custom_events) {
						cb(null, custom_events);	
					} else {
						cb(null, null);
					}
					
				}
			});
		},
		draft_id: function(cb) {
			cb(null, draft_id);
		}
	}, callback);
};

/**
 * Gets current information for a given draft_id e.g.
 * 	- the title of the currently published draft state
 * 	- the time that the draft was first created
 * 	
 * @param  {String}   draft_id
 * @param  {Function} callback(err, results)
 */
var getCurrentDraftInfo = function(draft_id, callback) {
	db.Draft
		.find({
			where: {
				id: draft_id
			},
			attributes: ['publish_draft_state_id', 'time_created']
		})
		.success(function(draft) {
			if (draft == null) {
				callback(null, null);
				return;
			}

			db.DraftState
				.find({
					where: {
						id: draft.publish_draft_state_id
					},
					attributes: ['name']
				})
				.success(function(draft_state) {
					var title = (draft_state == null) ? null : draft_state.name;

					data = {
						title: title, 
						time_created: draft.time_created
					};

					callback(null, data);
				})
				.error(function(error) {
					callback(error, null);
				});
		})
		.error(function(error) {
			callback(error, null);
		});
};

/**
 * Gets all the CustomEvents associated with a draft_id
 * @param  {String}   draft_id
 * @param  {Function} callback(results, error)
 */
var getCustomEvents = function(draft_id, callback) {
	db.CustomEvent
		.findAll({
			where: {
				draft_id: draft_id
			}, 
			attributes: ['event_id', 'name']
		})
		.success(function(custom_events) {
			callback(null, custom_events);
		})
		.error(function(error) {
			callback(error, null);
		});
};