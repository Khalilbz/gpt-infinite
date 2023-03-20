// Variables to track the state of the session
const storyContent = "auto-generated-content";
var sectionsTitles = [];
var sectionsContents = [];
var currentSectionNum = 0;
var fileName = null;

// Send the initial message to request section titles
function sendFirstMessage(ctx) {
  return `Here's the subject:\n${ctx.options.firstMessage || storyContent}\n\nCan you generate a list of sections titles for my subject ? ` +
`IMPORTANT: THE OUTPUT OF THE LIST should use the following format: 
[CHAPTERS-LIST]
[CHAPTER-<NUM>]section title<NUM>[END-OF-CHAPTER-<NUM>]
[CHAPTER-<NUM>]section title<NUM>[END-OF-CHAPTER-<NUM>]
[CHAPTER-<NUM>]section title<NUM>[END-OF-CHAPTER-<NUM>]
...
[END-CHAPTERS-LIST]
      `;
}

function reverseMarkdownChanges(text) {
  // Replace _MD_HASHTAG with #
  text = text.replace(/_MD_HASHTAG/g, '#');
  
  // Replace _MD_2_HASHTAGS with ##
  text = text.replace(/_MD_2_HASHTAGS/g, '##');
  
  // Replace _MD_BACKTICK with `
  text = text.replace(/_MD_BACKTICK/g, '`');
  
  // Replace _MD_3_BACKTICKS[LANGUAGE] with ```[LANGUAGE]
  text = text.replace(/_MD_3_BACKTICKS\[(.*?)\]/g, '```$1');
  
  // Replace _MD_3_BACKTICKS with ```
  text = text.replace(/_MD_3_BACKTICKS/g, '```');
  
  // Replace _MD_ASTERISK with *
  text = text.replace(/_MD_ASTERISK/g, '*');
  
  // Replace _MD_GREATER_THAN with >
  text = text.replace(/_MD_GREATER_THAN/g, '>');
  
  // Replace _MD_TAB with [TAB]
  text = text.replace(/_MD_TAB/g, '\t');
  
  return text;
}


// function to ask for next section
function askForNextSection(ctx) {
  var questionPart = (ctx.options && ctx.options.questionSchema)
    ? ctx.options.questionSchema.replace("{title}", sectionsTitles[currentSectionNum])
    : `Please write the content of the next section of : ${sectionsTitles[currentSectionNum]}\n `;
  var addTionalTextRules = (ctx.options && ctx.options.addTionalTextRules) ? ("- "+ctx.options.addTionalTextRules.join("\n- ")) : "";
  // console.log("Asking for next section: " + sectionsTitles[currentSectionNum]);
  // console.log("Additional text rules: " + addTionalTextRules);
  // console.log("Question part: " + questionPart);
  // console.log(ctx.options);
  // process.exit(0);
  ctx.socket.send(
    questionPart + "\n" +
    addTionalTextRules+
    "\n---------------------\n"+
    `IMPORTANT:
    - OUTPUT FORMAT SHOULD BE IN PROPER MD LANUGAGE
    - forget any other formatting mentioned in the previous messages
    - Don't say anything except your work, because your output will be exported directly to a file`
  );
}

// Handle incoming messages from the Chrome extension of the ChatBot to parse all sections titles from the response message and store them in the sectionsTitles array
function handleFirstIncomingMessage(ctx) {

  console.log("handleFirstIncomingMessage+++++++++++++++++++++++++++++++");

  if(!fileName) {
    fileName = ctx.generateResultFileName((ctx.options.fileName || storyContent), "md");
    // Initial file content
    ctx.saveResults(
      null,
      "Subject:"+storyContent+"\n\n\n\n",
      "md",
      {
        forceFileName: fileName,
        appendToFile: true,
      }
    );
  }
  
  if(ctx.options && ctx.options.sectionsTitles && ctx.options.sectionsTitles.length > 0) {
    console.log("Sections titles are already provided in the options");
    sectionsTitles = ctx.options.sectionsTitles;
    askForNextSection(ctx);
    return;
  }
  // console.log("ctx.message+++++++++++++++++++++++++++++++");
  // console.log(ctx.message);
  // console.log("ctx.escapedMessage+++++++++++++++++++++++++++++++");
  // console.log(ctx.escapedMessage);
  // console.log("Sections titles are not provided in the options, so we will parse them from the response message");
  // const titleResponseFormat = /\[CHAPTER-(\d+)\](.+)\[END-OF-CHAPTER-(\d+)\]/g;
  const titleResponseFormat = /\[CHAPTER-(\d+)\](.+?)\[END-OF-CHAPTER-(\d+)\]/g;

  let match;

  while ((match = titleResponseFormat.exec(ctx.escapedMessage)) !== null) {
    const [fullMatch, sectionNum, sectionTitle, endNum] = match;
    // console.log(`+++++++++++++++Section ${sectionNum}: ${sectionTitle}`);
    sectionsTitles.push(sectionTitle);
  }

  // console.log("sectionsTitles+++++++");
  // console.log(sectionsTitles);

  if(!sectionsTitles[currentSectionNum]) throw new Error("No section title found in the response message");
  console.log("");

  askForNextSection(ctx);
}

// Handle incoming messages from the Chrome extension and ChatBot
function handleIncomingMessage(ctx) {
  console.log(`\nMessage received: ${ctx.message}`);

  currentSectionNum++;

  sectionsContents.push({
    sectionNum: currentSectionNum,
    sectionTitle: sectionsTitles[currentSectionNum - 1],
    sectionContent: ctx.message,
    // sectionContent: reverseMarkdownChanges(ctx.message),
    // sectionContent: ctx.escapedMessage,
  });

  // Auto save
  ctx.saveResults(
    null,
    ctx.message,
    "md",
    {
      forceFileName: fileName,
      appendToFile: true,
    }
  );

  if (currentSectionNum === sectionsTitles.length) {
    console.log("\n\n\n\n\nAll sections have been received");
    // var sectionsContentString = "";
    // sectionsContents.forEach((section) => {
    //   sectionsContentString += `${section.sectionContent}\n\n`;
    // });
    // ctx.saveResults((ctx.options.fileName || storyContent), "Subject:"+storyContent+"\n\n\n\n"+sectionsContentString, "md");
    
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
