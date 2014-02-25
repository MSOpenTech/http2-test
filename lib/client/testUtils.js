function TestUtils() {}

TestUtils.withMethodSubstitution = function (obj, methodName, methodSubstitution, callback) {
	var originalMethod = obj[methodName];
	try {		
		obj[methodName] = methodSubstitution;
		callback( );
	} finally {
		obj[methodName] = originalMethod;
	}
};	

module.exports = TestUtils;