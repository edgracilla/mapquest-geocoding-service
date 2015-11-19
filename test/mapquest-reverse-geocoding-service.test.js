'use strict';

const API_KEY = 'R29vpSI7eqPNB5lnclL6Wk51Q7oq7xYl';

var cp     = require('child_process'),
	should = require('should'),
	service;

describe('MapQuest Reverse Geocoding Service', function () {
	this.slow(8000);

	after('terminate child process', function () {
		service.send({
			type: 'close'
		});

		setTimeout(function () {
			service.kill('SIGKILL');
		}, 3000);
	});

	describe('#spawn', function () {
		it('should spawn a child process', function () {
			should.ok(service = cp.fork(process.cwd()), 'Child process not spawned.');
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function (done) {
			this.timeout(8000);

			service.on('message', function (message) {
				if (message.type === 'ready')
					done();
			});

			service.send({
				type: 'ready',
				data: {
					options: {
						apikey: API_KEY,
						geocoding_type: 'Reverse'
					}
				}
			}, function (error) {
				should.ifError(error);
			});
		});
	});

	describe('#data', function () {
		it('should process the latitude and longitude coordinates and send back a valid address', function (done) {
			this.timeout(4000);

			service.on('message', function (message) {
				if (message.type === 'result') {
					var data = JSON.parse(message.data);

					should.ok(data.address, 'Resulting address invalid.');
					done();
				}
			});

			service.send({
				type: 'data',
				data: {
					lat: 14.556978,
					lng: 121.034352
				}
			}, function (error) {
				should.ifError(error);
			});
		});
	});
});