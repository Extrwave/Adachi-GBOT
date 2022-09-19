const os = require( "os" );
const app = {
	name: "adachi-gbot",
	cwd: "./",
	script: "app.ts",
	min_uptime: "1000",
	interpreter: "./node_modules/.bin/ts-node",
	interpreter_args: "-r tsconfig-paths/register",
	exec_mode: "fork",
	instances: 1,
	autorestart: true
};
if ( os.platform() === 'win32' ) {
	app.exec_mode = "cluster";
}
module.exports = {
	apps: [ app ]
}