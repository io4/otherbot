"use strict";
const child_process = require("child_process");
const vm = require('vm');
var corescript = require("fs").readFileSync(__dirname+"/sandboxes/core.js")
var pads = [];
module.exports = function(bot) {
    bot.addCmd('pyc', 'sandbox', function(args, chan, host) {
        var out = "​";
        var errcount = 0;
        var outcount = 0;
        var pypysandbox = child_process.spawn('pypy-sandbox', ['--heapsize=64m', '--timeout=1', '--tmp=' + __dirname, '--', '-S', '-c' + args.join(" ")], {
            cwd: "/"
        });
        var cpulimit = child_process.spawn('cpulimit', ['-p ' + pypysandbox.pid, '-l 10']);
        pypysandbox.stdout.on('data', data => {
            if (outcount == 5) {
                return;
            }
            else {
                outcount++;
            }
            out += data.toString().replace(/(\r|\n|\7)/g, " | ");
        });
        pypysandbox.stderr.on('data', data => {
            if (errcount == 10) {
                return;
            }
            else {
                errcount++;
            }
            out += data.toString().replace(/(\r|\n|\7)/g, " | ");
        });
        pypysandbox.on('close', _ => {
            console.log("[INFO] Pypysandbox closed");
            bot.sendMsg(chan, out.substr(0, 500 - 28).replace(/(\r\n|\r|\n|\7)/g, " | "));
        });
        setTimeout(_ => {
            pypysandbox.kill();
        }, 5000);
    }, "Python sandbox using pypy-c-sandbox");
    bot.addCmd('pad', 'sandbox', function(args, chan, host) {
        console.log("[INFO] Pad " + host[2] + " written");
        var padindex = -1;
        pads.forEach((element, index) => {
            if (element.name == host[2]) {
                padindex = index;
            }
        })
        if (padindex == -1) {
            pads.push({
                name: host[2],
                lines: []
            });
            pads[pads.length - 1].lines.push(args.join(" "));
        }
        else {
            pads[padindex].lines.push(args.join(" "));
        }
    }, "write to codepad");
    bot.addCmd('pyr', 'sandbox', function(args, chan, host) {
        var padindex = -1
        pads.forEach((element, index) => {
            if (element.name == host[2]) {
                padindex = index;
            }
        });

        if (padindex == -1) {
            bot.sendMsg(chan, "You dont have a valid codepad!");
        }
        else {
            var out = "​";
            var closed = false;

            var outcount = 0;
            var pypysandbox = child_process.spawn('pypy-sandbox', ['--heapsize=64m', '--timeout=1', '--tmp=' + __dirname, '--', '-S', '-c' + pads[padindex].lines.join('\n')], {
                cwd: "/"
            });
            var cpulimit = child_process.spawn('cpulimit', ['-p ' + pypysandbox.pid, '-l 10']);
            cpulimit.stderr.on('data', (data) => {
                console.log('[WARN] Error in cpulimit: ' + data.toString);
            })
            cpulimit.stdout.on('data', (data) => {
                console.log('[INFO] cpulimit output: ' + data.toString);
            })
            var errcount = 0;
            pypysandbox.stdout.on('data', (data) => {
                if (outcount == 5) {
                    return;
                }
                else {
                    outcount++;
                }
                out += data.toString().replace(/(\r|\n|\7)/g, " | ");
            });
            pypysandbox.stderr.on('data', (data) => {
                if (errcount == 10) {
                    return;
                }
                else {
                    errcount++;
                }
                out += data.toString().replace(/(\r|\n|\7)/g, " | ");
            });
            pypysandbox.on('close', () => {
                console.log("[INFO] Pypysandbox closed");
                closed = true;
                bot.sendMsg(chan, out.substr(0, 500 - 28 /*im lazy*/ ).replace(/(\r\n|\r|\n)/g, " | "));
            });
            setTimeout(() => {
                pypysandbox.kill()
            }, 5000);

        }
    }, "Run code pad with pypy-c-sandbox")
    bot.addCmd('giac', 'sandbox', (args, chan, host) => {
        var out = [];
        var errcount = 0;
        var outcount = 0;
        var giac = child_process.spawn('giac', [args.join(" ")], {
            cwd: "/"
        });
        var cpulimit = child_process.spawn('cpulimit', ['-p ' + giac.pid, '-l 10']);
        giac.stdout.on('data', data => {
            if (outcount == 30) {
                return;
            }
            else {
                outcount++;
            }
            out.push(data.toString().replace(/(\r|\n|\7)/g, " "));
        });
        giac.stderr.on('data', data => {
            if (errcount == 10) {
                return;
            }
            else {
                errcount++;
            }
            out.push(data.toString().replace(/(\r|\n|\7)/g, " "));
        });
        giac.on('close', _ => {
            console.log("[INFO] Pypysandbox closed");
            out.splice(0, 4);
            out = out.join("\n");
            bot.sendMsg(chan, out.substr(0, 500 - 28).replace(/(\r\n|\r|\n)/g, " "));
        });
        setTimeout(_ => {
            giac.kill();
        }, 5000);
    })
    bot.addCmd('befr', 'sandbox', (args, chan, host) => {
        var out = [];
        var errcount = 0;
        var outcount = 0;
        var padindex = -1
        pads.forEach((element, index) => {
            if (element.name == host[2]) {
                padindex = index;
            }
        });

        if (padindex == -1) {
            bot.sendMsg(chan, "You dont have a valid codepad!");
            return;
        }
        require("fs").writeFile(__dirname + '/bepadcode'+host[0], pads[padindex].lines.join("\n"), (err) => {
            if (err) {
                bot.sendMsg(chan,"Error initalising pad");
                return;
            }
            var pyfunge = child_process.spawn('pyfunge', ['-C', '-F','-v98', __dirname + '/bepadcode'+host[0]], {
                cwd: "/"
            });
            var cpulimit = child_process.spawn('cpulimit', ['-p ' + pyfunge.pid, '-l 10']);
            pyfunge.stdout.on('data', data => {
                if (outcount == 30) {
                    return;
                }
                else {
                    outcount++;
                }
                out.push(data.toString().replace(/(\r|\n|\7)/g, " "));
            });
            pyfunge.stderr.on('data', data => {
                if (errcount == 10) {
                    return;
                }
                else {
                    errcount++;
                }
                out.push(data.toString().replace(/(\r|\n|\7)/g, " "));
            });
            pyfunge.on('close', _ => {
                console.log("[INFO] Pypysandbox closed");
                out = out.join("\n")
                bot.sendMsg(chan, out.substr(0, 500 - 28).replace(/(\r\n|\r|\n)/g, " "));
            });
            setTimeout(_ => {
                pyfunge.kill();
                require('fs').unlink(__dirname + '/bepadcode'+host[0]);
            }, 5000);
        });
    },"Run befunge");
    bot.addCmd('padclr','sandbox',(args,chan,host) => {
        var padindex = -1;
            pads.forEach((element, index) => {
                if (element.name == host[2]) {
                    padindex = index;
                }
            });
            if (padindex == -1) {
                pads.push({
                    name: host[2],
                    lines: []
                });
            }
            else {
                pads[padindex].lines = [];
            }
    },"clears your codepad");
    bot.addCmd('lolr', 'sandbox', (args, chan, host) => {
        var out = [];
        var errcount = 0;
        var outcount = 0;
        var padindex = -1
        pads.forEach((element, index) => {
            if (element.name == host[2]) {
                padindex = index;
            }
        });

        if (padindex == -1) {
            bot.sendMsg(chan, "You dont have a valid codepad!");
            return;
        }
        require("fs").writeFile(__dirname + '/lcipadcode' + host[0], pads[padindex].lines.join("\n"), (err) => {
            if (err) {
                bot.sendMsg(chan,"Error initalising pad");
                return;
            }
            var lci = child_process.spawn(__dirname+'/interps/lci', [__dirname + '/lcipadcode'+host[0]], {
                cwd: "/"
            });
            var cpulimit = child_process.spawn('cpulimit', ['-p ' + lci.pid, '-l 10']);
            lci.stdout.on('data', data => {
                if (outcount == 30) {
                    return;
                }
                else {
                    outcount++;
                }
                out.push(data.toString().replace(/(\r|\n|\7)/g, " "));
            });
            lci.stderr.on('data', data => {
                if (errcount == 10) {
                    return;
                }
                else {
                    errcount++;
                }
                out.push(data.toString().replace(/(\r|\n|\7)/g, " "));
            });
            lci.on('close', _ => {
                console.log("[INFO] lci closed");
                out = out.join("\n")
                bot.sendMsg(chan, out.substr(0, 500 - 28).replace(/(\r\n|\r|\n)/g, " "));
            });
            setTimeout(_ => {
                lci.kill();
                require('fs').unlink(__dirname + '/lcipadcode' + host[0]);
            }, 5000);
        });
        delete pads[padindex];
    },"Run the LOLCODE interpreter");
    bot.addCmd('><>r', 'sandbox', (args, chan, host) => {
        var out = [];
        var errcount = 0;
        var outcount = 0;
        var padindex = -1
        pads.forEach((element, index) => {
            if (element.name == host[2]) {
                padindex = index;
            }
        });

        if (padindex == -1) {
            bot.sendMsg(chan, "You dont have a valid codepad!");
            return;
        }
        require("fs").writeFile(__dirname + '/fishpadcode' + host[0], pads[padindex].lines.join("\n"), (err) => {
            if (err) {
                bot.sendMsg(chan,"Error initalising pad");
                return;
            }
            var fish = child_process.spawn(__dirname+'/interps/fish.py', [__dirname + '/fishpadcode'+host[0]], {
                cwd: "/"
            });
            var cpulimit = child_process.spawn('cpulimit', ['-p ' + fish.pid, '-l 10']);
            fish.stdout.on('data', data => {
                if (outcount == 30) {
                    return;
                }
                else {
                    outcount++;
                }
                out.push(data.toString().replace(/(\r|\n|\7)/g, ""));
            });
            fish.stderr.on('data', data => {
                if (errcount == 10) {
                    return;
                }
                else {
                    errcount++;
                }
                out.push(data.toString().replace(/(\r|\n|\7)/g, ""));
            });
            fish.on('close', _ => {
                console.log("[INFO] fish closed");
                out = out.join("\n")
                bot.sendMsg(chan, out.substr(0, 500 - 28).replace(/(\r\n|\r|\n)/g, ""));
            });
            setTimeout(_ => {
                fish.kill();
                require('fs').unlink(__dirname + '/fishpadcode' + host[0]);
            }, 5000);
        });
        delete pads[padindex];
    },"Run the ><> interpreter");
    bot.addCmd('js','sandbox',(args,chan,host) => {
        var context = vm.createContext(Object.create(null));
        var out;
        var performExtra= true;

        try {
            out = new vm.Script(corescript+";(()=>{"+args.join(" ")+" })().toString()").runInContext(context, {timeout:2000,filename:"sandbox"});
        } catch(e) {
            context = e.toString();
            console.log("Error!");
            performExtra=false;
        }
        if (typeof out != 'string') {
            bot.sendMsg(chan,"Output not a string! Canceling return output");
            return;
        }
        if (performExtra) {
            context.global = "[Circular]";
        }
        if (context.obuf != "" && context.obuf) {
            bot.sendMsg(chan,context.obuf.replace(/(\r\n|\r|\n)/g, " | ").substr(0,500));
        }
        if (typeof out != 'undefined') {
            bot.sendMsg(chan,out.replace(/(\r\n|\r|\n)/g, " | ").substr(0,500))
        }
        bot.sendMsg(chan,require("util").inspect(context).replace(/(\r\n|\r|\n)/g, " | ").substr(0,400));
    },"I doubt Iovoid can break this, it uses what zzo38 demonstrated. JS sandbox");
    bot.addCmd('rsc','sandbox',(args,chan,host) => {
        corescript = require("fs").readFileSync(__dirname+"/sandboxes/core.js");
        bot.sendMsg(chan,"Reloaded sandbox corescript");
        return;
    },"Reloades the sandbox core script",11);
    bot.addCmd('ul', 'sandbox', function(args, chan, host) {
        var out = "​";
        var errcount = 0;
        var outcount = 0;
        var underload = child_process.spawn(__dirname+'/interps/underload.bin', [args.join(" ")], {
            cwd: "/"
        });
        var cpulimit = child_process.spawn('cpulimit', ['-p ' + underload.pid, '-l 10']);
        underload.stdout.on('data', data => {
            if (outcount == 5) {
                return;
            }
            else {
                outcount++;
            }
            out += data.toString().replace(/(\r|\n|\7)/g, " | ");
        });
        underload.stderr.on('data', data => {
            if (errcount == 10) {
                return;
            }
            else {
                errcount++;
            }
            out += data.toString().replace(/(\r|\n|\7)/g, " | ");
        });
        underload.on('close', _ => {
            console.log("[INFO] underload closed");
            bot.sendMsg(chan, out.substr(0, 500 - 28).replace(/(\r\n|\r|\n)/g, " | "));
        });
        setTimeout(_ => {
            underload.kill();
        }, 5000);
    }, "Run programs written in Underload");
    return {
        pads: pads
    };
   
}
