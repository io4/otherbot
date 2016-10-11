"use strict";
const child_process = require("child_process");
const markov = require("markovchain");
const Chance = require("chance");
const util = require('util');
var chance = new Chance();
var factsfile = require("fs").readFileSync(__dirname+'/data/facts.txt', 'utf8');
var factStarts = factsfile.split('\n').map(line=>{return line.split(' ')[0];});
var facts = factsfile.split('\n');
var chain = new markov(factsfile);
function randInt(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}
function randomPick(list) {return list[randInt(0,list.length-1)];}
var nopoke = ['moonythedwarf','jeffl35','iovoid'];
var nullcmdreplies = ['...', 'ohai $nick', 'lol', "That isn't a command...", 'y u highlight', 'Yes?', 'plz no ban', 'n00b',
    'ehlo $nick', 'Kernel panic - not syncing: Attempted to kill init!', '\x01ACTION pokes $nick\x01', '# killall -SIGSEGV init & killall -SIGILL init',
    'Segmentation fault', 'I am not a supybot you derp', 'You are a derp', 'You have been derped', chance.sentence()];
module.exports = function(bot,config) {
    bot.addCmd('poke','fun',function(args,chan,host) {
        if (!args[0]) {args[0] = host[0]+' for not knowing how to use the poke command';}
        if (args[0].toLowerCase() == config.nick.toLowerCase()) {args[0] = host[0]+' for expecting '+config.nick+' to poke itself';}
        if (nopoke.indexOf(args[0].toLowerCase()) != -1) {args[0] = host[0]+' for expecting '+config.nick+' to poke one of its creators';}
        bot.sendMsg(chan,'\x01ACTION pokes '+args[0]+'\x01');
    },'Poke somebody (lol)');
    bot.addCmd('fgen','fun',function(args,chan,host) {
        bot.sendMsg(chan,chain.start(randomPick(factStarts)).end(20 /*it will stop when it runs out*/).process());
    },'Generate a fact. May fail horribly.');
    bot.addCmd('fact','fun',function(args,chan,host) {
        bot.sendMsg(chan,randomPick(facts));
    },'Show a fact!');
    bot.addCmd('asen','fun',function(args,chan,host) {
        bot.sendMsg(chan,chance.sentence());
    }, 'Generate a sentence that looks like it was made by aliens! (its also semipronouncable!)')
    bot.addCmd('wolf','fun',function(args,chan,host) {
        if (args.join(" ") == "") {
            bot.sendMsg(chan,"Please enter a query next time.");
            return;
        }
        var out = "";
        var wolfengine = child_process.spawn(__dirname+"/data/wolfram.py",[args.join(" ")]);
        wolfengine.stdout.on('data', data => {

            out += data.toString().replace(/\n/g, " | ");
        });
        wolfengine.stderr.on('data', data => {
            console.log("[WOLFERR]"+data);
        });
        wolfengine.on('close',()=>{bot.sendMsg(chan,out.slice(0,400));})
        return;
        
    }, "search wolfram alpha."),
    // Begin secrets.....
    bot.addCmd('','fun',function(args,chan,host) {
        /*console.log(args);
        if (args != []) {
            return;
        }*/
        bot.sendMsg(chan,randomPick(nullcmdreplies).replace('$nick',host[0]));
        nullcmdreplies[nullcmdreplies.length-1]=chance.sentence();
    }, 'What did you do...');
    // lel
    //bot.servmsg.on('KICK',(head,msg,from)=>{if(head[2]==config.nick&&from.split('!')[0]!=config.nick){setTimeout(_=>{bot.send('KICK '+head[1]+' '+from.split('!')[0]+' :y u kick');},5000);}});
};
