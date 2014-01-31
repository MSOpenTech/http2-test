// [From the spec](http://tools.ietf.org/html/draft-ietf-httpbis-http2-06#section-6.7):
//
//     DATA frames MUST be associated with a stream. If a DATA frame is
//     received whose stream identifier field is 0x0, the recipient MUST
//     respond with a connection error (Section 5.4.1) of type
//     PROTOCOL_ERROR.

var http2 = require('http2-protocol');
module.exports = function(socket, log, callback, frame, errorLevel, desiredError) {
  var endpoint = new http2.Endpoint(log, 'SERVER', {});
  socket.pipe(endpoint).pipe(socket);

  endpoint.on('stream', function(stream) {
    frame = frame;
    frame.stream = frame.stream || stream.id;
    log.debug('Sending stream-level ' + frame.type + ' frame');
    endpoint._compressor.write(frame);
  });
  Object.getPrototypeOf(endpoint._deserializer).constructor
    .RST_STREAM = function readRstStream(buffer, frame) {
      log.debug('RST_STREAM received');
      callback();
  };
  errorLevel = errorLevel || 'peerError';
  endpoint._connection.on(errorLevel, function(error) {
    if (error === desiredError) {
      callback();
    } else {
      callback('Not appropriate error code: ' + error);
    }
  });
};