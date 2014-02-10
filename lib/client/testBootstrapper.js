var glob = require('glob').sync,
expect = require('chai').expect,
bunyan = require('bunyan'),
path = require('path'),
tls = require('tls'),
fs = require('fs'),
http2Protocol = require('http2-protocol');
var Browser = require('./browser');

module.exports = function (startTest, callback) {
	testServer = tls.createServer({
			key : fs.readFileSync(path.join(__dirname + '../../res/keys/localhost.key')),
			cert : fs.readFileSync(path.join(__dirname + '../../res/keys/localhost.crt')),
			ALPNProtocols : ['HTTP-draft-09/2.0'],
			rejectUnauthorized : false
		});

	testServer.listen(8443);
	browser = new Browser(process.env.HTTP2_BROWSER);
	setTimeout(function () {
		browser.start('https://localhost:8443');
	}, 200);

	testServer.on('secureConnection', function (socket) {
		testServer.close();
		startTest(socket, createLogger('test'), callback);
	});
};

function createLogger(name) {
	return bunyan.createLogger({
		name : name,
		streams : [{
				level : 'debug',
				path : __dirname + '../../../../test.log'
			}
		],
		serializers : http2Protocol.serializers,
		level : 'info'
	});
}
