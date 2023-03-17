const fs = require('fs');

// Variables of the session
const defaultName = "auto-translated-content";
var fileName = null;
var allTextToTranslate = "";
var chunks = [];
var currentChunkIndex = 0;

// Send the initial message to request section titles
function sendFirstMessage(ctx) {
  // initialize the chunks
  allTextToTranslate = ctx.options.textToTranslate;
  if(!allTextToTranslate) {
    allTextToTranslate = fs.readFileSync(ctx.options.fileToTranslate, 'utf8');
  }
  const chunkSize = parseInt(ctx.options.chunkSize || 10);
  const lines = allTextToTranslate.split('\n'); // split the text into an array of lines
  const numChunks = Math.ceil(lines.length / chunkSize); // calculate the number of chunks needed
  chunks = Array.from({ length: numChunks }, (_, i) =>
    lines.slice(i * chunkSize, i * chunkSize + chunkSize).join('\n')
  );

  // send the first request
  sendRequest(ctx);
}

// function to ask the next request
function sendRequest(ctx) {
  if(!chunks[currentChunkIndex]){// if there is no more chunks to send
    console.log("All chunks have been sent. Session ended.");
    return;
  }
  var message = "";
  if(ctx.options.addTionalTextRules && ctx.options.addTionalTextRules.length > 0) {
    message = ctx.options.request + "\n" +
    "IMPORTANT RULES TO APPLY FOR YOUR TRANSLATION:\n"+
    ctx.options.addTionalTextRules.map(r => " - "+r).join("\n");
  }else{
    message = ctx.options.request;
  }

  message += "\n\n---------- CONTENT TO TRANSLATE -----------\n";
  message += chunks[currentChunkIndex];
  message += "\n---------- END OF CONTENT -----------\n";
  currentChunkIndex++;// increment the chunk index to get the next chunk on the next request

  ctx.socket.send(message);
}

// Handle incoming messages from the Chrome extension and ChatBot
function handleIncomingMessage(ctx) {
  console.log(`\nMessage received: ${ctx.message}`);
  const outputFileType = ctx.options.outputFileType || "txt";
  if(!fileName) fileName = ctx.generateResultFileName(ctx.options.fileName || defaultName, outputFileType);
  ctx.saveResults(
    null,
    ctx.escapedMessage,
    outputFileType,
    {
      forceFileName: fileName,
      appendToFile: true,
    }
  );
  sendRequest(ctx);
}

module.exports = {
  sendFirstMessage,
  handleFirstIncomingMessage: handleIncomingMessage,
  handleIncomingMessage,
};
