var logger = exports;

logger.logLevel = 'info';

logger.log = function(level, message) {
  var levels = ['error', 'warn', 'info'];
  if (levels.indexOf(level) <= levels.indexOf(logger.logLevel) ) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
      // message = JSON.stringify(message);
    };
    console.log(level + "(" + levels.indexOf(level) + "/" + levels.indexOf(logger.logLevel) + ") : " + message);
  }
}
