var http = require("http"),
    url = require("url"),
	  jsonPath = require("JSONPath"),
  	rule = require("./rule"),
    random = require("./random"),
	  parser = require("./parser");


if (process.argv.length < 5) {
  console.log("Waiting 5 args");
  console.log("  arg1 : Adress listened");
  console.log("  arg2 : Port listened");
  console.log("  arg3 : Configuration file");
  console.log("  arg5 : Medium waiting time (default 0ms)");
  console.log("  arg6 : Mean value for random value (default 0.0)");
  console.log("  arg7 : Standard deviation value for random value (default 1.0)");
  exit(1);
}
var address = process.argv[2],
	  port =  process.argv[3],
	  file = process.argv[4];
    mediumWaitingTime = 0,
    meanValue = 0.0,
    deviationValue = 1.0;

if (process.argv.length > 5) {
    mediumWaitingTime = Number(process.argv[5]);
}
if (process.argv.length > 6) {
    meanValue = Number(process.argv[6]);
}
if (process.argv.length > 7) {
    deviationValue = Number(process.argv[7]);
}

console.log("  Args numbers : " + process.argv.length);
console.log("  Adress listened : " + address);
console.log("  Port : " + port);
console.log("  Configuration file : " + file);
console.log("  Medium Waiting Time : " + mediumWaitingTime);
console.log("  Mean Value for Waiting Time (Gaussian curve): " + meanValue);
console.log("  Deviation value for Waiting Time : " + deviationValue);



var ruleManager = rule.create_ruleManager(file);

var randomWaitingTime = function() {
  var result = mediumWaitingTime + random.get(meanValue, deviationValue);
  console.log("Random waiting time " + result + "ms");
  return result;

}

http.createServer(function(request, response) {
	var content = "";
	console.log("******* New Request *******");

    request.on('data', function (data) {
        content += data;
    });

    request.on('end', function () {

		ruleManager.getMatchingRule(request, content, function(rule) {
      setTimeout(function() {
        if (! rule) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.end("No rules defined");
            console.log(" No rule found: return 404");
            return;
          }

          rule.applyResponse(request, response);

        }, randomWaitingTime());
		});
	})
}).listen(port, address);

console.log("HTTP Mock server running at\n  => http://" + address + ":" +  + port + "/\nCTRL + C to shutdown");



