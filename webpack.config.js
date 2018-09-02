const path = require("path");

module.exports = {
    entry: ["core-js/fn/promise", "./dist/js/scripts"],
    output: {
        path: path.resolve(__dirname, "dist/js"),
        filename: "scripts.js"
    }
};