// Copyright (c) 2012-2014 Heapsource.com and Contributors - http://www.heapsource.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
var winston = require('winston');
var util = require('util');

//Allow this file to get an exclusive copy of underscore so it can change the template settings without affecting others
delete require.cache[require.resolve('underscore')];
var _ = require('underscore');
delete require.cache[require.resolve('underscore')];

/**
 * A default list of properties in the request object that are allowed to be logged.
 * These properties will be safely included in the meta of the log.
 * 'body' is not included in this list because it can contains passwords and stuff that are sensitive for logging.
 * TODO: Include 'body' and get the defaultRequestFilter to filter the inner properties like 'password' or 'password_confirmation', etc. Pull requests anyone?
 * @type {Array}
 */
var requestWhitelist = ['url', 'headers', 'method', 'httpVersion', 'originalUrl', 'query'];

/**
 * A default list of properties in the request body that are allowed to be logged.
 * This will normally be empty here, since it should be done at the route level.
 * @type {Array}
 */
var bodyWhitelist = [];

/**
 * A default list of properties in the response object that are allowed to be logged.
 * These properties will be safely included in the meta of the log.
 * @type {Array}
 */
var responseWhitelist = ['statusCode'];

/**
 * A default function to filter the properties of the req object.
 * @param req
 * @param propName
 * @return {*}
 */
var defaultRequestFilter = function (req, propName) {
    return req[propName];
};

/**
 * A default function to filter the properties of the res object.
 * @param res
 * @param propName
 * @return {*}
 */
var defaultResponseFilter = function (req, propName) {
    return req[propName];
};

function filterObject(originalObj, whiteList, initialFilter) {

    var obj = {};

    [].concat(whiteList).forEach(function (propName) {
        var value = initialFilter(originalObj, propName);

        if(typeof (value) !== 'undefined') {
            obj[propName] = value;
        };
    });

    return obj;
}

//
// ### function errorLogger(options)
// #### @options {Object} options to initialize the middleware.
//


function errorLogger(options) {

    ensureValidOptions(options);

    options.requestFilter = options.requestFilter || defaultRequestFilter;

    return function (err, req, res, next) {

        // Let winston gather all the error data.
        // var exceptionMeta = winston.exception.getAllInfo(err);
        
        // (Fidel Note): Here we customize the error object that gets logged. The line above was the default behavior

        var exceptionMeta = {
            date: new Date().toString(),
            error: err.message,
            req: req
        }

        if (err instanceof Error) {
            exceptionMeta.msg = err.message;
            exceptionMeta.stack = err.stack && err.stack.split('\n');
        } else {
            exceptionMeta.msg = JSON.stringify(err);
        }

        exceptionMeta.req = filterObject(req, requestWhitelist, options.requestFilter);

        // This is fire and forget, we don't want logging to hold up the request so don't wait for the callback
        for(var i = 0; i < options.transports.length; i++) {
            var transport = options.transports[i];
            transport.logException('middlewareError', exceptionMeta, function () {
                // Nothing to do here
            });
        }

        next(err);
    };
}

//
// ### function logger(options)
// #### @options {Object} options to initialize the middleware.
//


function logger(options) {

    ensureValidOptions(options);

    options.requestFilter = options.requestFilter || defaultRequestFilter;
    options.responseFilter = options.responseFilter || defaultResponseFilter;
    options.level = options.level || "info";
    options.msg = options.msg || "HTTP {{req.method}} {{req.url}}";

    return function (req, res, next) {

        req._startTime = (new Date);

        req._routeWhitelists = {
            req: [],
            res: [],
            body: []
        };

        // Manage to get information from the response too, just like Connect.logger does:
        var end = res.end;
        res.end = function(chunk, encoding) {
            res.responseTime = (new Date) - req._startTime;

            res.end = end;
            res.end(chunk, encoding);

            var meta = {};
            
            if(options.meta !== false) {
              var bodyWhitelist;

              requestWhitelist = requestWhitelist.concat(req._routeWhitelists.req || []);
              responseWhitelist = responseWhitelist.concat(req._routeWhitelists.res || []);

              meta.req = filterObject(req, requestWhitelist, options.requestFilter);
              meta.res = filterObject(res, responseWhitelist, options.responseFilter);

              bodyWhitelist = req._routeWhitelists.body || [];

              if (bodyWhitelist) {
                  meta.req.body = filterObject(req.body, bodyWhitelist, options.requestFilter);
              };

              meta.responseTime = res.responseTime;
            }

            // Using mustache style templating
            _.templateSettings = {
              interpolate: /\{\{(.+?)\}\}/g
            };
            var template = _.template(options.msg);
            var msg = template({req: req, res: res});

            // This is fire and forget, we don't want logging to hold up the request so don't wait for the callback
            for(var i = 0; i < options.transports.length; i++) {
                var transport = options.transports[i];
                transport.log(options.level, msg, meta, function () {
                    // Nothing to do here
                });
            }
        };

        next();
    };
}

function ensureValidOptions(options) {
    if(!options) throw new Error("options are required by express-winston middleware");
    if(!options.transports || !(options.transports.length > 0)) throw new Error("transports are required by express-winston middleware");
};

module.exports.errorLogger = errorLogger;
module.exports.logger = logger;
module.exports.requestWhitelist = requestWhitelist;
module.exports.bodyWhitelist = bodyWhitelist;
module.exports.responseWhitelist = responseWhitelist;
module.exports.defaultRequestFilter = defaultRequestFilter;
module.exports.defaultResponseFilter = defaultResponseFilter;
