'use strict';

const parser = {};

parser['arguments'] = {};

/**
 * Parse the array of arguments.
 * 
 * @param {Array<string>} arguments
 */
parser['process'] = function parseArgument(__arguments) {
    for(const arg of __arguments) {
        const args = arg.split('=');
        // if the arguments match the syntax
        if(args[0] && args[1]) {
            this.arguments[args[0]] = args[1];
        }
    }

    return this.arguments;
}

module['exports'] = parser;
