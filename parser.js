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

exports.exists = function(file){
	try {
		stats = fs.lstatSync(file);
		if (!stats.isFile()) {
			console.log("ERR1 : " +  file + "not a file");
			console.log("Waiting a configuration file as parameter");
			console.log("node tcpMock.js [ADDRESS] [PORT] [fileConfig]");
			process.exit(1);
		}
	}
	catch (e) {
        console.log("ERR2 : " +  file + "not a file");
		console.log("Waiting a configuration file as parameter");
        console.log("node tcpMock.js [ADDRESS] [PORT] [fileConfig]");
        process.exit(1);
	}
	console.log("File found : " + file);

}

exports.parseConfiguration = function(file) {
	var properties = PropertiesReader(file);
	var filesToParse = properties.get('mockFileNames');
	var configuration = [];
	var j = 0;
	
	
	filesToParse.split(",").forEach(function(fileToParse) {
	    var absolutePath = path.resolve(fileToParse);
	    console.log("Parse files: " + absolutePath);
		var data = fs.readFileSync(absolutePath);
		var xmlParser = new xml2js.Parser();
	    xmlParser.parseString(data, function (err, result) {
			var rules = result.index.mock;
			
			rules.forEach(function(rule, i){
			    j++;
			    rule["sourceFile"] = fileToParse;
    			console.log('     Rule name ' + (i + 1) + '/' + j + ': ' + rule.description );

				configuration = configuration.concat(rule);
			});
			console.log('   ' + rules.length + " rule(s) added.");
		});
	});
	console.log("Total rules size: " + configuration.length);
	return configuration;
}

exports.extractAvailableResponses = function(configuration) {
	var responses = [];
	configuration.forEach(function(confItem, i) {
		var responseAsString = normalizeNewlineWindows(confItem.response.toString());
		
		if (responseAsString && responseAsString.trim()) {
			var httpResponse = httpParser.parseResponse(responseAsString);
			console.log("    response status code detected (" + i + ") : " + httpResponse.statusCode);
			responses.push(httpResponse);
		} else {
			console.log("    empty response detected (" + i + ")");
			responses.push(null);
		}
	});
	return responses
}

exports.extractAvailableRules = function(configuration) {
	var rules = [];
	console.log("Rules ordered enabled");
	configuration.forEach(function(confItem, i) {
		var rule = confItem.requestPattern;
		console.log("  Rule " + (i + 1) + ": " + rule + " (" + confItem.sourceFile + ")");
		rules.push(rule);
	});
	return rules
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

function normalizeNewlineUnix(str) {
	var result = str.replace(/\r\n/g, '\n');
	return result;
}

