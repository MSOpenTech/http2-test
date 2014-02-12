// [From the spec](http://tools.ietf.org/html/draft-ietf-httpbis-http2-06#section-6.7):
//
//     DATA frames MUST be associated with a stream. If a DATA frame is
//     received whose stream identifier field is 0x0, the recipient MUST
//     respond with a connection error (Section 5.4.1) of type
//     PROTOCOL_ERROR.

var http2 = require('http2-protocol');
module.exports = function (socket, log, callback, frame) {
	var endpoint = new http2.Endpoint(log, 'SERVER', {});
	socket.pipe(endpoint).pipe(socket);
	var commonError;

	setImmediate(function () {
		frame = frame || {
			type : 'DATA',
			flags : {},
			data : new Buffer(0)
		};

		Object.getPrototypeOf(endpoint._serializer).constructor.commonHeader = function writeCommonHeader(frame, buffers) {
			var headerBuffer = new Buffer(8);

			// var size = 0;
			// for (var i = 0; i < buffers.length; i++) {
				// size += buffers[i].length;
			// }
			headerBuffer.writeUInt16BE(0, 0);
			headerBuffer.writeUInt8(0x0, 2);

			var flagByte = 0;
			headerBuffer.writeUInt8(flagByte, 3);
			// Commented out stream id writing
			//headerBuffer.writeUInt32BE(frame.stream || 0, 4);

			buffers.unshift(headerBuffer);
		};

		endpoint._compressor.write(frame);

		setTimeout(function () {
			// If there are no exception until this, then we're done
			if (commonError === undefined) {
				callback();
			} else {
				console.error(commonError);
				callback(commonError);
			}
		}, 2000);

	});

	endpoint._connection.on('peerError', function (error) {
		console.error('Unexpected client behavior');
		commonError = error;
	});
};
