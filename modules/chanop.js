module.exports = function(bot) {
    bot.addCmd('kick','chanop',(args,chan,host) => {
        if (!args[0]) {
            bot.sendMsg(chan,"Usage: kick <user> <reason>");
        }
        bot.kick(chan,args[0],args.slice(1).join(' ') || "Goodbye"); // args.shift is slow
    },"Kicks a user with <reason>",9); // 9 is for chanops
    bot.addCmd('ban','chanop',(args,chan,host) => { 
        if (!args[0]) {
            bot.sendMsg(chan,"Usage: ban <hostmask> [<hostmask2>]...");
        }
        var mode = 'b'.repeat(args.length);
        bot.mode(chan,'+'+mode+' '+args.join(' '));
    },"Bans a user with <reason>",9);
    bot.addCmd('unban','chanop',(args,chan,host) => { 
        if (!args[0]) {
            bot.sendMsg(chan,"Usage: unban <hostmask> [<hostmask2>]...");
        }
        var mode = 'b'.repeat(args.length);
        bot.mode(chan,'-'+mode+' '+args.join(' '));
    },"Unbans a user",9);
    bot.addCmd('op','chanop',(args,chan,host) => {
        if (!args[0]) {
            args[0] = host[0];
        }
        var mode = 'o'.repeat(args.length);
        bot.mode(chan,'+'+mode+' '+args.join(' '));
    },"Ops a user, with no arguments, ops yourself. Usage: op [<user>] [<user2>]...",9);
    bot.addCmd('deop','chanop',(args,chan,host) => {
        if (!args[0]) {
            args[0] = host[0];
        }
        var mode = 'o'.repeat(args.length);
        bot.mode(chan,'-'+mode+' '+args.join(' '));
    },"Deops a user, with no arguments, deops yourself. Usage: deop [<user>] [<user2>]...",9);
    bot.addCmd('stab','chanop',(args,chan,host) => {
        if (args[0]) {
            args[0].split(',').forEach(nick=>{
                bot.whois(nick,(err,ident,whost) => {
                    if (err) {
                        bot.sendMsg(chan,'No such nick');
                    } else {
                        t = parseInt(args[1]);
                        if (t>0) {
                            setTimeout(_=>{
                                bot.mode(chan,'-q *!*@'+whost);
                            },t*1000);
                        }
                        bot.mode(chan,'+q *!*@'+whost);
                    }
                });
            });
        } else {
            bot.sendMsg('Usage: stab <nick>[,<nick2>...]');
        }
    },"Quiets a user",9);
    bot.addCmd('unstab','chanop',(args,chan,host) => {
        if (args[0]) {
            args[0].split(',').forEach(nick=>{
                bot.whois(nick,(err,ident,whost) => {
                    if (err) {
                        bot.sendMsg(chan,'No such nick');
                    } else {
                        bot.mode(chan,'-q *!*@'+whost);
                    }
                });
            });
        } else {
            bot.sendMsg('Usage: unstab <nick>[,<nick2>...]');
        }
    },"Unquiets a user",9);
    bot.addCmd('mode','chanop',(args,chan,host) => {
        bot.mode(chan,args.join(' '));
    },"Changes mode. Usage: mode <mode> <opts>",9)
    bot.addCmd('kban','chanop',(args,chan,host) => {
        if (args[0]) {
            args[0].split(',').forEach(nick=>{
                bot.whois(nick,(err,ident,whost) => {
                    if (err) {
                        bot.sendMsg(chan,'No such nick');
                    } else {
                        var t = parseInt(args[1]);
                        if (t>0) {
                            setTimeout(_=>{
                                bot.mode(chan,'-b *!*@'+whost);
                            },t*1000);
                            var i = 2;
                        } else {
                            var i = 1;
                        }
                        bot.mode(chan,'-o+b '+nick+' *!*@'+whost);
                        bot.kick(chan,nick,args.slice(i).join(' '));
                    }
                });
            });
        } else {
            bot.sendMsg(chan,'Usage: kban <nick>[,<nick2>[,<nick3>...]] [<seconds>] <reason>');
        }
    },"Kickbans a user",9);
    bot.addCmd('voice','chanop',(args,chan,host) => {
        if (!args[0]) {
            args[0] = host[0];
        }
        var mode = 'v'.repeat(args.length);
        bot.mode(chan,'+'+mode+' '+args.join(' '));
    },"voices a user, with no arguments, voices yourself. Usage: voice [<user>] [<user2>]...",9);
    bot.addCmd('devoice','chanop',(args,chan,host) => {
        if (!args[0]) {
            args[0] = host[0];
        }
        var mode = 'v'.repeat(args.length);
        bot.mode(chan,'-'+mode+' '+args.join(' '));
    },"unvoices a user, with no arguments, unvoices yourself. Usage: unvoice [<user>] [<user2>]...",9);
};
