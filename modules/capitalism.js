"use strict";
const rng = Math.random;
/*
*
* Simply a guide/key to some of the datastructures for capitalism.
*
* user: {
*   userident: <irc hostmask>,
*   cash: <int>,
*   items: {item: <amount>}
* }
*
* item: {
*   name: <string>,
*   desc: <string> // user-visible description
*   func: <function(<host>)> // function when used
*   metadata: {
*       inStock: <bool> // sets if the item can be bought in the store
        ebayStock: <bool> // sets if the item can be bought on Ebay
*   }// Item metadata
*   value: <int>
*   minusrlvl: <unsigned int> // almost all should be '0', for later usage.
* }
*
*/
function randInt(min, max) {return Math.floor(rng() * (max - min + 1)) + min;}
// Begin user block
delete require.cache[require.resolve('../state/capitalismstate.json')]
var users = require('../state/capitalismstate.json');
function bankruptcheck(user,bot,chan) {
    var tcash = user.cash;
    Object.keys(user.items).forEach(item=>{
        tcash += user.items[item] * items[item].value;
    });
    if (tcash <= 0) {
        user.cash = 1000;
        user.items = {};
        bot.sendMsg(chan,"You went bankrupt, restarted");
    }
    if(user.cash <= 0) {
        bot.sendMsg(chan,"Sell items to recover money.");
    }
}
function user(host) {
    let u = {};
    u.host = host;
    u.cash = 1000;
    u.items = {};
    return u;
}
function checkProfile(host) {
    if (!users[host]) {
        // make the profile, maybe external function?
        users[host] = user(host);
    }
    return users[host];
}
// End user block and begin item block

