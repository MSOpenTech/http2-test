// [From the spec](http://tools.ietf.org/html/draft-ietf-httpbis-http2-06#section-6.8):
//
//     The GOAWAY frame applies to the connection, not a specific stream.
//     The stream identifier MUST be zero.

var http2 = require('http2-protocol');

module.exports = function(socket, log, callback, frame) {
  var endpoint = new http2.Endpoint(log, 'SERVER', {});
  socket.pipe(endpoint).pipe(socket);

  endpoint.on('stream', function(stream) {
    frame = {
      type: 'SETTINGS',
      flags: {'ACK':'true'},
      stream: 0,
       settings: {
       SETTINGS_MAX_CONCURRENT_STREAMS: '12'
       }
    };

    //frame.

    log.debug('Sending stream-level ' + frame.type + ' frame');

    endpoint._compressor.write(frame);
  });

  endpoint.on('peerError', function(error) {
    log.debug('Receiving GOAWAY frame');
    if (error === 'FRAME_SIZE_ERROR') {
      callback();
    } else {
      callback('Not appropriate error code: ' + error);
    }
  });
};