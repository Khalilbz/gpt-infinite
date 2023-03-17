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

  // Send to to the AI how the work will be
  ctx.socket.send(`Hi TRANSBOT, A text will be sent to you and will be divided in ` + numChunks + ` chunks of ` + chunkSize + ` lines each.
The translation will be done in ` + numChunks + ` steps. Please wait until the end of the process.
IMPORTANT:
 - YOU WILL ACT AS A TRANSLATOR API CALLED TRANSBOT, YOU WILL LITERALLY RETURN ONLY THE TRANSLATION OF THE TEXT YOU RECEIVE.
 - All your responses will be concatenated in a single file, SO IF YOU ADD ANYTHING, THE FINAL RESULT WILL BE WRONG.
 - Do not use MD formatting, JUST PLAIN TEXT.
 - The content to translate will be between the lines "---------- CONTENT TO TRANSLATE -----------" and "---------- END OF CONTENT -----------"
 - NEVER leave your character TRANSBOT


If you understood the rules, please type "I'm TRANSBOT, and I understood my role as TRANSBOT" to start the process.
`);

  // send the first request
  // sendRequest(ctx);
}

// function to ask the next request
function sendRequest(ctx) {
  var chunkToSend = chunks[currentChunkIndex];
  if(!chunkToSend){// if there is no more chunks to send
    console.log("All chunks have been sent. Session ended.");
    return;
  }
  var message = "";
  if(ctx.options.addTionalTextRules && ctx.options.addTionalTextRules.length > 0) {
    message = ctx.options.request + "\n" +
    "IMPORTANT RULES TO APPLY FOR YOUR TRANSLATION:\n"+
    ctx.options.addTionalTextRules.map(r => " - "+r).join("\n")+
    "\n - STAY IN YOUR CHARACTER AS TRANSBOT\n";
  }else{
    message = ctx.options.request;
  }

  message += "\n\n---------- CONTENT TO TRANSLATE -----------\n";
  if (ctx.options.enableJsonWorkaround) {
    chunkToSend = chunkToSend.replace(/\[/g, '|___')
                              .replace(/\]/g, '__|')
                              .replace(/\{/g, '||--')
                              .replace(/\}/g, '--||');
  }
  message += chunkToSend;
  message += "\n---------- END OF CONTENT -----------\n";
  currentChunkIndex++;// increment the chunk index to get the next chunk on the next request

  ctx.socket.send(message);
}

function handleFirstIncomingMessage(ctx) {
  console.log(`\nMessage received: ${ctx.message}`);

  sendRequest(ctx);
}

// Handle incoming messages from the Chrome extension and ChatBot
function handleIncomingMessage(ctx) {
  console.log(`\nMessage received: ${ctx.message}`);
  const outputFileType = ctx.options.outputFileType || "txt";
  if(!fileName) fileName = ctx.generateResultFileName(ctx.options.fileName || defaultName, outputFileType);
  var escapedMessage = ctx.escapedMessage;
  if (ctx.options.enableJsonWorkaround) {
    escapedMessage = escapedMessage.replace(/\|___/g, '[')
                                    .replace(/__\|/g, ']')
                                    .replace(/\|\|--/g, '{')
                                    .replace(/--\|\|/g, '}');

    escapedMessage = escapedMessage.replace(/```json/g, "");
    escapedMessage = escapedMessage.replace(/```/g, "");
    escapedMessage = escapedMessage.replace(/\\}/g, "}");
  }
  escapedMessage = escapedMessage.replace(/---------- [\p{L}\p{M}]+ -----------/gu, '');
  escapedMessage = escapedMessage.replace(/\\_/g, '_');
  ctx.saveResults(
    null,
    escapedMessage,
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
  handleFirstIncomingMessage,
  handleIncomingMessage,
};
