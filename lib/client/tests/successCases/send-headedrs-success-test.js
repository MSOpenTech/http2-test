// [From the spec](http://tools.ietf.org/html/draft-ietf-httpbis-http2-06#section-6.7):
//
//     DATA frames MUST be associated with a stream. If a DATA frame is
//     received whose stream identifier field is 0x0, the recipient MUST
//     respond with a connection error (Section 5.4.1) of type
//     PROTOCOL_ERROR.

var http2 = require('http2-protocol');
module.exports = function(socket, log, callback, frame, desiredError) {
  var endpoint = new http2.Endpoint(log, 'SERVER', {});
  socket.pipe(endpoint).pipe(socket);
  var commonError;
  endpoint.on('stream', function(stream) {
    endpoint._compressor.write({
      type: 'HEADERS',
      stream: stream.id,
      headers: {
        ':status': 200
      }
    });

    console.error("HEADERS SENT");
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