module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	grunt.initConfig({
		jshint: {
			options: {

			},
			all: {
				src: ['lib/**/*.js', 'Gruntfile.js']
			}
		},
		mochaTest: {
			options: {
				reporter: 'spec',
				timeout: 20000
			},
			client: {
				src: ['./lib/client/**/*.spec.js']
			},
		}
	});

	grunt.registerTask('build', ['jshint']);
	grunt.registerTask('test', ['build', 'mochaTest:client']);
	grunt.registerTask('default', ['test']);
};