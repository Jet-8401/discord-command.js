'use strict';

const Discord = require("discord.js");
const Voice = require("@discordjs/voice");
const { internalError } = require("../requirements/utils.m");

function Queu({maxSize}) {
    this.content = [];
    this.maxSize = maxSize;
    this.currentlyPlaying = false;
    this.lastSong = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    this.loop = false;

    this.connection = false;
    this.audioPlayer = Voice.createAudioPlayer();

    // set the basic handling errors
    this.audioPlayer.on("error", internalError);

    // set an event when the audioPlayer has finished to play
    this.audioPlayer.on("stateChange", (oldState, newState) => {
        if(newState.status === "playing") return this.currentlyPlaying = true;
        this.currentlyPlaying = false;
    });
}

/**
 * Add something to the queu.
 * 
 * `force` param is to enabled if you want to 'break' the
 * maximum size of the queu, that means that if the length of the 
 * curernt queu is too long to add something eles the first element
 * on the queu gonna be deleted and the item gonna be pushed into the end.
 * By default the maximum size is set to 100 and can be change into `voiceHandler['maxSize']`
 * 
 * @param {*} item item to add to the queu
 * @param {boolean} force
 * @returns {boolean}
 */
Queu.prototype.add = function addContent(item, force) {
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
 * Make the bot play a song into a voice channel.
 * 
 * @param {Voice.AudioResource} song
 * @param {?Discord.VoiceChannel} voiceChannel
 */
Queu.prototype.play = function playSong(song, voiceChannel) {
    this.currentlyPlaying = true;
    this.lastSong = song;

    // create a voice connection if any has been created
    if(!(this.connection instanceof Voice.VoiceConnection)) {
        if(voiceChannel) this.createVoiceConnection(voiceChannel);
        return internalError("Impossible to create a voice connection!");
    }

    // attach the audioPlayer
    this.connection.subscribe(this.audioPlayer);

    // play the audio
    this.audioPlayer.play(song);
}

/**
 * Create a voice connection to a voice channel.
 * 
 * @param {Discord.VoiceChannel} voiceChannel 
 * @returns {Queu}
 */
Queu.prototype.createVoiceConnection = function createVoiceConnection(voiceChannel) {
    this.connection = Voice.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    return this;
}

/**
 * Return this incoming item into the queu.
 */
Queu.prototype.next = function nextContent() {
    return this.content.shift();
}

const voiceHandler = {};

/**
 * @type {Array<Queu>}
 */
voiceHandler['guilds'] = {};
voiceHandler['maxSize'] = 100;

voiceHandler['get'] = function getQueu(guildId) {
    if(this.guilds[guildId]) return this.guilds[guildId];
    this.guilds[guildId] = new Queu({
        maxSize: this.maxSize
    });
    return this.guilds[guildId];
}

module['exports'] = voiceHandler;
