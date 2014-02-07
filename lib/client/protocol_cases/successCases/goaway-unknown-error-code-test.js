// [From the spec](http://tools.ietf.org/html/draft-ietf-httpbis-http2-06#section-6.8):
//
//     The GOAWAY frame applies to the connection, not a specific stream.
//     The stream identifier MUST be zero.

var http2 = require('http2-protocol');

module.exports = function(socket, log, callback, frame) {
  var endpoint = new http2.Endpoint(log, 'SERVER', {});
  socket.pipe(endpoint).pipe(socket);
  var commonError;

  Object.getPrototypeOf(endpoint._serializer).constructor.GOAWAY = function writeGoaway(frame, buffers) {
    var buffer = new Buffer(8);
    var last_stream = frame.last_stream;
    buffer.writeUInt32BE(last_stream, 0);
    buffer.writeUInt32BE(30, 4);
    buffers.push(buffer);
  };

  endpoint.on('stream', function(stream) {
    frame = frame || {
      type: 'GOAWAY',
      flags: {},
      last_stream: 1,
      error: 'NO_ERROR'
    };

    frame.stream = 0;

    log.debug('Sending stream-level ' + frame.type + ' frame');

    endpoint._compressor.write(frame);

    setTimeout(function() {
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

  endpoint._connection.on('peerError', function(error) {
    commonError = error;
  });
};