function item(name,desc,func,metadata,value,ulvl) {
    this.name = name;
    this.desc = desc;
    this.func = func;
    this.metadata = metadata || {inStock: true, ebayStock: true}; // Yay!
    this.value = value;
    this.ulvl = ulvl;
}
function removeItem(user,item,count) {
    if(isNaN(count) || count == Infinity || count == -Infinity) return new Error("count cant be Infinity or NaN");
    if (item in user.items) {
        user.items[item] -= count;
        if (user.items[item] <= 0) {
            delete(user.items[item]);
        }
        return false;
    } else {
        return true;
    }
}
function addItem(user,item,count) {
    count = count || 1;
    if(isNaN(count) || count == Infinity || count == -Infinity) return new Error("count cant be Infinity or NaN");
    if (item in user.items) {
        user.items[item] += count;
        return false;
    } else {
        user.items[item] = count;
        return true;
    }
}
function hasItem(user,item,count) {
    if (count == undefined || count == 1) {
        return item in user.items;
    } else if (item in user.items) {
        return user.items[item] >= count;
    } else {
        return false;
    }
}
var genericuse = function(args,chan,user,bot) {
    return "That item cannot be used!";
};
var items = {
    thing: new item('thing','A thing',genericuse,true,1,0),
    lemonade: new item('lemonade','A lemonade stand!',function(args,chan,user,bot) {
        user.cash += 5;
        return "You sell some lemonade for $5 ($"+user.cash+" now)";
    },undefined,25,0),
    debugger: new item('debugger','An alien comes to change the economy.',function(args,chan,user,bot) {
        if(bot.config.uperms[user.host]>=10){
            if(args[1]=="setCash"){
                (users[args[2]]||user).cash=Number(args[3]||args[2]);
                return "Cash is now "+(users[args[2]]||user).cash;
            } else if(args[1]=="debug"){
                return require("util").inspect((users[args[2]]||user)).replace(/\n/g,"");
            } else if (args[1]=="setShare"){
                items.share.value = args[2]||100000;
                items.share.value = Number(items.share.value);
                return "Done.";
            } else if (args[1]=="evalIn" && bot.config.uperms[user.host]==11){
                return eval(args.slice(2).join(" "));
            } else if(args[1]=="fixAll"){
                for(var i in users){if(users[i].cash==Infinity){users[i].cash=1000}}
                for(i in users){if(!users[i].cash){users[i].cash=1000}}
                for(i in users){if(isNaN(users[i].cash)){users[i].cash=1000}}
                for(i in users){if(users[i].cash==-Infinity){users[i].cash=1000}}
                for(i in users){if(users[i].cash==null){users[i].cash=1000}}
                for(i in users){if(typeof users[i].cash=="string"){users[i].cash=1000}}
                for(i in users){
                    for(var k in users[i].items){
                        if(!items[k]) {delete(users[i].items[k])}
                    }
                }
            } else return "You can use \"setCash [host] <amount>\" or \"debug [host]\" or \"setShare [value]\"";
        } else {
            user.cash -= 100;
            return "The debugger releases a bug, that bug was poisonus. You pay $100 for medicine";
        }
    },{inStock: true, ebayStock:false},25,0),
    scriptkiddie: new item('scriptkiddie', "1'm a 1337 h@x3r", function(args,chan,user,bot) { 
        switch (randInt(0,2)) {
            case 0:
                user.cash = user.cash-100;
                return "The scriptkiddie stole $100! ($"+user.cash+" now)";
                break;
            case 1:
                Object.keys(users)[randInt(0,Object.keys(users).length-1)].cash-100;
                return "The scriptkiddie stole $100 from a random user!";
                break;
            case 2:
                return "Nothing happened";
                break;
        }
    },{inStock: true, ebayStock: true},100,0),
    factory: new item('factory', 'A factory to produce goods', function(args,chan,user,bot) {
        switch (randInt(0,5)) {
            case 1:
                var rand = randInt(1,100);
                addItem(user,'thing',rand);
                return "Your factory produced "+rand+" things (+"+rand+" things)";
                break;
            case 2:
                var rand = randInt(1,10);
                addItem(user,'soap',rand);
                return "Your factory produced "+rand+" soap (+"+rand+" soap)";
                break;
            case 3:
                removeItem(user,'factory',1);
                return "your factory went bankrupt (-1 factory)";
                break;
            case 4:
                var rand = randInt(1,10);
                addItem(user,'computer',rand);
                return "Your factory produced "+rand+" computers (+"+rand+" computers)";
                break;
            case 5:
                var rand = randInt(1,10);
                addItem(user,'table',rand);
                return "Your factory produced "+rand+" tables (+"+rand+" tables)";
                break;
            default:
                return "Your factory workers are on a break.";
        }
    },{inStock: true, ebayStock: true},1000,0),
    soap: new item('soap','dont drop it!',genericuse,{inStock: true, ebayStock: true},25,0),
    computer: new item('computer', 'Beep boop beep', (args,chan,user,bot) => {
        switch (randInt(0,4)) {
            case 1:
                addItem(user,'cube',1);
                return "You play Minecraft (+1 cube)";
                
                bankruptcheck(user,bot,chan);
                break;
            case 2: 
                removeItem(user,'computer',1);
                bankruptcheck(user,bot,chan);
                return "Your computer broke(-1 computer)";
                break;
            case 3:
                return "Nothing happened...";
                break;
            default:
                var rand = randInt(0,Object.keys(items).length);
                var item = items[Object.keys(items)[rand]];
                if (!item) {
                    return "You got scammed on ebay";
                }
                var value = 0;
                var f = () => {
                    value = randInt(item.value/2,item.value*2);
                    if (items[Object.keys(items)[rand]].metadata.ebayStock == false) {
                        f();  
                    }
                }; // For repeated reruns
                f();
                addItem(user,Object.keys(items)[rand],1);
                user.cash -= value;
                bankruptcheck(user,bot,chan);
                return "You bought a "+Object.keys(items)[rand]+" for $"+value+" on eBay";
                break;
        }
    },{inStock: true, ebayStock: true},100,0),
    table: new item('table', 'Good to eat on. 4 legs and a square of wood', (args,chan,user,bot) => {
        switch (randInt(0,2)) {
            case 0: 
                return "You flip your table. (╯°□°)╯︵ ┻━┻";
                break;
            case 1:
                return "You look at your table.";
                break;
            case 2:
                removeItem(user,'table',1);
                return "You flip your table, but it breaks. (-1 table)";
                break;
        }
    },{inStock: true, ebayStock: true},100,0),
    meme: new item('meme', 'Make money using memes!', (args,chan,user,bot) => {
        switch (randInt(0,3)) {
            case 0:
                removeItem(user,'meme',1)
                user.cash = user.cash+10000;
                return "your meme succeeds, and you get a lot more money ($"+user.cash+" now, -1 meme)";
                break;
            case 1:
                removeItem(user,'meme',1)
                user.cash = user.cash-1000;
                return "A group of hackers turn your meme against you, and a mob of people steal from company headquarters ($"+user.cash+" now, -1 meme)";
            default:
                removeItem(user,'meme',1)
                return "Your meme sputters and dies, -1 meme";
        }
    },{inStock: true, ebayStock: true},1000,0),
    cube: new item('cube', 'A minecraft cube', (args,chan,user,bot) => {
        if (hasItem(user,'cube',64)) {
            addItem(user,'cubestack',1);
            removeItem(user,'cube',64);
            return "Your cubes turn into a cubestack (-64 cubes, +1 cubestack)";
        } else {
            return "Nothing happened";
        }
    },{inStock: true, ebayStock: true},1000,0),
    cubestack: new item('cubestack', 'A stack of minecraft cubes', (args,chan,user,bot) => {
        switch (randInt(0,9)) {
            case 0:
                removeItem(user,'cubestack',1);
                addItem(user,'house',1);
                return "Your cubestack assembles itself into a cheap house (-1 cubestack, +1 house)"
            default:
                return "Nothing happens";
        }
    },{inStock: false, ebayStock: true},128000,0),
    house: new item('house', 'A house',genericuse,{inStock: true, ebayStock: false},2560000,0),
    loan: new item('loan', 'You are in red numbers if you have this. GET RID OF IT ASAP!',genericuse,{inStock: true, ebayStock:false},-1000,0),
    share: new item('share', 'You invest on a company.',(args,chan,user,bot) => {
        var ovalue = items.share.value;
        var value = Math.ceil(ovalue + randInt(-ovalue/4, ovalue/4));
        items.share.value = value;
        return "The value of the share is now "+ value;
    },{inStock: true, ebayStock: false},100000,0),
    undefined: new item('undefined', 'undefined',(args,chan,user,bot) => {
        user.items['undefined'] += user.items['undefined'];
        return "ͲhΞ g׀ǐČħ ϸ®ʘǵrҿssEs"; //The glitch progresses, it even displaces your cursor on this line!
        
    },{inStock: false, ebayStock:false},-1e+10,0)
};

