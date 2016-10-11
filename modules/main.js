const config = require('../config');
const math = require("mathjs");
const wolframApiKey = "QG5HT6-2VK58V6RYJ";
// License is Personal/Non-commercial, use it wisely!
// DO NOT BUNDLE WITH GITHUB VERSION.
math.config({
	number: "BigNumber"
})
var parser = math.parser();
config.processes = [];
module.exports = function(bot) {
	bot.addCmd('join','main',function(args,chan,host) {
		if(args[0] != undefined) {
			bot.send("JOIN "+args[0]);
		} else {
			bot.sendMsg(chan,"Not enough arguments. See help");
		}
	},"(level 10) Tells the bot to join a channel, for multiple channels, separate with ','",10);
	bot.addCmd('part','main',function(args,chan,host) {
		if (!args[0]) {args[0] = chan;}
		bot.send("PART "+args[0]+' :'+args.slice(1).join(' '));
	},"(level 10) Tells the bot to leave a channel, if no arguments given, part the current channel",10);
	bot.addCmd('reload','main',function(args,chan,host) {
		bot.events.emit('reload');
		bot.sendMsg(chan,'Reloaded modules');
	},'(level 10) Reloads modules of the bot',10);
	bot.addCmd('whois','main',function(args,chan,host) {
		if (!args[0]) {
			bot.sendMsg(chan,'Usage: whois <nick>');
			return;
		}
		bot.whois(args[0],function(err,ident,whoishost,realname) {
			console.log(err);
			if (err) {
				bot.sendMsg(chan,host[0]+': No such nick');
				return;
			}
			bot.sendMsg(chan,host[0]+': Ident: '+ident+' | Host: '+whoishost+' | Realname: '+realname);
		});
	},'Do a WHOIS on a nick. Usage: whois <nick>');
	bot.addCmd('nick','main',function(args,chan,host) {
		if (!args[0]) {
			bot.sendMsg('Usage: nick <newnick>');
			return false;
		}
		bot.send('NICK '+args[0]);
	},"(level 10) Change the bot's nick. Usage: nick <newnick>",10);
	/*bot.addCmd('calc','main',(args,chan,host) => {
		try {
			var m = math.format(parser.eval(args.join(" "))).toString().replace(/[\n\r\7]/g, "").substring(0, 500)
			bot.sendMsg(chan,m);
		} catch (err) {
			bot.sendMsg(chan,err.toString());
		}
	},"Uses math.js to solve a equation.",0)*/
	bot.addCmd('exec','main',function(args,chan,host) {
		if (!args[0]) {
			bot.sendMsg('Usage: exec <command>');
			return;
		}
		var cprocess = require('child_process').exec(args.join(' '),{shell: '/bin/bash'});
		config.processes.push(cprocess);
		var outpart = '';
		function send(data){if(!data.endsWith('\n')){outpart+=data;}else{data=outpart+=data;outpart='';bot.sendMsg(chan,data.replace(/(\n|\r)+$/, ''));}}
		cprocess.stdout.on('data',send);
		cprocess.stderr.on('data',send);
		cprocess.on('exit',(code,signal)=>{if(outpart != ''){bot.sendMsg(chan,outpart);outpart='';}bot.sendMsg(chan,'Process exited with '+(signal || code));});
		cprocess.on('error',(code,signal)=>{bot.sendMsg(chan,'Error while running process');});
		cprocess.on('close',_=>{config.processes.splice(config.processes.indexOf(cprocess),1)});
	},"Executes a command",11);
	bot.addCmd('killprocess','main',function(args,chan,host) {
		var oldest = config.processes.pop();
		if (oldest) {oldest.kill();}
		bot.sendMsg(chan,'Done');
	},"Kills the earliest process started",11);
}
