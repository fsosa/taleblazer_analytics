var _ = require('underscore');

/**
 * Given an object x, flattens the object into one level
 * @param  {Object} x      Object to flatten
 * @param  {Object} result Object to add the flattened keys to
 * @param  {[type]} prefix Optional key prefix
 * @return {[type]}        [description]
 */
var flatten = function(x, result, prefix) {
	if (_.isObject(x)) {
		_.each(x, function(v, k) {
			flatten(v, result, prefix ? prefix + '_' + k : k)
		})
	} else {
		result[prefix] = x
	}
	return result
}

// Extend Underscore with the new utility methods
_.mixin({
	flatten: flatten
});