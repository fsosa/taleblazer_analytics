// JSend Module
// Augments the Express response object with jsend, jfail, and jerror methods
// according to the JSend specification (http://labs.omniti.com/labs/jsend)


module.exports = function(express) {
	var res = express.response;

	/**
	 * Sends a successful HTTP JSON response
	 *
	 * @param  {Mixed} data or status
	 * @param  {Mixed} data
	 */
	res.jsend = function(data) {

		// Maintain the res.send API - res.send(status, data)
		if (arguments.length == 2) {
			this.statusCode = data;
			data = arguments[1];
		}

		this.send({
			status: 'success',
			data: data
		});
	};

	/**
	 * Sends an error HTTP JSON response
	 * @param  {String | Error} message
	 * @param  {String} code
	 */
	res.jerror = function(message) {

		// Maintain the res.send API - res.send(status, message)
		if (arguments.length == 2) {
			this.statusCode = message;
			message = arguments[1];
		}

		this.send({
			status: 'error',
			message: message
		});
	};


};