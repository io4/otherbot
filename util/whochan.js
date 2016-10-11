'use strict';
const ircbot = require('../ircbot');
const fs = require('fs');

if (process.argv.slice(2).join(',')=='') {
	console.warn('Not enough arguments. Use node whochan.js <chan1> [<chan2>] ...');
	console.warn('Note: you may need to include quotes (").')
	process.exit(1);
}
function randInt(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min;}
var config = {  
	"nick": "Guest"+randInt(10000,99999), // lol
	"ident": "IceChat9", // kilolol
	"name": "The Chat Cool People Use", // megalol
	"host": "irc.freenode.net",
	"port": 6697,
	"cmdchar": " ", // gigalol, such a cmdchar will cause the bot to ignore all commands
	"authtype": "none",
    "channels": process.argv.slice(2).join(','), // accept channels from stdin
	"logchannel": "##otherbot", // probably fine
	"kickrejoin": false, // teralol, icechat9 doesn't rejoin (go ask moonythedwarf)
	"queuedelay": 1000, // Oh very funny guys. i can just change a configuration switch to make it autorejoin, i just dont want it to do that all the time.
	"uperms": {}, 
	"chanconfig": {},
};
var chancount = 0;
var responsecount = 0;
var bot = new ircbot(config);
bot.servmsg.on('354',(head,msg,from,raw)=>{
	//console.log(raw);
    fs.appendFileSync(__dirname+'/../whoout',raw+'\n');
}).on('315',()=>{
    responsecount++;
    if (responsecount == chancount) process.exit();
}).on('JOIN',(head,msg,from)=>{
	if (from.split('!')[0] == config.nick) {
		chancount++;
		bot.send('WHO '+head[1]+' %tcuhnar,241');
	}
});
bot.start();
