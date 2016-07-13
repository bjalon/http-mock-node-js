const httpParser = require('http-string-parser');
const fs = require("fs");
const path = require("path");
const xml2js = require('xml2js');
const PropertiesReader = require('properties-reader');
const logger = require('./logger');

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}

exports.parseConfiguration = function(file, callback) {
  isExists(file);

  var properties = PropertiesReader(file);
  var filesToParse = properties.get('mockFileNames');
  var j = 0;

  filesToParse.split(",").forEach(function(fileToParse) {
    var absolutePath = path.resolve(fileToParse.trim());
    logger.log('info', "Parse files: " + absolutePath);
    var data = fs.readFileSync(absolutePath);
    var xmlParser = new xml2js.Parser();

    xmlParser.parseString(data, function (err, result) {
      var rules = result.index.mock;

      rules.forEach(function(rule, i){
        j++;
        rule["sourceFile"] = fileToParse;
        rule["responseParsed"] = extractResponseFromRule(rule);

        callback(rule);
      });
    });
  });
  logger.log('info', "Total rules size: " + j);
}


extractResponseFromRule = function(rule) {
  var responseAsString = rule.response.toString();

  if (responseAsString && responseAsString.trim()) {
    return httpParser.parseResponse(responseAsString);
  } else {
    return [];
  }
}

isExists = function(file){
  try {
    stats = fs.lstatSync(file);
    if (!stats.isFile()) {
      logger.log('error', "ERR1 : " +  file + " is not a file");
      logger.log('error', "Waiting a configuration file as parameter");
      logger.log('error', "node tcpMock.js [ADDRESS] [PORT] [fileConfig]");
      process.exit(1);
    }
  }
  catch (e) {
    logger.log('error', "ERR2 : " +  file + " is not a file");
    logger.log('error', "Waiting a configuration file as parameter");
    logger.log('error', "node tcpMock.js [ADDRESS] [PORT] [fileConfig]");
    process.exit(1);
  }
  logger.log('info', "configuration file found : " + file);

}
