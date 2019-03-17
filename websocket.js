// https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = "node-chat";

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require("websocket").server;
var http = require("http");

/**
 * Global variables
 */
// latest 100 messages
var history = [];
// list of currently connected clients (users)
var clients = [];
/**
 * Helper function for escaping input strings
 */

const htmlEntities = str => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

// Array with some colors
var colors = ["red", "green", "blue", "magenta", "purple", "plum", "orange"];

// ... in random order
colors.sort((a, b) => {
  return Math.random() > 0.5;
});

/**
 * HTTP server
 */
var server = http.createServer((req, res) => {
  // Not important for us. We're writing WebSocket server,
  // not HTTP server
});
server.listen(webSocketsServerPort, () => {
  console.log(
    new Date() + " Server is listening on port " + webSocketsServerPort
  );
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  // WebSocket server is tied to a HTTP server. WebSocket
  // request is just an enhanced HTTP request. For more info
  // http://tools.ietf.org/html/rfc6455#page-6
  httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on("request", request => {
  console.log(new Date() + " Connection from origin " + request.origin + ".");

  // accept connection - you should check 'request.origin' to
  // make sure that client is connecting from your website
  // (http://en.wikipedia.org/wiki/Same_origin_policy)
  var connection = request.accept(null, request.origin);

  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;
  var userName = false;
  var userColor = false;
  console.log(new Date() + " Connection accepted.");

  // send back chat history
  if (history.length > 0) {
    connection.sendUTF(JSON.stringify({ type: "history", data: history }));
  }

  // user sent some message
    connection.on("message", msgFromUser => {
      // msgFromUser = { type: 'utf8', utf8Data: '{"job":132,"text":""}' }
    if (msgFromUser.type === "utf8") {
      // accept only text
      // first message sent by user is their name
      const msg = JSON.parse(msgFromUser.utf8Data);
      const message = msg.text;
      if (msg.job) {
        // new job
        const task = {
          campaign: msg.job,
          segment: 0
        };
        require("./worker").queue
          .add(task, { priority: 1 })
          .then(j => {
            console.log("JOB WAS ADDED", j);
          })
          .catch(err => console.log("ERROR ADDING JOB: " + err.message));

        var obj = {
          time: Date.now(),
          text: htmlEntities("new job manually added"),
          author: userName,
          color: userColor
        };
        history.push(obj);
        history = history.slice(-100);
      } else if (userName === false) {
        // remember user name
        userName = htmlEntities(message);
        // get random color and send it back to the user
        userColor = colors.shift();
        connection.sendUTF(JSON.stringify({ type: "color", data: userColor }));
        console.log(
          new Date() +
            " User is known as: " +
            userName +
            " with " +
            userColor +
            " color."
        );
      } else {
        // log and broadcast the message
        console.log(
          new Date() +
            " Received Message from " +
            userName +
            ": " +
            message
        );

        // we want to keep history of all sent messages
        var obj = {
          time: Date.now(),
          text: htmlEntities(message),
          author: userName,
          color: userColor
        };
        history.push(obj);
        history = history.slice(-100);
        // broadcast message to all connected clients
        var json = JSON.stringify({ type: "message", data: obj });
        for (var i = 0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }
      }
    }
  });

  // user disconnected
  connection.on("close", connection => {
    if (userName !== false && userColor !== false) {
      console.log(
        new Date() + " Peer " + connection.remoteAddress + " disconnected."
      );
      // remove user from the list of connected clients
      clients.splice(index, 1);
      // push back user's color to be reused by another user
      colors.push(userColor);
    }
  });
});

exports.clients = clients;
