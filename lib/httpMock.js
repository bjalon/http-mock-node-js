const http = require("http");
const url = require("url");
const randomService = require("./random");
const logger = require('./logger');


var startServer = function(address, port, ruleManager) {

  http.createServer(function(request, response) {
    var content = "",
    startTime = new Date();
    logger.log('info', "******* New Request (" + startTime.toISOString() + ") - Proc " + process.env.procNumber + " *******");

    request.on('data', function (data) {
      content += data;
    });

    request.on('end', function () {

      ruleManager.getMatchingRule(request, content, function(rule) {
        setTimeout(function() {
          if (! rule) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.end("No rules defined");
            logger.log('info', " No rule found: return 404");
            return;
          }

          rule.applyResponse(request, response);

        }, randomService.randomWaitingTime(startTime, rule));
      });
    })
  }).listen(port, address);
}

exports.start = startServer;
