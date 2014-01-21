/**
 * Module Dependencies
 */

/**
 * POST /api/track
 * Content-Type: application/json
 * INSERT JSON OBJECT
 * Receives a JSON object of events, parses, and saves the events to the database
 */
exports.track = function(req, res) {
	var data = req.body;
	res.send(req.body);
	// Create event objects and persist to the database
};

/**
 * GET /api/identify
 * Returns a unique TaleblazerUID (TUID) to identify a device
 */
exports.identify = function(req, res) {
	var status = '';
	if (req.cookies['TUID'] == null) {
		expirationMs = 1000 * 60 * 60 * 24 * 365 * 5;
		res.cookie('TUID', 'insert-value-here-probably-a-hash', { maxAge: expirationMs });
		status = 'success';
	} else {
		status = 'already identified';
	}

	// TODO: figure out a standardized JSON response
	// TODO: Use HTTP error codes as well instead of returning 200 for everything all the time
	res.send( {'status': status, 'error': null} );
};

