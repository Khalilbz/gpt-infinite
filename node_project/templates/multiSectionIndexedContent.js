// Variables to track the state of the session
const storyContent = "auto-generated-content";
var sectionsTitles = [];
var sectionsContents = [];
var currentSectionNum = 0;
var currentSectionObject = null;
var currentSectionRemainingParts = 0;
var everythingIsFinished = false; // Workaround to save the last section
var isFirstInsertion = true; // Workaround to get first title
// Send the initial message to request all section titles
function sendFirstMessage(ctx) {
  return `Here's the subject:\n${ctx.firstMessage || storyContent}\n\nCan you generate a list of sections titles for my subject ? ` +
`IMPORTANT: THE OUTPUT OF THE LIST should use the following format: 
[CHAPTERS-LIST]
[CHAPTER-<NUM>]section title<NUM>[END-OF-CHAPTER-<NUM>]
[CHAPTER-<NUM>]section title<NUM>[END-OF-CHAPTER-<NUM>]
[CHAPTER-<NUM>]section title<NUM>[END-OF-CHAPTER-<NUM>]
...
[END-CHAPTERS-LIST]
      `;
}



// function to ask for next section
function askForNextSection(ctx) {
  if(!sectionsTitles[currentSectionNum]){ // Workaround to save the last section
    everythingIsFinished = true;
    ctx.socket.send("Thank you for your help. I'm done.");
    return;
  }
  // console.log("ctx.options.contentSections.length");
  // console.log(ctx.options.contentSections.length);
  // console.log("currentSectionRemainingParts = " + currentSectionRemainingParts);
  var contentSectionOption = ctx.options.contentSections[ctx.options.contentSections.length - currentSectionRemainingParts - 1];
  var isFirstPart = (currentSectionRemainingParts == ctx.options.contentSections.length - 1);
  var questionPart = ctx.options.questionSchema
                      .replace("{title}", sectionsTitles[currentSectionNum])
                      .replace("{section}", contentSectionOption.name);
  var addTionalTextRules = (ctx.options && ((ctx.options.addTionalTextRules || []).length > 0)) ? ("- "+ctx.options.addTionalTextRules.join("\n- ")) : "";
  addTionalTextRules += "\n"+("- "+contentSectionOption.addTionalTextRules.join("\n- "));
  var unwantedSections = ctx.options.contentSections.filter((section) => section.name != contentSectionOption.name).map((section) => section.name).join(", ");
  unwantedSections = (unwantedSections || "").toUpperCase();
  ctx.socket.send(
    questionPart + "\n" +
    addTionalTextRules+
    "\n\n\n---------------------\n"+
    `IMPORTANT:
    - START your response with ## ${contentSectionOption.name}
    - BE SURE TO WRITE ONLY THE REQUESTED SECTION [${contentSectionOption.name}]
    - BE SURE TO DO NOT WRITE SECTIONS [${unwantedSections}]
    - OUTPUT FORMAT SHOULD BE IN PROPER MD LANUGAGE
    - forget any other formatting mentioned in the previous messages`
  );
}

// Handle incoming messages from the Chrome extension of the ChatBot to parse all sections titles from the response message and store them in the sectionsTitles array
function handleFirstIncomingMessage(ctx) {

  if(ctx.options && ctx.options.sectionsTitles) {
    sectionsTitles = ctx.options.sectionsTitles;
    currentSectionRemainingParts = ctx.options.contentSections.length-1;
    askForNextSection(ctx);
    return;
  }

  const titleResponseFormat = /\[CHAPTER-(\d+)\](.+?)\[END-OF-CHAPTER-(\d+)\]/g;

  let match;

  while ((match = titleResponseFormat.exec(ctx.escapedMessage)) !== null) {
    const [fullMatch, sectionNum, sectionTitle, endNum] = match;
    sectionsTitles.push(sectionTitle);
  }

  askForNextSection(ctx);
}

// Handle incoming messages from the Chrome extension of the ChatBot to ask for all sections one by one
function handleIncomingMessage(ctx) {
  console.log(`\nMessage received: ${ctx.message}`);

  // console.log("handleIncomingMessage +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

  // console.log("ctx.options.contentSections.length");
  // console.log(ctx.options.contentSections.length);
  // console.log("currentSectionRemainingParts = " + currentSectionRemainingParts);
  // console.log("currentSectionNum = " + currentSectionNum);
  // console.log("sectionsTitles.length = " + sectionsTitles.length);
  // console.log("Starting a new section => "+((currentSectionRemainingParts == (ctx.options.contentSections.length - 1)) ? "true" : "false"));
  if(currentSectionRemainingParts == (ctx.options.contentSections.length - 1)) {// Starting a new section
  
    // Store the content of the completed section
    if(currentSectionObject){
      if(ctx.options.endSectionSeparator){
        currentSectionObject.sectionContent += ctx.options.endSectionSeparator;
      }else{
        currentSectionObject.sectionContent += "\n\n\n\n";
      }
      sectionsContents.push(currentSectionObject);
    }

    // Create a new section object
    currentSectionObject = {
      sectionNum: currentSectionNum,
      sectionTitle: sectionsTitles[currentSectionNum - 1],
      sectionContent: "",
    }
    if(isFirstInsertion){// Workaround to get first title
      isFirstInsertion = false;
      currentSectionObject.sectionTitle = sectionsTitles[0];
    }
    currentSectionObject.sectionContent += "# "+currentSectionObject.sectionTitle+"\n\n";
    currentSectionObject.sectionContent += ctx.message;
    currentSectionRemainingParts = ctx.options.contentSections.length - 1;

  }else{// Working on the current section
    currentSectionObject.sectionContent += `\n\n${ctx.message}`;
  }

  if(currentSectionRemainingParts == 0){
    currentSectionRemainingParts = ctx.options.contentSections.length;
    currentSectionNum++;
  }
  currentSectionRemainingParts--;


  // If all sections have been received, save the results to a file
  // if ((currentSectionNum == sectionsTitles.length) && (currentSectionRemainingParts == (ctx.options.contentSections.length - 1))) {
  if (everythingIsFinished) {
    console.log("\n\n\n\n\nAll sections have been received");
    var sectionsContentString = "";
    sectionsContents.forEach((section) => {
      sectionsContentString += `${section.sectionContent}\n\n`;
    });
    ctx.saveResults((ctx.options.fileName || storyContent), "Story subject:"+storyContent+"\n\n\n\n"+sectionsContentString, "md");
    
  } else {
    // Send a message to the Chrome extension to request the next section
    askForNextSection(ctx);
  }
}

module.exports = {
  sendFirstMessage,
  handleFirstIncomingMessage,
  handleIncomingMessage,
};
