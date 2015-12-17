'use strict';

const MAPQUEST_GEOCODE_URL         = 'https://www.mapquestapi.com/geocoding/v1/address',
	  MAPQUEST_REVERSE_GEOCODE_URL = 'https://www.mapquestapi.com/geocoding/v1/reverse';

var _get     = require('lodash.get'),
	_isNaN   = require('lodash.isnan'),
	domain   = require('domain'),
	config   = require('./config.json'),
	request  = require('request'),
	inRange  = require('lodash.inrange'),
	isNumber = require('lodash.isnumber'),
	isString = require('lodash.isstring'),
	platform = require('./platform'),
	apikey, geocodingType;

var _handleException = function (requestId, error) {
	platform.sendResult(requestId, null);
	platform.handleException(error);
};

/**
 * Emitted when device data is received.
 * @param {string} requestId The request id generated by the platform for this service request.
 * @param {object} data The data coming from the device represented as JSON Object.
 */
platform.on('data', function (requestId, data) {
	if (geocodingType === 'Forward') {
		if (!isString(data.address))
			return _handleException(requestId, new Error('Invalid address.'));

		request.get({
			url: MAPQUEST_GEOCODE_URL,
			qs: {
				key: apikey,
				location: data.address
			}
		}, function (reqError, response, body) {
			if (reqError)
				_handleException(requestId, reqError);
			else if (response.statusCode !== 200)
				_handleException(requestId, new Error(response.statusMessage));
			else {
				var d = domain.create();

				d.once('error', function () {
					_handleException(requestId, new Error('Invalid response from Mapquest Service. Response: ' + body));
					d.exit();
				});

				d.run(function () {
					data = JSON.parse(body);

					platform.sendResult(requestId, JSON.stringify(_get(data, 'results[0].locations[0].latLng')));

					platform.log(JSON.stringify({
						title: 'Mapquest Geocoding Service Result',
						input: {
							address: data.address
						},
						result: data
					}));

					d.exit();
				});
			}
		});
	}
	else {
		if (_isNaN(data.lat) || !isNumber(data.lat) || !inRange(data.lat, -90, 90) ||
			_isNaN(data.lng) || !isNumber(data.lng) || !inRange(data.lng, -180, 180)) {

			_handleException(requestId, new Error('Latitude (lat) and Longitude (lng) are not valid. lat: ' + data.lat + ' lng:' + data.lng));
		}
		else {
			request.get({
				url: MAPQUEST_REVERSE_GEOCODE_URL,
				qs: {
					key: apikey,
					location: data.lat + ',' + data.lng
				}
			}, function (reqError, response, body) {
				if (reqError)
					_handleException(requestId, reqError);
				else if (response.statusCode !== 200)
					_handleException(requestId, new Error(response.statusMessage));
				else {
					var d = domain.create();

					d.once('error', function () {
						_handleException(requestId, new Error('Invalid response from Mapquest Service. Response: ' + body));
						d.exit();
					});

					d.run(function () {
						console.log(body);
						var address = _get(JSON.parse(body), 'results[0].locations[0]');

						console.log(address);

						delete address.latLng;
						delete address.displayLatLng;
						delete address.unknownInput;
						delete address.mapUrl;

						platform.sendResult(requestId, JSON.stringify({
							address: address
						}));

						platform.log(JSON.stringify({
							title: 'Mapquest Geocoding Service Result',
							input: {
								lat: data.lat,
								lng: data.lng
							},
							result: address
						}));
					});
				}
			});
		}
	}
});

/*
 * Event to listen to in order to gracefully release all resources bound to this service.
 */
platform.on('close', function () {
	platform.notifyClose();
});

/*
 * Listen for the ready event.
 */
platform.once('ready', function (options) {
	apikey = options.apikey;
	geocodingType = options.geocoding_type || config.geocoding_type.default;

	platform.log('MapQuest Geocoding Service Initialized.');
	platform.notifyReady();
});