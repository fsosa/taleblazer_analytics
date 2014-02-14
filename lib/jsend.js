// JSend Module
// Augments the Express response object with jsend, jfail, and jerror methods
// according to the JSend specification (http://labs.omniti.com/labs/jsend)


module.exports = function(express) {
	var res = express.response;

	/**
	 * Sends a successful HTTP JSON response
	 *
	 * @param  {Object} data
	 */
	res.jsend = function(data) {
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
	res.jerror = function(message, error) {

		this.send({
			status: 'error',
			message: message, 
		});
	};


};