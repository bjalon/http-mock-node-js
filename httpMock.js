var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
	xml2js = require('xml2js'),
	path = require("path"),
	jsonPath = require("JSONPath"),
	httpParser = require('http-string-parser'),
	PropertiesReader = require('properties-reader');
	
var port =  process.argv[2], 
	address = process.argv[3], 
	file = process.argv[4];
	
init();
checkFileExists(file);
configuration = parseConfiguration(file);

var rules = extractAvailableRules(configuration);
var responses = extractAvailableResponses(configuration);

http.createServer(function(request, response) {

	console.log("******* New Request *******");
    var reqBody = "";
	var reqHeaders = request.headers;
	var reqURL = request.url;

    request.on('data', function (data) {
        reqBody += data;
    });

    request.on('end', function () {
		console.log("** NEW REQUEST PARSING **");
		
		var requestAsString = " url: ";
		requestAsString += reqURL;
		//console.log("    url: " + truncString(reqURL));
		console.log("    url: " + reqURL);
		
		requestAsString += "\n header:\n";
		var headersSerialized = JSON.stringify(reqHeaders);
		requestAsString += headersSerialized;
		// console.log("    headers: " + truncString(headersSerialized));
		// console.log("    headers: " + headersSerialized);
		
		requestAsString += "\n body:\n";
		requestAsString += reqBody;
		// console.log("    body: " + truncString(reqBody));
		
		// console.log(requestAsString);
		// console.log("** END REQUEST PARSING **");
		
		rules.forEach(function(rule, i) {
			var regexpRule = new RegExp(rule);
			var matchingContent = requestAsString.match(regexpRule);
			if (matchingContent) {
				console.log("  Matching rule " + i + ": " + configuration[i].description + " with pattern :" + configuration[i].requestPattern);

				var responseToReturn = responses[i];
				
				if (! responses[i]) {
					console.log("    Empty response returned");
					response.writeHead(200, {"Content-Type": "text/plain"});
					response.write(" ");
					response.end("");
					return;
				}
				
				var resStatus = responseToReturn.statusCode;
				var resHeaders = responseToReturn.headers;
				resHeaders['transfer-encoding'] = ''; // avoid chunked response
				var rsBody = normalizeNewlineUnix(responseToReturn.body);

				console.log("    Response returned " + resStatus);
				// console.log("      status code: " + resStatus);
// 				console.log("      headers: " + JSON.stringify(resHeaders));
// 				console.log("      body:" + rsBody + "EOF");
// 				console.log("**  Response returned (end) **");

				response.writeHead(resStatus, resHeaders);
				response.write(rsBody);
				response.end("");
				console.log("******* End New Request (OK) *******");
				return;
			} 
		});
		
		// response.writeHead(404, {"Content-Type": "text/plain"});
// 		response.end("No rules defined");
// 		console.log("    No rule found: return 404");

    });
}).listen(port, address);

console.log("Static file server running at\n  => http://" + address + ":" +  + port + "/\nCTRL + C to shutdown");


function checkFileExists(file){
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

function parseConfiguration(file) {
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
    			console.log('     Rule name ' + i + '/' + j + ': ' + rule.description);
				configuration = configuration.concat(rule);
			});
			console.log('   ' + rules.length + " rule(s) added.");
		});
	});
	console.log("Total rules size: " + configuration.length);
	return configuration;
}

function extractAvailableResponses(configuration) {
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

function extractAvailableRules(configuration) {
	var rules = [];
	console.log("Rules ordered enabled");
	configuration.forEach(function(confItem, i) {
		var rule = confItem.requestPattern;
		console.log("  Rule " + i + ": " + rule);
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

function init() {
	if (typeof String.prototype.startsWith != 'function') {
	  String.prototype.startsWith = function (str){
	    return this.indexOf(str) === 0;
	  };
	}
}
