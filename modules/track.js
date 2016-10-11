"use strict";
const fs = require("fs");
const util = require("util");
var db = {};
try{
    db = require(__dirname+'/../state/trackdb.json');
} catch(e) {
    console.log("[TRACK] Could not load Tracking DB. Making a new one.");
}
module.exports = function(bot) {
    //bot.track_comments = require(__dirname+'/../state/trackdb.json').comments;
    if(bot.track_interval) clearInterval(bot.track_interval);
    var tmp_whois = undefined;
    function filterOnlyUnique(host) {
        for(var i in db[host].historical) {
            db[host].historical[i]=db[host].historical[i].filter((value,index,self)=>{
                return self.indexOf(value) === index;
            });
        }
    }
    function fixdb() {
        for(var i in db){
            db[i].historical.realnames=db[i].historical.realnames.map(x=>x.replace(RegExp("\r","g"),""));
            if(db[i].realname!=null) db[i].realname.replace('\r','');
        }
        for(var h in db){filterOnlyUnique(h)}
    }
    function returnSkeleton(){
        return {
            ident:null,
            host:null,
            nick:null,
            realname:null,
            historical: {
                hosts: [],
                nicks: [],
                realnames: [],
                idents: [],
                accounts: [],
                chans: []
            }
        };
    }
    function doTrackWhois(nick,ident,host,name){
        if(!db[host]) db[host]=returnSkeleton();
        db[host].ident=ident;
        db[host].host=host;
        db[host].nick=nick;
        db[host].realname=name;
        db[host].historical.hosts.push(host);
        db[host].historical.nicks.push(nick);
        db[host].historical.realnames.push(name);
        db[host].historical.idents.push(ident);
        filterOnlyUnique(host);
        tmp_whois = host;
    }
    function doTrackPrivmsg(nick,ident,host,chan){
        if(!db[host]) db[host]=returnSkeleton();
        db[host].ident=ident;
        db[host].host=host;
        db[host].nick=nick;
        db[host].historical.hosts.push(host);
        db[host].historical.nicks.push(nick);
        db[host].historical.idents.push(ident);
        if(chan.indexOf("#")==-1) db[host].historical.chans.push(chan);
        filterOnlyUnique(host);
    }
    function doTrackAcc(acc,nick){
        var host = tmp_whois;
        if(!host) return;
        if(!db[host]) db[host]=returnSkeleton();
        db[host].nick=nick;
        db[host].historical.accounts.push(acc);
        filterOnlyUnique(host);
    }
    function doTrackWho(nick,ident,host,acc,realname,chan){
        if(!db[host]) db[host]=returnSkeleton();
        db[host].ident=ident;
        db[host].host=host;
        db[host].nick=nick;
        db[host].realname=realname;
        db[host].historical.hosts.push(host);
        db[host].historical.nicks.push(nick);
        db[host].historical.idents.push(ident);
        if(chan != "*") db[host].historical.chans.push(chan);
        db[host].historical.realnames.push(realname);
        if(acc != "0") db[host].historical.accounts.push(acc);
        filterOnlyUnique(host);
    }
    function doTrackNick(nick,ident,host,toNick) {
        if(!db[host]) db[host]=returnSkeleton();
        db[host].ident=ident;
        db[host].host=host;
        db[host].nick=toNick;
        db[host].historical.hosts.push(host);
        db[host].historical.nicks.push(nick,toNick);
        filterOnlyUnique(host);
    }
    bot.servmsg.on('311',function(head,msg,from) {
        if(from.indexOf(".freenode.net")==-1) return;
        doTrackWhois(head[2].toLowerCase(),head[3],head[4],msg.join(' '));
    }).on('330',function(head,msg,from) {
        if(from.indexOf(".freenode.net")==-1) return;
        doTrackAcc(head[3],head[2]);
    }).on('318',_=>{
        tmp_whois = undefined;
    }).on('354',function(head,msg,from) {
        if(from.indexOf(".freenode.net")==-1) return;
        if(head[2]!="241") return;
        doTrackWho(head[6],head[4],head[5],head[7],msg.join(' '),head[3]);
    }).on('PRIVMSG',function(head,msg,from) {
        var host = from.split(/!|@/);
        doTrackPrivmsg(host[0],host[1],host[2],head[1]);
    }).on('JOIN',function(head,msg,from) {
        var host = from.split(/!|@/);
        if (head[2]) {
            if (head[2] == '*') head[2] == '0';
            doTrackWho(host[0],host[1],host[2],head[2],msg.join(' '),head[1]);
        } else {
            doTrackPrivmsg(host[0],host[1],host[2],head[1]);
        }
    }).on('PART',function(head,msg,from) {
        var host = from.split(/!|@/);
        doTrackPrivmsg(host[0],host[1],host[2],head[1]);
    }).on('NICK',function(head,msg,from) {
        var host = from.split(/!|@/);
        doTrackNick(host[0],host[1],host[2],msg[0]);
    });
    function saveState() {
        require("util").inspect(JSON.stringify(db,null,4));
        require("fs").writeFile(__dirname+'/../state/trackdb.json',JSON.stringify(db),err => {
            if (err) {console.log(err);} else console.log('[INFO] [TRACK] Successfully saved db');
        });
    }
    bot.addCmd('trackstats','track',function(args,chan,host) {
        if (args[0]) {
            var h = args[0];
            if (Object.keys(db).indexOf(h)!=-1) {
                bot.sendMsg(chan,`Found host ${h} | Nicks: ${db[h].historical.nicks.join(', ')} | Idents: ${db[h].historical.idents.join(', ')} | Accounts: ${db[h].historical.accounts.join(', ')} | Realnames: ${db[h].historical.realnames.join(', ')}`);
            } else {
                bot.sendMsg(chan, `Could not find ${h} in the database`);
            }
        } else {
            var tnicks=0;
            var hasacc = 0;
            for(var i in db){
                tnicks+=db[i].historical.nicks.length;
                if(db[i].historical.accounts.length>0) hasacc++;
            }
            bot.sendMsg(chan, `I have currently seen ${Object.keys(db).length} hosts, representing an aproximate of ${Math.round((Object.keys(db).length/86334)*100)}% of freenode users. I have seen ${tnicks} nicks. From those users, ${hasacc} of them were ever logged in into services.`);
        }
    },"Prints the statistics of the tracking DB. Can also show statistics for a user. Usage: track [<host>] See also: nick2host");
    bot.addCmd('track','track',function(args,chan,host) {
        if (!args[0]) {
            bot.sendMsg('Usage: track <nick1|chan1> [<nick2|chan2>]...')
            return false;
        }
        args.forEach(target=>{
            bot.send("WHO "+target+" %tcuhnar,241"); 
        });
        bot.sendMsg(chan,'Done');
    },"(level 10) Updates the database about the user",10);
    bot.addCmd('savetrackdb','track',function(args,chan,host) {
        saveState();
        bot.sendMsg(chan,'Saving...');
    },"(level 10) Saves tracking database",10);
    bot.addCmd('nick2host','track',function(args,chan,host) {
        var hosts=[];
        var h = args[0].toString().toLowerCase();
        for(var i in db){
            for(var x in db[i].historical.nicks) {
                if(db[i].historical.nicks[x].toLowerCase()==h) hosts.push(i);
                if(args[1]=="p") { 
                    if((db[i].historical.nicks[x].toString().toLowerCase().indexOf(h))>-1) hosts.push(i);
                }
            }
        }
        hosts = hosts.filter((value,index,self)=>{
                return self.indexOf(value) === index;
        });
        bot.sendMsg(chan, `Hosts matching ${args[0]}: ${hosts.join(", ")}`);
    },"Finds nicks matching given host.",10);
    bot.addCmd('timport','track',function(args,chan,host) {
        bot.ircsock.emit('data',fs.readFileSync(__dirname+'/../whoout'));
        fs.unlinkSync(__dirname+'/../whoout');
        fixdb();
        bot.sendMsg(chan,'Done');
    },"(level 10) Imports a previously saved output file",10);
    bot.addCmd('fixtrackdb','track',function(args,chan,host) {
        fixdb();
        bot.sendMsg(chan,'Done');
    },"(level 10) Fixes pesky carriage return bug",10);
    bot.track_interval = setInterval(saveState,15*60*1000);
    return {db: db, saveState: saveState};
};
