var glob = require('glob').sync,
expect = require('chai').expect,
bunyan = require('bunyan'),
path = require('path'),
tls = require('tls'),
fs = require('fs'),
http2Protocol = require('http2-protocol'),
Browser = require('./browser'),
portfinder = require('portfinder');


function TestBootstraper(startTest, callback) {
	testServer = tls.createServer({
			key : fs.readFileSync(path.join(__dirname + '../../res/keys/localhost.key')),
			cert : fs.readFileSync(path.join(__dirname + '../../res/keys/localhost.crt')),
			ALPNProtocols : ['HTTP-draft-09/2.0'],
			rejectUnauthorized : false
		});
	var port = 8443;
						
	portfinder.getPort(function (err, newPort) {
		port = newPort;
		testServer.listen(port);
	});
	
	testServer.on('listening', function() { 
		browser = new Browser(process.env.HTTP2_BROWSER);
		browser.start('https://localhost:' + port);
	});

	testServer.on('secureConnection', function (socket) {
		testServer.close();
		
		var originalCallback = callback;
		callback = function(error) {
			if(originalCallback) {
				originalCallback(error);
			}
			originalCallback = null;			
			socket.destroy();
		};
		
		socket.on('error', function (err) {
			console.error('Socket error: ' + err );
			if(originalCallback) {
				originalCallback(error);
			}
			originalCallback = null;
		});
		
		startTest(socket, createLogger('test'), callback);
	});
}

TestBootstraper.withMethodSubstitution = function (obj, methodName, methodSubstitution, callback) {
	var originalMethod = obj[methodName];
	try {		
		obj[methodName] = methodSubstitution;
		callback( );
	} finally {
		obj[methodName] = originalMethod;
	}
};

module.exports = TestBootstraper;

function createLogger(name) {
	return bunyan.createLogger({
		name : name,
		streams : [{
				level : 'debug',
				path : __dirname + '/../../test.log'
			}
		],
		serializers : http2Protocol.serializers,
		level : 'info'
	});
}
