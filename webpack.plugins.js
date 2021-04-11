const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = [
	new ForkTsCheckerWebpackPlugin(),
	new CopyWebpackPlugin({
		patterns: [{ from: path.resolve(__dirname, "src", "static"), to: path.resolve(__dirname, ".webpack", "renderer") }],
	}),
];
