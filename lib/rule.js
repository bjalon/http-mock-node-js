var parser = require("./parser");


function Rule(ruleJSON) {
	this.name = ruleJSON.description;
	this.pattern = ruleJSON.requestPattern;
	this.sourceFile = ruleJSON.sourceFile;
	this.response = ruleJSON.response;
	this.responseParsed = ruleJSON.responseParsed;
	
	var self = this;
	this.isRequestMatch = function (reqSer) {
		var result = reqSer.match(self.pattern);
		if (result)
			console.log("  Matching rule " + self.name + " with pattern :" + self.pattern + " (" + self.sourceFile + ") - status: " + self.responseParsed.statusCode);
		return result;
	}
	
	this.applyResponse = function(req, res) {
		if (! this.response) {
			console.log("    Empty response returned");
			res.writeHead(200, {"Content-Type": "text/plain"});
			res.write(" ");
			res.end("");
			return;
		}

		var resStatus = self.responseParsed.statusCode;
		var resHeaders = self.responseParsed.headers;
		resHeaders['transfer-encoding'] = ''; // avoid chunked response
		var resBody = parser.normalizeNewlineUnix(self.responseParsed.body);
		
		res.writeHead(resStatus, resHeaders);
		res.end(resBody);

		return res;
	}
	
}

function RuleManager(file) {
	this.rules = [];
	
	var self = this;
	parser.parseConfiguration(file, function(ruleParsed) {
		var rule = new Rule(ruleParsed);
		console.log(" new rule from " + rule.sourceFile 
			+ "|named:" + rule.name 
			+ "|pattern:" + rule.pattern 
			+ "|status:" + rule.responseParsed.statusCode);
		self.rules.push(rule);
	});

	console.log("***** End parsing ****");

	this.getMatchingRule = function (req, content, callback) {
		var reqSer = this.serializeRequest(req, content);
		
		(function ruleSelection(i) {
			if (i >= self.rules.length) {
				callback(null);
				return;
			}
			
			var rule = self.rules[i];
			if (rule.isRequestMatch(reqSer)) {
				callback(rule);
				return;
			}
			
			ruleSelection(i + 1)
		})(0);
	}
	
	this.serializeRequest = function(req, content) {

		var reqHeaders = req.headers;
		var reqURL = req.url;
		
		var requestAsString = " url: ";
		requestAsString += reqURL;
		//console.log("    url: " + truncString(reqURL));
		console.log(" url: " + reqURL);
		
		requestAsString += "\n header:\n";
		var headersSerialized = JSON.stringify(reqHeaders);
		requestAsString += headersSerialized;
		// console.log("    headers: " + truncString(headersSerialized));
		// console.log("    headers: " + headersSerialized);
		
		requestAsString += "\n body:\n";
		requestAsString += content;
		// console.log("    body: " + truncString(reqBody));
		
		// console.log(requestAsString);
		// console.log("** END REQUEST PARSING **");
		return requestAsString;

	}
	
}


exports.create_ruleManager = function(file) {
	return new RuleManager(file);
}



