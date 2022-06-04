'use strict';

const { GuildMember } = require("discord.js");
const { internalError } = require("./utils.m");

const autorises = {};

autorises['enabled'] = false;

/**
 * @type {Array<string>}
 */
autorises['whiteList'] = [];

/**
 * @type {Array<string>}
 */
autorises['blackList'] = [];

/**
 * Add a role or a user id to the white list.
 * 
 * @param {string|Array<string>} p 
 */
autorises['addWhiteList'] = function addToWhiteList(p) {
    return addToList.apply(this, [p, this.whiteList]);
}

/**
 * Add a role or a user id to the white list.
 * 
 * @param {string|Array<string>} p 
 */
autorises['addBlackList'] = function addToBlackList(p) {
    return addToList.apply(this, [p, this.blackList]);
}

function addToList(p, list) {
    // add a single item
    function add(p) {
        if(typeof p === "string") {
            list.push(p);
            return true;
        }

        return false;
    }

    // add every item in an array
    if(p instanceof Array) {
        for(const toAdd of p) {
            add(toAdd);
        }
        return this;
    }

    if(!add(p)) return internalError("the parameter has to be a String or an Array of String!");
}

/**
 * Check if the given member is in the white list.
 * 
 * @param {GuildMember} member 
 */
autorises['check'] = function checkLists(member) {
    if(!this.enabled) return true;

    // if the member is in the whiteList
    // or if the member is not in the blackList
    if(checkList.apply(this, [member, this.whiteList]) || !checkList.apply(this, [member, this.blackList])) {
        return true;
    }

    return false;
}

function checkList(member, list) {
    // check if the id is in the list
    if(list.includes(member.id)) return true;

    // check if the member role is on the list
    for(const container of list) {
        if(member.roles.cache.find( function(value) {return value.name == container} )) return true;
    }

    return false;
}

module['exports'] = autorises;
