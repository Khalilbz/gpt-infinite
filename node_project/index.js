const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const helpers = require('./helpers.js');
const { parse } = require('jsonc-parser');

// Loading the templates (sendFirstMessage, handleFirstIncomingMessage, handleIncomingMessage)
const templates = {
  indexedContent: require('./templates/indexedContent.js'),
  multiSectionIndexedContent: require('./templates/multiSectionIndexedContent.js'),
};

// Variables to track the state of the session
var firstReponseIsReceived;
var templateName;
var ignoreFirstMessage;
var selectedTemplate;
var port;// 3123;
var options = {};

async function runProgram() {
  const server = new WebSocket.Server({ port: port });
  selectedTemplate = templates[templateName];
  // firstReponseIsReceived = ignoreFirstMessage;

  console.log("\n\nWaiting for connections from Chrome Extension...");
  
  // When receiving a connection from Chrome Extension to talk to ChatGPT
  server.on('connection', (socket) => {
    console.log('WebSocket connection opened');
  
    // Send the initial message to request section titles
    if(!ignoreFirstMessage) socket.send(selectedTemplate.sendFirstMessage({socket, options}));
  
    const socketOnMessage = (_message) => {
      // console.log(`Received message from ChatGPT: ${_message}`);
      // console.log(`Received message from ChatGPT .toString(): ${_message.toString()}`);
      const message = helpers.convertHtmlToMD(_message.toString());
      // console.log(`Received message from ChatGPT PARSED: ${message}`);
      const escapedMessage = message.replace(/\\([\[\]{}()*+?.,\\^$|#\s])/g, '$1');
  
      const ctx = {
        socket,
        message: message,
        escapedMessage,
        saveResults:helpers.saveResults,
        options: options,
      };
  
  
      // Check if the message is a response to the initial message
      if (!firstReponseIsReceived) {
        firstReponseIsReceived = true;
        console.log("Received initial response from ChatGPT. Session started.");
        // Handle first incoming message
        selectedTemplate.handleFirstIncomingMessage(ctx);
      } else {
        // Handle incoming messages from the template logic
        selectedTemplate.handleIncomingMessage(ctx);
      }
  
    };

    // Automatically fill the sections titles array from the options object if it exists
    if (options.sectionsTitles && options.sectionsTitles.length > 0) {
      socketOnMessage("");// Send an empty message to start the session
    }
    socket.on('message', socketOnMessage);
  
    socket.on('close', () => {
      console.log('WebSocket connection closed');
    });
  
    socket.on('error', (error) => {
      console.log(`WebSocket error: ${error}`);
    });
  
    // Listen for console input
    process.stdin.on('data', function(data) {
      // Send the message to the WebSocket server
      socket.send(data.toString().trim());
    });
  });  
}

async function getUserInput() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const name = args[0];
    const filePath = path.join(__dirname, 'messions', `${name}.jsonc`);

    // if file does not exist, exit
    if (!fs.existsSync(filePath)) {
      console.log(`Mession ${name} does not exist`);
      process.exit(1);
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = parse(data);

    const loadVariable = (variableName) => {
      return jsonData[variableName];
    };

    templateName = loadVariable('templateName');
    ignoreFirstMessage = loadVariable('ignoreFirstMessage') ? "y" : "n";
    port = loadVariable('port');
    options = jsonData;
    
  }else{
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
    const readData = (question) => {
      return new Promise(resolve => {
        rl.question(question, resolve);
      });
    };
  
    templateName = await readData('Enter the template name [indexedContent]: ');
    ignoreFirstMessage = await readData('Ignore first message? (y/n) [n]: ');
    port = await readData('Enter the Port Number [3123]: ');

    rl.close();
  }
  
  
  templateName = templateName || 'indexedContent';
  ignoreFirstMessage = (ignoreFirstMessage||"").toLowerCase() === 'y';
  port = parseInt(port) || 3123;

  console.log(`
  Template Name: ${templateName}
  Ignore First Message: ${ignoreFirstMessage}
  Port: ${port}
  `);
}

getUserInput().then(() => {
  runProgram();
});