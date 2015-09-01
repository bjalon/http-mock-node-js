var http = require("http"),
    url = require("url"),
	jsonPath = require("JSONPath"),
	parser = require("./parser");
	
	
var address = process.argv[2], 
	port =  process.argv[3],
	file = process.argv[4];
	
parser.exists(file);
configuration = parser.parseConfiguration(file);

var rules = parser.extractAvailableRules(configuration);
var responses = parser.extractAvailableResponses(configuration);

http.createServer(function(request, response) {

	console.log("******* New Request *******");
    var reqBody = "";
	var reqHeaders = request.headers;
	var reqURL = request.url;
	
	var responseDone = false;

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
				responseDone = true;
				var description = configuration[i].description,
				pattern = configuration[i].requestPattern,
				filename = configuration[i].sourceFile;

				console.log("  Matching rule " + i + ": " + description + " with pattern :" + pattern + " (" + filename + ")");

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
				var rsBody = parser.normalizeNewlineUnix(responseToReturn.body);

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
		
		if (!responseDone) {
			response.writeHead(404, {"Content-Type": "text/plain"});
	 		response.end("No rules defined");
 			console.log("    No rule found: return 404");
 		}

    });
}).listen(port, address);

console.log("Static file server running at\n  => http://" + address + ":" +  + port + "/\nCTRL + C to shutdown");



