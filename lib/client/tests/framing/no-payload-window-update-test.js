var http2 = require('http2-protocol');
var testUtils = require('../../testUtils');

module.exports = function (socket, log, callback, frame) {
	var endpoint = new http2.Endpoint(log, 'SERVER', {});
	socket.pipe(endpoint).pipe(socket);
	endpoint.on('stream', function (stream) {
	
		frame = {
			type : 'WINDOW_UPDATE',
			stream : 1
		};
		
		testUtils.withMethodSubstitution(Object.getPrototypeOf(endpoint._serializer).constructor, 'WINDOW_UPDATE',
			function (frame, buffers) {	
				var buffer = new Buffer(0);
				buffers.push(buffer)
			},
			function () {
				endpoint._compressor.write(frame);
			}
		);
		
	});

	endpoint.on('peerError', function (error) {
		log.debug('Receiving GOAWAY frame');
		if (error === 'FRAME_SIZE_ERROR') {
			callback();
		} else {
			callback('Not appropriate error code: ' + error);
		}
	});
};
