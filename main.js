// check the package version
const package = require("./package.json");
const { internalConsole } = require("./requirements/utils.m");

// execute the command to get the verison
require("node:child_process").exec(
    `npm show ${package.name} version`,
    function (error, stdout, stderr) {
        if(error) null;

        // if the current version is not the same
        // as the one published mean that there is an update
        if(stdout.trim() !== package.version.trim()) {
            internalConsole(
                require("colors").yellow("A new version of that package is avaible !")
            );
        }
    }
);

// export the handler
const handler = require("./src/handler.m");
module["exports"] = { handler, "command": handler.command };
