const colors = require("colors");

/**
 * @param {!string} message
 * @param {?boolean} abort tell if the action was aborted
 */
const warn = (message, abort) => {
	console.error(
		new TypeError(
			`${colors.blue(require("../package.json").name)} -> ${colors.bgYellow.black(
				"WARN"
			)} ${message}`
		)
	);
	if (abort) console.log(colors.blue(colors.italic("- action aborted")));
	return message;
};

const log = {
	/**
	 * overwrite a message in the console
	 * @param {!string} message
	 */
	process: function (message) {
		process.stdout.cursorTo(0);
		process.stdout.clearLine();
		process.stdout.write(message);
	},
};

module.exports = {
	warn,
	log,
};
