"use strict";
const fs = require('fs');
module.exports = {  
	"nick": "otherbot",
	"ident": "yaybot",
	"name": "jeffl35's test node.js bot",
	"host": "irc.freenode.net",
	"port": 6697,
	"cmdchar": "-",
	"authtype": "certfp", // can be sasl,certfp,pass, anything else means no auth
	"sasluser": "Jeffbot",
	// "password": require('fs').readFileSync("password").toString("utf-8").replace(/\r|\n/,""), // we are using certfp now
	"cert": require('fs').readFileSync("certs/nick.cer"),
	"certkey": require('fs').readFileSync("certs/nick.key"), // this is actually certkey
	"channels": "##jeffl35,##powder-bots,#botters-test,##otherbot,#jeffl35,#botwar,#esoteric",
	"logchannel": "##otherbot", // a channel which is either -n or which the bot is joined in
	"kickrejoin": true,
	"queuedelay": 700, // Delay between sending privmsgs in ms
	"uperms": {  
		"unaffiliated/jeffl35": 11,
		"valoran/jeffl35": 11,
		"valoran/z": 11,
		"zirc/no-waifu-no-laifu/eclipse": 11,
		"unaffiliated/iovoid": 11,
		"unaffiliated/moonythedwarf": 11,
		"unaffiliated/bowserinator": 11,
		"unaffiliated/cxi": -10 // --- He was found to be a troll. What harm could a - do?
	},
	"chanconfig": {
		"##jeffl35": { // what else can  be channel specific?
			uperms: { // rip nested things
				// nothing here, move along
			}
		},
		"##powder-bots": {
			uperms: {
				"Powder/Developer/jacob1": 10
			}
		}
	},
}

