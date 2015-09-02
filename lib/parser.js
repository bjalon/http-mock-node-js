var httpParser = require('http-string-parser'),
    fs = require("fs"),
    path = require("path"),
    xml2js = require('xml2js'),
    path = require("path"),
    PropertiesReader = require('properties-reader');


if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.indexOf(str) === 0;
	};
}

exports.parseConfiguration = function(file, callback) {
	isExists(file);

	var properties = PropertiesReader(file);
	var filesToParse = properties.get('mockFileNames');
	var j = 0;
	
	filesToParse.split(",").forEach(function(fileToParse) {

	    var absolutePath = path.resolve(fileToParse.trim());
	    console.log("Parse files: " + absolutePath);
		var data = fs.readFileSync(absolutePath);
		var xmlParser = new xml2js.Parser();

	    xmlParser.parseString(data, function (err, result) {
			var rules = result.index.mock;
			
			rules.forEach(function(rule, i){
			    j++;
			    rule["sourceFile"] = fileToParse;
			    rule["responseParsed"] = extractResponseFromRule(rule);

				callback(rule);
			});
		});
	});
	console.log("Total rules size: " + j);
}


function truncString(stringToTrunc) {
	var size = Math.min(20, stringToTrunc.length);
	var result = stringToTrunc.substring(0, size);
  
	if (size > 19) {
		result += "...";
	}
	return result;
}

function normalizeNewlineWindows(str) {
	var result = str.replace(/([^\r])\n/g, '$1\r\n');
	return result;
}

exports.normalizeNewlineUnix = function(str) {
	var result = str.replace(/\r\n/g, '\n');
	return result;
}


extractResponseFromRule = function(rule) {
	var responseAsString = normalizeNewlineWindows(rule.response.toString());
	
	if (responseAsString && responseAsString.trim()) {
		return httpParser.parseResponse(responseAsString);
	} else {
		return [];
	}
}

isExists = function(file){
	try {
		stats = fs.lstatSync(file);
		if (!stats.isFile()) {
			console.log("ERR1 : " +  file + " is not a file");
			console.log("Waiting a configuration file as parameter");
			console.log("node tcpMock.js [ADDRESS] [PORT] [fileConfig]");
			process.exit(1);
		}
	}
	catch (e) {
        console.log("ERR2 : " +  file + " is not a file");
		console.log("Waiting a configuration file as parameter");
        console.log("node tcpMock.js [ADDRESS] [PORT] [fileConfig]");
        process.exit(1);
	}
	console.log("configuration file found : " + file + "\n");

}
