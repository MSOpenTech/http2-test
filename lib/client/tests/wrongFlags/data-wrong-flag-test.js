var http2 = require('http2-protocol');
module.exports = function(socket, log, callback, frame, desiredError) {
  var endpoint = new http2.Endpoint(log, 'SERVER', {});
  socket.pipe(endpoint).pipe(socket);

  endpoint.on('stream', function(stream) {
    endpoint._compressor.write({
      type: 'HEADERS',
      flags: {},
      stream: stream.id,
      headers: {
        ':status': 200
      }
    });


    setTimeout(function() {
      Object.getPrototypeOf(endpoint._serializer).constructor
        .commonHeader = function writeCommonHeader(frame, buffers) {
          var headerBuffer = new Buffer(8);
          var frameTypes = [];
          var frameFlags = {};
          frameTypes[0x0] = 'DATA';
          frameFlags.DATA = ['END_STREAM', 'RESERVED', 'WRONG_FLAG'];
          var size = 0;
          for (var i = 0; i < buffers.length; i++) {
            size += buffers[i].length;
          }
          headerBuffer.writeUInt16BE(size, 0);
          var typeId = frameTypes.indexOf(frame.type);
          headerBuffer.writeUInt8(typeId, 2);

          var flagByte = 0;
          for (var flag in frame.flags) {
            var position = frameFlags[frame.type].indexOf(flag);
            if (frame.flags[flag]) {
              flagByte |= (1 << position);
            }
          }
          headerBuffer.writeUInt8(255, 3);

          headerBuffer.writeUInt32BE(frame.stream || 0, 4);

          buffers.unshift(headerBuffer);
      };
    }, 200);

    log.debug('Sending oversized DATA frame');
    endpoint._serializer._sizeLimit = Infinity;

    setTimeout(function() {
      endpoint._serializer.write({
        type: 'DATA',
        flags: {
          'WRONG_FLAG': 'true'
        },
        stream: stream.id,
        data: new Buffer(10)
      });
    }, 400);

  });



  endpoint._connection.on('peerError', function(error) {
    if (error === 'FRAME_SIZE_ERROR') {
      callback();
    } else {
      callback('Not appropriate error code: ' + error);
    }
  });
};