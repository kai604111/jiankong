var http = require('http');

var messages = [
  'Hello World',
  'From a basic Node.js server',
  'Take Luck'];
http.createServer(function (req, res) {
  res.setHeader("Content-Type", "application/json;charset=UTF-8");
  res.writeHead(200);
  res.write('<html><head><title>Simple HTTP Server</title></head>');
  res.write('<body>');
  res.end('');
}).listen(8080);

var options = {
    hostname: 'localhost',
    port: '8080'
  };
function handleResponse(response) {
  var serverData = '';
  response.on('data', function (chunk) {
    serverData += chunk;
  });
  response.on('end', function () {
    console.log("Response Status:", response.statusCode);
    console.log("Response Headers:", response.headers);
    console.log(serverData);
  });
}
http.request(options, function(response){
  handleResponse(response);
}).end();