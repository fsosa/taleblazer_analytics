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
	// Each function takes a callback(err, results) (named 'cb', in this case)
	// The second argument to async.parallel is the final callback which will get called when all the parallel tasks complete, 
	// which has signature callback(error, results), where results is an object with the same named keys and values corresponding to the output of the function calls
	// Takeaway: Future development should use this library as it increases readability and reduces nesting levels, of which there might be significantly many at points.
	// See https://github.com/caolan/async for documentation
	
	async.parallel({
		draft_title: function(cb) {
			getPublishedDraftState(draft_id, function(err, draft_state) {
				if (err) {
					cb(err, null);
				} else {
					cb(null, draft_state.name);
				}
			});
		},
		custom_events: function(cb) {
			getCustomEvents(draft_id, function(err, custom_events) {
				if (err) {
					cb(err, null);
				} else {
					var custom_event_names = _.map(custom_events, function(custom_event) {
						return custom_event.name;
					});

					cb(null, custom_event_names);
				}
			});
		}, 
		draft_id: function(cb) {
			cb(null, draft_id);
		}
	}, callback);
};

/**
 * Gets the published draft state for a given draft id
 * @param  {String}   draft_id
 * @param  {Function} callback(err, results)
 */
var getPublishedDraftState = exports.getPublishedDraftState = function(draft_id, callback) {
	db.Draft
		.find({
			where: {
				id: draft_id
			},
			attributes: ['publish_draft_state_id']
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
					attributes: ['name', 'image']
				})
				.success(function(draft_state) {
					callback(null, draft_state);
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
var getCustomEvents = exports.getCustomEvents = function(draft_id, callback) {
	db.CustomEvent
		.findAll({
			where: {
				draft_id: draft_id
			}
		})
		.success(function(custom_events) {
			callback(null, custom_events);
		})
		.error(function(error) {
			callback(error, null);
		});
};