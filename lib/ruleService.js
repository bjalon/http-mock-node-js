const parser = require("./parser");
const logger = require('./logger');

function Rule(ruleJSON) {
	this.name = ruleJSON.description;
	this.pattern = ruleJSON.requestPattern;
	this.sourceFile = ruleJSON.sourceFile;
	this.response = ruleJSON.response;
	this.responseParsed = ruleJSON.responseParsed;

	this.responseTimeInMilli = ruleJSON.responseTimeInMilli ? Number(ruleJSON.responseTimeInMilli) : undefined;
	this.deviationValue      = ruleJSON.deviationValue ? Number(ruleJSON.deviationValue) : undefined;

	var self = this;
	this.isRequestMatch = function (reqSer) {
		var result = reqSer.match(self.pattern);
		if (result) {
			logger.log('info', "  Matching rule " + self.name
				+ " with pattern :" + self.pattern
				+ " (" + self.sourceFile + ") - status: "
				+ self.responseParsed.statusCode);
			logger.log('info', "   " + JSON.stringify(self.responseParsed.headers));
		}
		return result;
	}

	this.applyResponse = function(req, res) {
		if (! this.response) {
			logger.log('info', "    Empty response returned");
			res.writeHead(200, {"Content-Type": "text/plain"});
			res.write(" ");
			res.end("");
			return;
		}

		var resStatus = self.responseParsed.statusCode;
		var resHeaders = self.responseParsed.headers;
		resHeaders['transfer-encoding'] = ''; // avoid chunked response
		var resBody = self.responseParsed.body;

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
		logger.log('info', " new rule from " + rule.sourceFile
			+ "|named:" + rule.name
			+ "|pattern:" + rule.pattern
			+ "|status:" + rule.responseParsed.statusCode);
		self.rules.push(rule);
	});

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
		var headersSerialized = JSON.stringify(reqHeaders);

		var requestAsString = " url: ";
		requestAsString += reqURL;
		requestAsString += "\n header:\n";
		requestAsString += headersSerialized;
		requestAsString += "\n body:\n";
		requestAsString += content;

		logger.log('info', " url: " + reqURL);

		return requestAsString;

	}

}


exports.create_ruleManager = function(file) {
	return new RuleManager(file);
}
