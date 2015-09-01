# HTTP Mock with Node JS

This application is useful to mock an HTTP server exposing a WebService.

## Instalation

As I just start the node development I didn't yet prepare the environment to speed up the installation (sorry)

* Install Node + NPM
* Call, from the root directory, NPM to install dependencies

  ``` $> npm update ```

 * properties-reader
* create a property file with the list of rules
* create your rules files 

Remark: I used **http-string-parser** but I plan to change that or pull request fix as it not at all efficient

You have file example [here](./example).

## Configuration files

### Property file

You just have to create a file organized as a property file with a parameter containing the list of rule files. You just have to write the relative path of your rules file example :

``` mockFileNames=myFile1.xml,myFile2.xml,... ```

### Rules File

The rule file exposes 

* a regexp that will be used by the mock to select the request that will activate the response to return. The request represent all element send with the request (url, headers, content).
* the response to return for each request. Here you just write the exact String returned by the server into the tcp tunnel. You can use SOAPUI or Wireshark to get the response returned by the server simulated by the HTTP mock server.

Here is an example :

```
<?xml version="1.0" encoding="UTF-8"?>
<index>
	<mock>
		<description>MyFirstRule</description>
		<requestPattern>.*stringToDetect.*</requestPattern>
		<response><![CDATA[HTTP/1.1 200 OK
Date: Tue, 08 Sep 2008 11:10:28 GMT
Connection: close
Content-Type: text/xml; charset="utf-8"

ContentToReturn

]]>
		</response>
	</mock>
	<mock>
	   ... Here the second rule ...
	</mock>
</index>
```

This Rule will return ``` ContentToReturn ``` if the request contains the string ``` stringToDetect ```.

You can write several rules in the same rule file. The priority order is given by the order of the rule files in the property file and the rule in the rule files. The first rule matching the request give the returned answer.

### Prepare data (should be soon removed)

The HTTP String parser used waits Windows carriage return (really bad). I plan to rewrite the parser or send pull request to improve that or use a real parser.

Waiting that, you can normalize your files with the little script available in the root of the project. Just give the directory where file with rules as parameter and files will be normalized.

```
$> chmod u+x normalizeCarriageReturn.sh
$> ./normalizeCarriageReturn.sh my/directory/
```



## Start the server

``` > node httpMock.js addressToListen portTolisten propertyFile ```

* addressToListen : ip address (0.0.0.0 for all enabled ip address of the server)
* portToListen : port to listen
* propertyFile : path the property file described above

## Next task to do

* Improve the http parser is really not stable (http-string-parser).
* Add Unit test
* Add dynamic value to extract of the request to use it in the answer
* propose an easier way to create a rule
* upload/download/multi-part management
