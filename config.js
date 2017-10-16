"use strict";
const fs = require('fs');
module.exports = {  
	"nick": "nick",
	"ident": "ident",
	"name": "realname,
	"host": "irc.freenode.net",
	"port": 6697,
	"cmdchar": "-", // command char
	"authtype": "certfp", // can be sasl,certfp,pass, anything else means no auth
	"sasluser": "Jeffbot",
	"password": "letmein",
	"cert": require('fs').readFileSync("certs/nick.cer"), // certificate
	"certkey": require('fs').readFileSync("certs/nick.key"), // certificate privkey
	"channels": "#chan1,#chan2",
	"logchannel": "##logs", // a channel which is either -n or which the bot is joined in
	"kickrejoin": true,
	"queuedelay": 700, // Delay between sending privmsgs in ms
	"uperms": {  
		"bot.owner.com": 11, // A admin user
		"trusted.user.com: 1, // A user which can run some elevated commands 
		"user.evil.com": -1 // A ignored user
	},
	"chanconfig": {
		"#channel": { // channel-specifc config for #channel
			uperms: {
				"example.com"
			}
		}
	},
}

