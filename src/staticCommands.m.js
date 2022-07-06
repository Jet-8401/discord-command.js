'use strict';

const { isCommandObj, internalError } = require("../requirements/utils.m.js");
const commandFunction = require("./command.m.js");
const DEFAULT_MARK = '*';

const staticCommands = {};

staticCommands['categories'] = {};

// add the default category
staticCommands['categories'][DEFAULT_MARK] = [];

staticCommands['enabled'] = true;
staticCommands['count'] = 0;

/**
 * Add a static command to every command that matches the category, 
 * if category is not defined the command gonna expend to every command.
 * 
 * @param {object|command} obj an intance of handler.command or an object that is accepted by a command constructor
 * @param {?Array<string>} categories 
 */
staticCommands['add'] = function addStaticCommand(obj, categories) {
    let __command = obj;

    // check the validity of command
    if(!(__command instanceof commandFunction)) {
        
        if(!isCommandObj(__command)) {
            return internalError("command is not an instance of handler.command or a command object.");
        }

        // else create the command
        __command = new commandFunction(obj['entries'], obj['executable'], obj['options']);
    }

    staticCommands.count++;

    // if the categories is not given, set the command to the default categories
    if(!categories) {
        this.categories[DEFAULT_MARK].push(__command);
        return;
    }

    // add the categories and the command to it
    this.categories[categories.join()] = [__command];

    return this;
}

/**
 * Check if the given command is affected by a static commands and if so
 * check wich command to execute by its name.
 * 
 * @param {commandFunction} command 
 * @param {string} staticCommandName
 */
staticCommands['checkWith'] = function check(command, staticCommandName) {
    function play(category) {
        for(const staticCommand of this.categories[category]) {
            if(staticCommand.match(staticCommandName)) return staticCommand;
        }
    }

    for(const category in this.categories) {
        // if its the default category
        if(category === DEFAULT_MARK) {
            const staticCommand = play.apply(this, [category]);
            if(staticCommand) return staticCommand;
        }

        for(const commandCategory of command.categories) {
            // if the categories matches
            if(category.includes(commandCategory)) {
                const staticCommand = play.apply(this, [category]);
                if(staticCommand) return staticCommand;
            }

        }
    }
}

// /**
//  * Set the staticCommand for the given command (if any).
//  * 
//  * @param {commandFunction} command 
//  */
// staticCommands['setCommand'] = function setStaticCommand(command) {
//     for(const category in this.categories) {
//         // loop through the categories of the given command
//         for(const givenCategories of command.categories) {

//             if(category.includes(category) || category === DEFAULT_MARK) {
//                 command.addChilds(this.categories[category], {setCategories: true});
//             }

//         }
//     }

//     return command;
// }

module['exports'] = staticCommands;
