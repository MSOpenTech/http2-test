describe('HTTP/2 client', function () {

	var http2 = require('http2-protocol');
	var testBootstrapper = require('../testBootstrapper');
	var tlsSocket;

	var testFunc = function (socket, log, callback, frame) {
		tlsSocket = socket;
		var endpoint = new http2.Endpoint(log, 'SERVER', {});
		socket.pipe(endpoint).pipe(socket);

		var commonError;
		setImmediate(function () {
			endpoint._serializer._sizeLimit = Infinity;
			Object.getPrototypeOf(endpoint._serializer).constructor.commonHeader = function writeCommonHeader(frame, buffers) {
				var headerBuffer = new Buffer(8);
				//65535 = '1111111111111111'. So there are no reserver bits.
				headerBuffer.writeUInt16BE(65535, 0);
				headerBuffer.writeUInt8(0x0, 2);
				var flagByte = 0;
				headerBuffer.writeUInt8(flagByte, 3);
				headerBuffer.writeUInt32BE(1, 4);
				buffers.unshift(headerBuffer);
			};

			frame = frame || {
				type : 'DATA',
				flags : {},
				data : new Buffer(10)
			};

			log.debug('Sending data frame without stream specified');

			endpoint._compressor.write(frame);

			setTimeout(function () {
				// If there are no exception until this, then we're done
				if (commonError === undefined) {
					console.error('Sent without errors');
					callback();
				} else {
					console.error(commonError);
					callback(commonError);
				}
			}, 2000);

		});

		endpoint._connection.on('peerError', function (error) {
			commonError = error;
		});
	};
	it(testFunc, function (done) {
		testBootstrapper(testFunc, function (error) {
			done(error);
			tlsSocket.destroy();
		});

	});
});