// End item block and begin core block
function saveState() {
    require("util").inspect(JSON.stringify(users,null,4));
    require("fs").writeFile(__dirname+'/../state/capitalismstate.json',JSON.stringify(users,null,4),err => {
        console.log('[INFO] Saved capitalism state to disk');
        if (err) {console.log(err);}
    });
}

module.exports = function(bot) { // addCmds in here
    if(bot.capitalist_interval) clearInterval(bot.capitalist_interval);
    bot.addCmd('use','capitalism',function(args,chan,host) {
        var cuser = checkProfile(host[2]);
        if (items[args[0]]) {
            if (hasItem(cuser, args[0])) {
                bot.sendMsg(chan,host[0]+": "+items[args[0]].func(args,chan,cuser,bot));
                bankruptcheck(cuser,bot,chan); // Just in case...
            } else {
                bot.sendMsg(chan,"You don't have that item!");
            }
        } else {
            bot.sendMsg(chan,"That item does not exist");
        }
    },"Use an item you have");
    bot.addCmd('store','capitalism',(args,chan,host) => {
        var user = checkProfile(host[2]);
        if (!args[0]) {
            bot.sendMsg(chan,"Usage: store <buy|sell|list|info>");
        } else {
            args[2] = Number(args[2]) || 1;
            if (args[2] < 0) {
                args[2] = (-1)*args[2];
            }
            switch(args[0].toLowerCase()) {
                case 'buy':
                    if (!args[1]) {
                        bot.sendMsg(chan,"Usage: store buy <item> [<count>]");
                        return false;
                    }
                    if (items[args[1]]) {
                        if (items[args[1]].value*args[2] <= user.cash) {
                            args[2] = args[2] || 1;
                            if(args[2] < 0) {
                                bot.sendMsg(chan, "Ammount cant be negative!");
                                return;
                            }
                            if (args[1]=="undefined") {
                                bot.sendMsg(chan, "That item does not exist!");
                                return;
                            }
                            if(args[1]=="loan"){
                                if(hasItem(user,"loan",1)) {
                                    bot.sendMsg(chan, "You already have a loan!");
                                    return;
                                }
                                if(args[2]>1){
                                    bot.sendMsg(chan, "You can only buy one loan!");
                                    return;              
                                }
                            }
                            if (items[args[1]].metadata.inStock == false) {
                                bot.sendMsg(chan, "You cant buy that item!");
                            }
                            if(isNaN(args[2]) || args[2] == Infinity) return;
                            addItem(user,args[1],args[2]);
                            user.cash -= items[args[1]].value*args[2];
                            bot.sendMsg(chan,'Bought '+args[2]+' '+args[1]+' for '+items[args[1]].value*args[2]);
                        } else {
                            bot.sendMsg(chan,"You can't afford that!");
                        }
                    } else {
                        bot.sendMsg(chan,"That item does not exist!");
                    }
                    break;
                case 'sell':
                    if (!args[1]) {
                        bot.sendMsg(chan,"Usage: store sell <item> [<count>]");
                    }
                    if (hasItem(user,args[1],args[2])) {
                            if(args[2] < 0) {
                                bot.sendMsg(chan, "Amount cannot be negative!");
                                return;
                            }
                            if(isNaN(args[2]) || args[2] == Infinity) return;
                        removeItem(user,args[1],args[2]);
                        user.cash += items[args[1]].value*args[2];
                        bot.sendMsg(chan,'Sold '+args[2]+' '+args[1]+' for '+items[args[1]].value*args[2]);
                    } else {
                        bot.sendMsg(chan,"You don't have that item!");
                    }
                    break;
                case 'list':
                    var tosend = '';
                    Object.keys(items).forEach(item=>{
                        (items[item].metadata.inStock ==false)?tosend:tosend += item+"($"+items[item].value+") "; //Weeee!
                    });
                    bot.sendMsg(chan,host[0]+": "+tosend);
                    break;
                case 'info':
                    if (!args[1]) {
                        bot.sendMsg(chan,"Usage: store info <item>");
                    }
                    bot.sendMsg(chan,host[0]+': '+items[args[1]].desc);
                    break;
            }
        }
    },"Buy and sell items in the store. Usage: store <buy|sell|info|list>");
    bot.addCmd('cash','capitalism',function(args,chan,host) {
        var cuser = checkProfile(host[2]);
        bot.sendMsg(chan,host[0]+': $'+cuser.cash);
    },"Shows your cash");
    bot.addCmd('inv','capitalism',function(args,chan,host) {
        var cuser = checkProfile(host[2]);
        var tosend = '';
        Object.keys(cuser.items).forEach(item=>{
            tosend += item+'('+cuser.items[item]+') ';
        });
        if (tosend) {
            bot.sendMsg(chan,host[0]+': You have '+tosend);
        } else {
            bot.sendMsg(chan,host[0]+': You have no items');
        }
    },"Shows the contents of your inventory");
    bot.addCmd('savecstate','capitalism', function(args,chan,host){
        saveState();
        bot.sendMsg(chan,'Done');
    },"(level 10) Save the state of the capitalism module to the disk",10);
    bot.addCmd('buy','capitalism',function(args,chan,host,uperms) {
        bot.cmds.store.run(['buy'].concat(args),chan,host,uperms);
    },"Alias for store buy");
    bot.addCmd('sell','capitalism',function(args,chan,host,uperms) {
        bot.cmds.store.run(['sell'].concat(args),chan,host,uperms);
    },"Alias for store sell");
    bot.addCmd('give','capitalism',function(args,chan,host) {
        if(!args[1] || !args[2]) {
            bot.sendMsg(chan,'Usage: give <host> <cash>');
        }
        var cuser = checkProfile(host[2]);
        var tuser = checkProfile(args[1]);
        var cash = args[2];
        if(cuser.cash <=cash) {
            bot.sendMsg(chan,'You dont have enought money! You are $'+(cuser.cash-cash)+" away.");
        }
        cuser.cash -= cash;
        tuser.cash += cash;
        bot.sendMsg(chan,'Done, now you have $'+cuser.cash);
    },"Gives cash to someone else.");
    bot.capitalist_interval = setInterval(_ => {
        saveState();
    },300000); // Every 5 minutes, save the game status, adjust as needed.
return {items: items, users: users};
}
