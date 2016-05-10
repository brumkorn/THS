/**
 * Created by Brumkorn on 06.05.2016.
 */
var http = require('http');
var fs = require('fs');

http.createServer(RequestHandler)
  .listen(3000, '127.0.0.1');

function RequestHandler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=UTF-8");

  if (req.url == '/load') {
    fs.readFile('serverDB.json', ReadCallback);

    function ReadCallback(err, content) {

      if (err) {
        console.log(err);
        res.statusCode = 500;
        res.end("Hewston, we have a problem on the server!");
        throw err;
      }

      res.end(content);
    }
  }

  if (req.url == '/save') {

    var body = [];

    req
      .on('data', ChunkBody)
      .on('end', FullBody);

    fs.writeFile('serverDB.json', body, WriteCallback);

    function ChunkBody(chunk) {
      body.push(chunk);
    }

    function FullBody() {
      body = Buffer.concat(body).toString();
    }

    function WriteCallback(err) {

      if (err) {
        console.log(err);
        res.statusCode = 500;
        res.end("Hewston, we have a problem on the server!");
        throw err;
      }

      res.end("The file was written");
    }
  } else {
    /* 404 */
  }
}
