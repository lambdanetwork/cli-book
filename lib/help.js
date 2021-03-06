"use strict"
const lounger = require("./lounger.js");
const opener = require("opener");
const spawnSync = require("child_process").spawnSync;
const path = require("path");
const isWindows = require("os").platform() === "win32";

function getGeneralHelpMessage () {  
    const commands = Object.keys(lounger.cli).join(", ");
    const message = `Usage: lounger <command>
    The available commands for lounger are:
    ${commands}
    You can get more help on each command with: 
    lounger help <command>

    Example:
    lounger help isonline

    lounger v${lounger.version} on Node.js ${process.version}`;
    return message;
}

function openDocumentation(command) {
    if (isWindows) {
        const htmlFile = path.resolve(__dirname + "/../website/cli-" + command + ".html");
        return opener("file:///" + htmlFile);
    }
    spawnSync("man", ["lounger-" + command], {stdio: "inherit"});
}

function help(command) {
    return new Promise((resolve, reject) => {
        if (!lounger.cli[command]) {
            console.log(getGeneralHelpMessage());
        } else {
            openDocumentation(command);
        }
        resolve();
    });
}

exports.cli = help;
