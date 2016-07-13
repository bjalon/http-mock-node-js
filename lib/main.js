const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const random = require("./random");
const ruleService = require("./ruleService");
const serverService = require("./httpMock");
const logger = require('./logger');
const meow = require('meow');

const cli = meow('\n\
	Usage\n\
	  $ node lib/main.js LISTENED_ADD LISTENED_PORT RULES_LIST_FILE [options]\n\
\n\
	Options\n\
    -h, --help   Displays this help page\n\
    -l, -logLevel=[warn, debug, info]   Use the given level (default level is info)\n\
    -wt, -waitingTime  Waiting time (use the normal distribution) - default 0.0\n\
    -sd, -standardDeviation  Standard deviation for the waiting time (default : 0.0)\n\
\n\
	Examples\n\
	  $ node lib/main.js 0.0.0.0 12345 /my/rules/list.properties\n\
	  Starts the server listening on all ip available and port 12345 using the list.properties file listing rules for mockFileNames\n\
    $ node lib/main.js 0.0.0.0 12345 /my/rules/list.properties -wt=10000 -sd=1000\n\
    Idem but if rule doe not set waiting time, will wait between 9s and 11s for 90% of requests (use the normal distribution)\n\
\n\
  More info available here : https://github.com/bjalon/http-mock-node-js\n\
', {
	alias: {
		help: 'h',
    logLevel: 'l',
    waitingTime: 'wt',
    standardDeviation: 'sd'
	}, flags: {
    logLevel: 'info',
    waitingTime: 0.0,
    standardDeviation: 0.0
  }, string : 'logLevel'
});

// console.log(JSON.stringify(cli));
if (cluster.isMaster && cli.input.length < 3) {
  console.log(cli.help);
  process.exit(1);
}

const address = cli.input[0];
const port =  cli.input[1];
const file = cli.input[2];
const meanValue = Number(cli.flags.waitingTime);
const deviationValue = Number(cli.flags.standardDeviation);


if (cluster.isMaster) {
  logger.log('info', "************* INIT INFO *************");
  logger.log('info', "  Starting on " + numCPUs + " CPU(s) at " + new Date().toISOString());
  logger.log('info', "  Args numbers : " + cli.input.length);
  logger.log('info', "  Adress listened : " + address);
  logger.log('info', "  Log level : " + logger.logLevel);
  logger.log('info', "  Port : " + port);
  logger.log('info', "  Configuration file : " + file);
  logger.log('info', "  Mean Value for Waiting Time (Gaussian curve) i.e. medium value: " + meanValue);
  logger.log('info', "  Standard Deviation value for Waiting Time : " + deviationValue);
  logger.log('info', "************* END INIT INFO *************");

  logger.log('info', "************* CONFIG PARSING *************");
  var ruleManager = ruleService.create_ruleManager(file);
  logger.log('info', "************* END CONFIG PARSING *************");

  // Fork workers.
  for (var i = 1; i < numCPUs + 1; i++) {
    cluster.fork({procNumber: i});
    logger.log('info', "Node " + i + " started");
  }

  cluster.on('exit', function(worker, code, signal) {
    logger.log('info', 'worker ${worker.process.pid} died');
  });

  logger.log('info', "Master Node work finished");
  logger.log('info', "HTTP Mock server waiting on each node at\n  => http://" + address + ":" +  + port + "/\nCTRL + C to shutdown");

} else {
  logger.logLevel = cli.flags.logLevel;
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  var ruleManager = ruleService.create_ruleManager(file);
  serverService.start(address, port, ruleManager);
}
