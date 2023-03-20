// Variables to track the state of the session
const defaultName = "auto-received-content";
var fileName = null;

// Send the initial message to request section titles
function sendFirstMessage(ctx) {
  if(!fileName) {
    fileName = ctx.generateResultFileName((ctx.options.fileName || defaultName), "md");
    ctx.saveResults(
      null,
      "",
      "md",
      {
        forceFileName: fileName,
        appendToFile: true,
      }
    );
  }
  return null;
}

// Handle incoming messages from the Chrome extension and ChatBot
function handleIncomingMessage(ctx) {
  console.log(`\nMessage received: ${ctx.message}`);

  // Auto save
  ctx.saveResults(
    null,
    ctx.message+"\n",
    "md",
    {
      forceFileName: fileName,
      appendToFile: true,
    }
  );
}

module.exports = {
  sendFirstMessage,
  handleFirstIncomingMessage: handleIncomingMessage,
  handleIncomingMessage,
};
