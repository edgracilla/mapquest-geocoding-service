'use strict';

var platform   = require('./platform'),
	request     = require('request'),
	isreverse, apikey;


/*
 * Listen for the data event.
 */
platform.on('data', function (data) {

	var url = 'http://www.mapquestapi.com/geocoding/v1/address?';

	if (isreverse) {
		url = url + 'key=' + apikey + '&callback=renderReverse&location=' + data.lat + ',' + data.lon;
	} else {
		url = url + 'key=' + apikey + '&location=' + data;
	}

	request(url, function (err, response, body) {

		if (err) {
			console.error(err);
			platform.handleException(err);
		} else if (response.statusCode !== 200) {

			var statErr = new Error(response.statusMessage);

			console.error(statErr);
			platform.handleException(statErr);
		} else {
			platform.sendResult(body);
		}
	});

});

/*
 * Listen for the ready event.
 */
platform.once('ready', function (options) {

	apikey	  = options.apikey;
	isreverse = options.isreverse;

	platform.log('MapQuest Geocode Service Initialized.');
	platform.notifyReady();

});