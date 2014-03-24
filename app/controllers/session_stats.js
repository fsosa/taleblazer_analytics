var db = require('../models');
var _ = require('underscore');
var moment = require('moment');

exports.sessionsInitiated = function(req, res, next) {
	var draft_id = req.params.draft_id;
	var start_time = req.body.start_time || req.query.start_time;
	var end_time = req.body.end_time || req.query.end_time;

	if (start_time == null || end_time == null) {
		// Default: beginning of week to end of current day
		start_time = moment().startOf('week');
		end_time = moment().endOf('day');
	} else {
		start_time = moment(start_time).startOf('day');
		end_time = moment(end_time).endOf('day');
	}

	
};

exports.sessionsCompleted = function(req, res, next) {

};

exports.completionTime = function(req, res, next) {

};

/////////////////////
// Utility Methods //
/////////////////////

