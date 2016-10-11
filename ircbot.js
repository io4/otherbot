"use strict";
// typeof null == 'object'
const event = require('events');
const net = require('net');
const readline = require('readline');
const tls = require('tls');
const fs = require('fs');
const util = require('util');

function ircbot(config) {
	this.version = "0.0.1-alpha6";
	function newEvent() {return new event.EventEmitter().setMaxListeners(0);}
	this.events = newEvent();	// main events
	this.servmsg = newEvent();	// server message
	this.privmsg = newEvent();	// message to channel/user, not currently useful yet
	this.whoisEvent = newEvent();
	
	var bot = this; // workaround

	this.server = {datapart: '', capabilities: [], capreq: [],}
	this.client = {capabilities: ['multi-prefix','extended-join']}
	this.config = config;
	if (config.authtype == 'sasl') {
		this.client.capabilities.push('sasl');
	}
	this.channels = {};
	// for debugging
	// function bool(object) {if(object){return true}else{return false}}

	this.command = function(group,code,help,canExec) {
		if (!group || !code) {throw new Error("Missing group/code while adding command!");}
		this.group = group;
		if (typeof code == "string") {
			this.string = code;
			this.code = function(args,chan) {bot.sendMsg(chan,this.string);}
		} else {
			this.code = code;
		}
		this.help = help || "Help is not available for that command.";
		canExec = canExec || 0;
		if (typeof canExec == "number") {
			this.lvl = canExec;
			this.canExec = function canExec(uperms) {
				return uperms >= this.lvl;
			}
		}
		this.run = function(args,chan,host,uperms) {
			if (this.canExec(uperms,host,chan,args)) {
				this.code(args,chan,host,uperms);
				return true;
			} else {
				return false;
			}
		}
	}
	this.addCmd = function(name,group,code,help,canExec) {
		this.cmds[name] = new this.command(group,code,help,canExec);
		if (!this.cmdgroups[group]) {
			this.cmdgroups[group] = [];
		}
		if (this.cmdgroups[group].indexOf(name) == -1) {
			this.cmdgroups[group].push(name);
		}
	}
	
	this.cmds = {};
	this.cmdgroups = {};
	this.addCmd('echo','general',function(args,chan) {bot.sendMsg(chan,args.join(' '));},"Echoes something");
	this.addCmd('ping','general',"pong","Requests a pong from the bot");
	this.addCmd('pong','general',"Did you mean ping? Anyways ping","<AegisServer2> It's ping you moron.");
	this.addCmd('eval','general',function(args,chan,host,perms) {
		try {
			var result = eval(args.join(' '));
			util.inspect(result).split('\n').forEach(function(line) {bot.sendMsg(chan,line);});
		} catch(e) {
			bot.sendMsg(chan,e.stack.split('\n')[0]);
		}
	},"(level 11) Runs javascript code in the bot",11);
	this.addCmd('flushq','general',function(args,chan) {
		bot.sendMsgQueue.length = 0;
		bot.sendMsg(chan, "Send queue flushed");
	},"Flushes the send queue");
	this.addCmd('help','general',function(args,chan,host) {
		if (args[0] != undefined) {
			if (bot.cmds[args[0]]) {
				bot.sendMsg(chan,host[0]+': '+bot.cmds[args[0]].help);
			} else {
				bot.sendMsg(chan,"That command does not exist!");
			}
		} else {
			bot.sendMsg(chan,"Use 'help <command>'");
		}
	});
	this.addCmd('list','general',function(args,chan,host) {
		if (args[0]) {
			if (bot.cmdgroups[args[0]]) {
				bot.sendMsg(chan,host[0]+": "+bot.cmdgroups[args[0]].join(' '));
			} else {
				bot.sendMsg(chan,host[0]+": No such group, use list");
			}
		} else {
			bot.sendMsg(chan,host[0]+": Command groups (use list <group>): "+Object.keys(bot.cmdgroups).join(' '));
		}
	});
	this.preparsers = [];
	this.addPreparser = function(func) {
		this.preparsers.push(func);
	}
	this.ctcp = {
		'ping': function(args,nick,host) {bot.sendNotice(nick,'PING '+args.join(' '),true);},
		'version': function(args,nick,host) {bot.sendNotice(nick,'VERSION node-ircbot.js '+bot.version);}
	}

	// for compatibility, because jeffl35 is stupid, REPLACE WITH LOGGER
	function print(data) {console.log(data);}

	// make this better
	this.send = function(data) {
		this.sendMsgQueue.push(data);
		this.events.emit('msg');
	}
	this.sendMsgQueue = [];
	this.sendMsg = function(chan,msg,trunc) {
		msg = msg.toString();
		msg.split('\n').forEach(line => {
			if (line == '') {var line = ' ';}
			var maxlen = 449 - chan.length;
			if (line.length > maxlen) {
				for (var i = 0; i < line; i = i + maxlen) {
					this.send('PRIVMSG '+chan+' :'+line.slice(i,i+maxlen));
				}
			} else {
				this.send('PRIVMSG '+chan+' :'+line);
			}
		});
		this.events.emit('msg');
	}
	this.mode = function(chan,mode) {
		bot.send('MODE '+chan+' '+mode);
	}
	this.kick = function(chan,nick,reason) {
		bot.send('KICK '+chan+' '+nick+' :'+reason);
	}
	this.sendNotice = function(chan,msg,ctcp) {
		if (ctcp) {
			this.send('NOTICE '+chan+' :\x01'+msg+'\x01');
		} else {
			this.send('NOTICE '+chan+' :'+msg);
		}
	}
	this.sender = function(msg) {
		msg = bot.sendMsgQueue.shift();
		if (msg) {
			console.log('[SEND] '+msg);
			bot.ircsock.write(msg+'\r\n');
			bot.sendMessenger = setTimeout(bot.sender,config.queuedelay);
		} else {
			bot.events.once('msg', bot.sender);
		}
	}
	this.whois = function(nick,cb) {
		this.send('WHOIS '+nick);
		this.whoisEvent.once(nick.toLowerCase(),cb);
	}
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	this.ircsock = new tls.TLSSocket(this.ircsock);
	if (config.authtype == 'certfp') {
		this.ircsock=tls.connect({host: config.host, port: config.port, cert: config.cert, key: config.certkey});
	}
	this.ircsock.on('connect', function() {
		console.log('Connected to server!');
		// need to write this into a function plus logger
		bot.send("CAP LS");
		if (config.authtype == 'pass') {
			bot.send('PASS '+password);
		}
		bot.send("NICK "+config.nick);
		bot.send("USER "+config.ident+" * 0 :"+config.name);
	}).on('data', function(data) {
		var data = data.toString('utf-8');
		if (!data.endsWith('\n')) {
			bot.server.datapart = bot.server.datapart + data;
			return false;
		} else {
			data = (bot.server.datapart + data).replace(/(\r|\n)+$/,'');
			bot.server.datapart = '';
		}
		bot.events.emit('data',data);
	}).on('close', function() {
		print('Connection closed.');
		bot.events.emit('connclosed');
	});

	this._start = function() {
		if(config.authtype != 'certfp') {this.ircsock.connect({host: config.host, port: config.port});}
	}
	this.start = function start() {
		this._start();
		this.setlis();
		return this;
	}
	this.setlis = function setlis() {
		this.events.once('msg', bot.sender);
		this.events.on('data', function(raw) {
			var lines = raw.replace('\r','').split('\n');
			lines.forEach(function(line) {
				print('[RECV] '+line);
				var dsplit = line.split(' :');
				var head = dsplit[0];
				dsplit.splice(0,1);
				var msg = dsplit.join(' :');
				head = head.split(' ');
				msg = msg.split(' ');
				if (line.startsWith(':')) {
					var from = head[0].replace(/^:/,'');
					head.splice(0,1);
					bot.servmsg.emit(head[0],head,msg,from,line);
				} else {
					var from = false;
					bot.servmsg.emit(head[0],head,msg,from,line);
				}
			});
		});
	
		this.servmsg.on('PING', function(head,msg,from) {
			bot.send('PONG :'+msg.join(' '));
		}).on('433', function(head,msg,from) {
			bot.send("NICK "+config.nick+"_");
			config.nick += '_';
		}).on('CAP', function(head,msg,from) {
			if (head[2] == "LS") {
				bot.server.capabilities = msg;
				for (var c in msg) {
					if (bot.client.capabilities.indexOf(msg[c]) != -1) {
						bot.server.capreq.push(msg[c]);
					}
				}
				if (bot.server.capreq.join(' ') == '') {
					bot.send("CAP END");
				} else {
					bot.send("CAP REQ :"+bot.server.capreq.join(' '));
				}
			} else if (head[2] == "ACK") {
				if (bot.server.capreq.indexOf('sasl') != -1 && bot.config.sasluser) {
					bot.send("AUTHENTICATE PLAIN");
				} else {
					bot.send("CAP END");
					bot.events.emit('capend',bot.server.capreq);
				}
			}
		}).on('AUTHENTICATE', function(head,msg,from) {
			bot.send("AUTHENTICATE "+new Buffer(bot.config.sasluser+'\0'+bot.config.sasluser+'\0'+bot.config.password).toString('base64'));
		}).on('903', function(head,msg,from) {
			bot.send("CAP END");
			bot.events.emit('capend',bot.server.capreq);
		}).on('904', function(head,msg,from) {
			print('[FATAL] SASL authentication failed!');
			throw new Error("SASL authentication failed!");
		}).on('001', function(capreq) {
			bot.events.emit('regdone');
			if (bot.config.channels != undefined) {
				bot.send('JOIN '+config.channels);
			}
		}).on('PRIVMSG', function(head,msg,from) {
			var host = from.split(/!|@/);
			var chan = head[1];
			if (chan == config.nick) {chan = host[0];}
			bot.events.emit('privmsg',msg,chan,host);
			bot.privmsg.emit(chan,msg,host);
			if (msg[0].startsWith(config.cmdchar)) {
				var cmd = msg[0].replace(new RegExp('^\\'+config.cmdchar+'{1}'),'').toLowerCase();
				var args = msg.slice(1);
				var uperms = bot.config.uperms[host[2]] || 0;
				if (bot.config.chanconfig[chan]) {
					uperms = bot.config.chanconfig[chan].uperms[host[2]] || uperms;
				}
				if (bot.cmds[cmd]) {
					try {
						bot.preparsers.forEach(parse => {args = parse(args,chan,host,uperms);});
						if (!bot.cmds[cmd].run(args,chan,host,uperms)) {
							bot.sendMsg(chan,"You do not have permission to use this command.");
						}
					} catch(e) {
						bot.sendMsg(chan,"An error occured while processing your command: "+e);
						bot.sendMsg(config.logchannel,e.stack);
						bot.sendMsg(config.logchannel,'Caused by '+host[0]+'!'+host[1]+'@'+host[2]+' using command '+cmd+' with arguments '+args.toString()+' in channel '+chan);
					}
				}/* else {
					sendMsg(chan,"No such command");
				}*/
			} else if (msg[0].startsWith('\x01') && msg[msg.length-1].endsWith('\x01')) {
				msg[0] = msg[0].replace(/^\x01{1}/,'');
				msg[msg.length-1] = msg[msg.length-1].replace(/\x01{1}$/,'');
				var args = msg.slice(1);
				if (bot.ctcp[msg[0].toLowerCase()]) {
					bot.ctcp[msg[0].toLowerCase()](args,chan,host);
				}
			}
		}).on('311',function(head,msg,from) {
			bot.whoisEvent.emit(head[2].toLowerCase(),null,head[3],head[4],msg.join(' '));
		}).on('401',function(head,msg,from) {
			bot.whoisEvent.emit(head[2],new Error('No such nick'));
		}).on('KICK',function(head,msg,from) {
			if (head[2] == 'otherbot') {
				bot.sendMsg(config.logchannel,'Kicked from '+head[1]+' by '+from+' with reason '+msg.join(' '));
			}
			if (config.kickrejoin) {
				bot.send('JOIN '+head[1]);
			}
		}).on('NICK',function(head,msg,from) {
			if (from.split('!')[0] == config.nick) {
				config.nick = msg[0];
				bot.sendMsg(config.logchannel,"Nick was changed to "+msg[0]);
			}
		});
	};
	process.on('uncaughtException',function(err){try{
		console.log(err.stack);
		bot.errored = true;
		bot.events.emit("error",err);
	}catch(e){}}).once("SIGINT", function() {
		console.log("Caught SIGINT, shutting down");
		bot.send("QUIT :Caught SIGINT");
	});
}

module.exports = ircbot;
