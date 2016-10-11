// Initializes ircbot
const ircbot = require('./ircbot.js');
const readline = require('readline');
const event = require('events');
const fs = require('fs');
const cluster = require('cluster');
if (cluster.isMaster) {
	console.log('[NOTICE] Starting cluster...');
	cluster.fork();
	cluster.on('exit',_=>{cluster.fork();});
} else if (cluster.isWorker) {
	console.log('[INFO] Started as worker');
	var consoleinterface = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'repl> '
	}).on('line',function(line) {
		try {
			var result = eval(line);
		} catch(e) {
			var result = e;
		}
		console.log(result);
		consoleinterface.prompt();
	}).on('SIGINT',function() {
		process.emit('SIGINT');
		console.log('Closing connection. Use Ctrl-D to exit');
	});
	
	var config = require('./config.js');
	var stuxconfig = Object.assign({},config);
	stuxconfig.host = 'irc.stuxnet.xyz';
	stuxconfig.nick = 'relay';
	stuxconfig.channels = '#j,#'; // FIXME(jeffl35): this is just bad
	var bot = new ircbot(config);
	var stuxrelay = new ircbot(stuxconfig);
	stuxconfig.modules = {};
	config.modules = {};
	function loadModules(xbot,reload,config,noload) {
		console.log('[INFO] Loading modules...');
		if (!noload) {noload = {};}
		if (reload) {
			xbot.privmsg.removeAllListeners();
			xbot.servmsg.removeAllListeners();
			xbot.events.removeAllListeners();
			xbot.setlis();
		}
		xbot.events.on('reload',_=>{loadModules(xbot,true,config,noload);});
		fs.readdirSync('modules').forEach(function(file) {
			if(fs.lstatSync('./modules/'+file).isFile() && file.endsWith('.js') && !(file in noload)) {
				if (reload) {	
					try{
						console.log('[DEBUG] Deleting cache for file '+file);
						delete require.cache[require.resolve('./modules/'+file)];
					}catch(e){}
				}
				config.modules[file] = require('./modules/'+file)(xbot,config);
				console.log('[INFO] Loaded module '+file);
			}
		});
	}
	loadModules(bot,false,config);
	loadModules(stuxrelay,false,stuxconfig,{"track.js":1});
	// FIXME(jeffl35): this is a horrible hack
	bot.privmsg.on('##jeffl35',(args,host)=>{stuxrelay.sendMsg('#j',formatRelay(host[0],args))});
	stuxrelay.privmsg.on('#j',(args,host)=>{bot.sendMsg('##jeffl35',formatRelay(host[0],args))});
	function formatRelay(nick,msg){
		if (msg[0] == '\x01ACTION') {
			msg.splice(0,1);
			return `* ${nick} ${msg.join(' ').replace('\x01','')}`;
		} else {
			return `<${nick}> ${msg.join(' ')}`;
		}
	}
	
	bot.start();
	stuxrelay.start();
}
