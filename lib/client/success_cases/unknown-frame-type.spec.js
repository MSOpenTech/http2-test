/*
Type:  The 8-bit type of the frame.  The frame type determines how
the remainder of the frame header and payload are interpreted.
Implementations MUST ignore frames of unsupported or unrecognized
types.
 */
 
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

			var size = 0;
			for (var i = 0; i < buffers.length; i++) {
				size += buffers[i].length;
			}
			headerBuffer.writeUInt16BE(size, 0);
			var typeId = 13; // Invalid Frame Type
			headerBuffer.writeUInt8(typeId, 2);

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
		
		log.debug('Sending frame with unknown type');
		setTimeout(function () {
			endpoint._compressor.write(frame);
		}, 200);

		setTimeout(function () {
			// If there are no exception until this, then we're done
			if (commonError === undefined) {
				callback();
			} else {
				console.error(commonError);
				callback(commonError);
			}
		}, 1500);
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