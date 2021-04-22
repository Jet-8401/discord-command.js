const colors = require("colors");

/**
 * @param {!string} message
 * @param {?boolean} abort tell if the action was aborted
 * @param {?boolean} error log the message with a TypeError
 */
const warn = (message, abort, error) => {
	const consoleMsg = `${colors.blue(require("../package.json").name)} -> ${colors.bgYellow.black("WARN")} ${message}`;
	console.error(error ? new TypeError(consoleMsg) : consoleMsg);
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

/**
 * Upper case the first char of a string
 * @param {!string} string
 */
const capitalize = string => {
	if (typeof string !== "string") return string;
	const upper = string.toUpperCase();
	return upper[0] + string.slice(1);
};

module.exports = {
	warn,
	log,
	capitalize,
};
