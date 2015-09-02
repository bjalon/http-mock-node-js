var http = require("http"),
    url = require("url"),
	jsonPath = require("JSONPath"),
	rule = require("./rule")
	parser = require("./parser");
	
	
var address = process.argv[2], 
	port =  process.argv[3],
	file = process.argv[4];
	
var ruleManager = rule.create_ruleManager(file);


http.createServer(function(request, response) {
	var content = "";
	console.log("******* New Request *******");

    request.on('data', function (data) {
        content += data;
    });

    request.on('end', function () {

		ruleManager.getMatchingRule(request, content, function(rule) {
			if (! rule) {
				response.writeHead(404, {"Content-Type": "text/plain"});
		 		response.end("No rules defined");
 				console.log(" No rule found: return 404");
 				
 				return;
			}
			
			rule.applyResponse(request, response);
		});
	})
}).listen(port, address);

console.log("HTTP Mock server running at\n  => http://" + address + ":" +  + port + "/\nCTRL + C to shutdown");



