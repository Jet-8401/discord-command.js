'use strict';

const Discord = require("discord.js");
const Voice = require("@discordjs/voice");
const { internalError } = require("../requirements/utils.m");

function Queue({maxSize}) {
    this.content = [];
    this.maxSize = maxSize;
    this.currentlyPlaying = false;
    this.lastSong = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    this.isLoop = false;

    this.connection = false;
    this.audioPlayer = Voice.createAudioPlayer();

    // set the events
    setEvents.apply(this);
}

/**
 * Add something to the queue.
 * 
 * `force` param is to enabled if you want to 'break' the
 * maximum size of the queue, that means that if the length of the 
 * curernt queue is too long to add something eles the first element
 * on the queue gonna be deleted and the item gonna be pushed into the end.
 * By default the maximum size is set to 100 and can be change into `voiceHandler['maxSize']`
 * 
 * @param {*} item item to add to the queue
 * @param {boolean} force
 * @returns {boolean}
 */
Queue.prototype.add = function addContent(item, force) {
    if(this.content.length >= this.maxSize) {
        if(force) {
            this.content.shift();
            this.content.push(item);
            return true;
        }

        return false;
    }

    this.content.push(item);
    return true;
}

/**
 * Make the bot play a ressource into a voice channel.
 * 
 * @param {Voice.AudioResource} ressource
 * @param {?Discord.VoiceChannel} voiceChannel
 */
Queue.prototype.play = function playSong(ressource, voiceChannel) {
    this.currentlyPlaying = true;

    // create a voice connection if any has been created
    if(!(this.connection instanceof Voice.VoiceConnection)) {
        if(voiceChannel) this.createVoiceConnection(voiceChannel);
        return internalError("Impossible to create a voice connection!");
    }

    // attach the audioPlayer
    this.connection.subscribe(this.audioPlayer);

    // play the audio
    this.audioPlayer.play(ressource);

    return this;
}

/**
 * Create a voice connection to a voice channel.
 * 
 * @param {Discord.VoiceChannel} voiceChannel 
 * @returns {Queue}
 */
Queue.prototype.createVoiceConnection = function createVoiceConnection(voiceChannel, selfDeaf=true) {
    this.connection = Voice.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: selfDeaf,
    });

    return this;
}

Queue.prototype.hasVoiceConnection = function hasVoiceConnection() {
    if(this.connection instanceof Voice.VoiceConnection) {
        return true;
    }

    return false;
}

/**
 * 
 * @param {Voice.CreateAudioPlayerOptions | undefined} options 
 */
Queue.prototype.regenerateAudioPlayer = function regenerateAudioPlayer(options) {
    this.audioPlayer = Voice.createAudioPlayer(options);
    setEvents.apply(this);
    return this;
}

/**
 * Return the incoming item into the queue.
 */
Queue.prototype.next = function nextContent() {
    return this.content.shift();
}

/**
 * Get the content at the given index into the queue,
 * return `boolean` if the index return something.
 * 
 * @param {Number} index
 */
Queue.prototype.getContent = function getContentFromQueue(index) {
    if(this.content[index]) return this.content.splice(index, 1)[0];
    return false;
}

function setEvents() {
    // set the basic handling errors
    this.audioPlayer.on("error", internalError);

    // set an event when the audioPlayer has finished to play
    this.audioPlayer.on("stateChange", (oldState, newState) => {
        if(newState.status === "playing") return this.currentlyPlaying = true;
        this.currentlyPlaying = false;
    });

    return this;
}

const voiceHandler = {};

/**
 * @type {Array<Queue>}
 */
voiceHandler['guilds'] = {};
voiceHandler['maxSize'] = 100;

voiceHandler['get'] = function getQueue(guildId) {
    if(this.guilds[guildId]) return this.guilds[guildId];
    this.guilds[guildId] = new Queue({
        maxSize: this.maxSize
    });
    return this.guilds[guildId];
}

module['exports'] = voiceHandler;
