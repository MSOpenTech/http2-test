var http2 = require('http2-protocol');

module.exports = function(socket, log, callback, frame) {
  var endpoint = new http2.Endpoint(log, 'SERVER', {});
  socket.pipe(endpoint).pipe(socket);
  var commonError;

  //Override Goaway method without assertions and without error code specified
  Object.getPrototypeOf(endpoint._serializer).constructor.GOAWAY = function writeGoaway(frame, buffers) {
    var buffer = new Buffer(8);
    var last_stream = frame.last_stream;
    buffer.writeUInt32BE(last_stream, 0);
    buffers.push(buffer);
  };

  endpoint.on('stream', function(stream) {
    frame = frame || {
      type: 'GOAWAY',
      flags: {},
      last_stream: 1
    };

    frame.stream = 0;
	
    endpoint._compressor.write(frame);

    setTimeout(function() {
      // If there are no exception until this, then we're done
      if (commonError === undefined) {
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