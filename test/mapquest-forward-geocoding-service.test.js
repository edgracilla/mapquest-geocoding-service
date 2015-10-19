'use strict';

const API_KEY = 'R29vpSI7eqPNB5lnclL6Wk51Q7oq7xYl';

var _      = require('lodash'),
	cp     = require('child_process'),
	should = require('should'),
	service;

describe('MapQuest Forward Geocoding Service', function () {
	this.slow(5000);

	after('terminate child process', function () {
		service.kill('SIGKILL');
	});

	describe('#spawn', function () {
		it('should spawn a child process', function () {
			should.ok(service = cp.fork(process.cwd()), 'Child process not spawned.');
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function (done) {
			this.timeout(5000);

			service.on('message', function (message) {
				if (message.type === 'ready')
					done();
			});

			service.send({
				type: 'ready',
				data: {
					options: {
						apikey: API_KEY,
						geocoding_type: 'Forward'
					}
				}
			}, function (error) {
				should.ifError(error);
			});
		});
	});

	describe('#data', function () {
		it('should process the address and send back the valid latitude and longitude coordinates', function (done) {
			service.on('message', function (message) {
				if (message.type === 'result') {
					var data = JSON.parse(message.data);

					console.log(data);
					should.ok(_.isNumber(data.lat), 'Latitude data invalid.');
					should.ok(_.isNumber(data.lng), 'Longitude data invalid.');
					done();
				}
			});

			service.send({
				type: 'data',
				data: {
					address: '10 Jupiter St, Bel-Air, Makati, PH 1209'
				}
			}, function (error) {
				should.ifError(error);
			});
		});
	});
});