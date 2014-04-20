var db = require('../models');

exports.getPublishedDraftState = function(draft_id, callback) {
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
					callback(draft_state, null);
				})
				.error(function(error) {
					callback(null, error);
				})
		})
		.error(function(error) {
			callback(null, error);
		})
}