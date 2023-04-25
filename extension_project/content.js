function htmlToMarkdown(html) {
  let markdown = html;
  markdown = markdown.replace(/<\/?div[^>]*>/g, '');
  markdown = markdown.replace(/<br[^>]*>/g, '\n');

  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<u>(.*?)<\/u>/g, '__$1__');
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
  markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
  markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');
  markdown = markdown.replace(/<code class="[^"]*">/g, '\n'); // remove code tags
  markdown = markdown.replace(/<\/code>/g, ''); // remove pre tags
  markdown = markdown.replace(/<pre><span class="">(.*?)<\/span>/g, '<pre>$1\n'); // remove language tag portion
  markdown = markdown.replace(/<pre>/g, '```'); // replace pre tags with code blocks
  markdown = markdown.replace(/<\/pre>/g, '\n```\n'); // replace pre tags with code blocks
  markdown = markdown.replace(/<button class="flex ml-auto gap-2">(.*?)<\/button>/g, ''); // Remove copy button SVG
  markdown = markdown.replace(/<span class="[^"]*">|<\/span>/g, ''); // Remove span tags
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n');

  const unorderedRegex = /<ul>(.*?)<\/ul>/gs;
  let match;
  let indent = 0;
  while ((match = unorderedRegex.exec(markdown))) {
      const list = match[1];
      const items = list.split('<li>');
      let itemStr = '';
      items.forEach((item, i) => {
          if (i === 0) return;
          item = item.replace('</li>', '');
          if (item.indexOf('<ul>') !== -1) {
              indent++;
          }
          itemStr += `${'  '.repeat(indent)}* ${item}`;
          if (item.indexOf('</ul>') !== -1) {
              indent--;
          }
      });
      markdown = markdown.replace(match[0], `${itemStr}`);
  }

  const orderedRegex = /<ol.*?>(.*?)<\/ol>/gs;
  const orderedLists = markdown.match(orderedRegex);
  if (orderedLists) {
      orderedLists.forEach((orderedList) => {
          let mdOrderedList = '';
          const listItems = orderedList.match(/<li.*?>(.*?)<\/li>/g);
          if (listItems) {
              listItems.forEach((listItem, index) => {
                  if (listItem.indexOf('<ul>') !== -1) {
                      indent++;
                  }
                  mdOrderedList += `${'  '.repeat(indent)}${index + 1
                      }. ${listItem.replace(/<li.*?>(.*?)<\/li>/g, '$1\n')}`;
                  if (listItem.indexOf('</ul>') !== -1) {
                      indent--;
                  }
              });
          }
          markdown = markdown.replace(orderedList, mdOrderedList);
      });
  }

  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, function (match, p1) {
      return (
          '\n' +
          p1.replace(/<li>(.*?)<\/li>/g, function (match, p2) {
              return '\n- ' + p2;
          })
      );
  });
  const tableRegex = /<table>.*?<\/table>/g;
  const tableRowRegex = /<tr>.*?<\/tr>/g;
  const tableHeaderRegex = /<th.*?>(.*?)<\/th>/g;
  const tableDataRegex = /<td.*?>(.*?)<\/td>/g;

  const tables = html.match(tableRegex);
  if (tables) {
      tables.forEach((table) => {
          let markdownTable = '\n';
          const rows = table.match(tableRowRegex);
          if (rows) {
              rows.forEach((row) => {
                  let markdownRow = '\n';
                  const headers = row.match(tableHeaderRegex);
                  if (headers) {
                      headers.forEach((header) => {
                          markdownRow += `| ${header.replace(tableHeaderRegex, '$1')} `;
                      });
                      markdownRow += '|\n';
                      markdownRow += '| --- '.repeat(headers.length) + '|';
                  }
                  const data = row.match(tableDataRegex);
                  if (data) {
                      data.forEach((d) => {
                          markdownRow += `| ${d.replace(tableDataRegex, '$1')} `;
                      });
                      markdownRow += '|';
                  }
                  markdownTable += markdownRow;
              });
          }
          markdown = markdown.replace(table, markdownTable);
      });
  }
  return markdown;
}
// end

var skippingDoubleFirstMessageWorkaround = -1; // Last message count for the fix
var runnigFirstTime = true;

// Mark all existing elements with className as processed
function markExistingElements(className) {
  const nodes = document.querySelectorAll(`.${className}`);
  var count = 0;
  nodes.forEach(node => {
    node.setAttribute('data-processed', true);
    count++;
  });
  if(count > 0) console.log("marked " + count + " elements as processed");
}


// function to detect new elements with specified class
function detectNewElement(className, callback) {
  setInterval(() => {
    const nodes = document.querySelectorAll(`.${className}`);
    if (nodes.length > 0) {
      nodes.forEach(node => {
        if (!node.hasAttribute('data-processed')) {
          node.setAttribute('data-processed', true);
          if((document.querySelector("main > div > div > div > div").children.length == 6) && (skippingDoubleFirstMessageWorkaround == 4)) {
            skippingDoubleFirstMessageWorkaround = document.querySelector("main > div > div > div > div").children.length;
            return;
          }
          skippingDoubleFirstMessageWorkaround = document.querySelector("main > div > div > div > div").children.length;
          console.log("new element detected ++++++++++++++++++++++");
          console.log((document.querySelector("main > div > div > div > div").children.length));
          callback(node);
        }
      });
    }
  }, 700);
}

function sendMessageToChat(message){
  // Find the textarea element with the specified classes
  const textarea = document.querySelector("textarea.w-full.resize-none");

  // Fill the textarea with the text message
  textarea.value = message;

  // Simulate a press of the Enter key
  const enterKeyEvent = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Enter",
    keyCode: 13,
  });

  textarea.dispatchEvent(enterKeyEvent);

}

var socket = {};





var triggers = {
  // When receiving a message from ChatGPT
  onNewGPTMessage: function(message) {
      // Send the message to the WebSocket server
      socket.send(message);
      console.log("New message: " + message);
  },
  // When receiving a message from localhost
  onMessageRequest: function(message) {
      sendMessageToChat(message);
      console.log("New Request message: " + message);
  },
};

function run(onCloseCallback) {
  if (!runnigFirstTime){
    onCloseCallback(socket, runnigFirstTime);
    return;
  }
  
  console.log("ChatGPT API is Running ...");
  
  // Connect to WebSocket server
  socket = new WebSocket("ws://localhost:3123");
  
  // Handle WebSocket connection opened
  socket.onopen = function() {
    console.log("WebSocket connection opened");
    runnigFirstTime = false;
    markExistingElements("markdown.prose.w-full.break-words");
      // Send a message to the server to confirm connection
      // socket.send("Connected to Chrome extension");
  };

  // Handle WebSocket connection closed
  socket.onclose = function() {
      console.log("WebSocket connection closed");
      // Trigger the onCloseCallback function when the connection is closed
      onCloseCallback(socket, runnigFirstTime);
  };

  // Handle WebSocket error
  socket.onerror = function(event) {
      console.log("WebSocket error: " + event);
      onCloseCallback(socket, runnigFirstTime);
  };

  // Handle WebSocket message received
  socket.onmessage = function(event) {
      console.log("WebSocket message received: " + event.data);
      // Trigger the onMessageRequest function when a message is received
      triggers.onMessageRequest(event.data);
  };

  // detect new elements with the specified class
  detectNewElement("markdown.prose.w-full.break-words", async (node) => {
      const interval = setInterval(() => {
          if (!node.classList.contains("result-streaming")) {
              clearInterval(interval);
              // console.log(node.innerText);
              // const turndownService = new TurndownService({
              //   codeBlockStyle: 'fenced',
              //   fence: '```',
              // });

              // Add a custom rule to preserve the indentation of code blocks
              // turndownService.addRule('codeBlock', {
              //   filter: 'pre',
              //   replacement: function (content, node) {
              //     var className = node.firstChild.className || '';
              //     var language = className.replace(/^language-/, '');
              //     var fence = '```' + language;
              //     var code = node.firstChild.textContent;
              //     // Preserve the indentation of the code block
              //     code = code.replace(/^(.*)$/gm, '    $1');
              //     // code = code.substring(code.indexOf("<"), code.indexOf("Copy code")).replace(/<[^>]*>/g, '');
              //     // Remove the class name and the "Copy code" text
              //     var newContent = fence + '\n' + code + '\n```';
              //     return newContent.replace(/```(.*?)bg-black.*?```/gs, '```$1\n' + code + '\n```');
              //   },
              //   keepReplacement: true // This option preserves the indentation
              // });



              // console.log("turndownService.turndown(node) ++++++++++++++++++++++");
              // console.log(turndownService.turndown(node));
              // triggers.onNewGPTMessage(turndownService.turndown(node));
              console.log(htmlToMarkdown(node.innerHTML));
              triggers.onNewGPTMessage(node.innerHTML);
              // triggers.onNewGPTMessage(htmlToMarkdown(node.innerHTML));
          } else {
              // console.log("waiting for result-streaming to finish ++++++++++++++++++++++");
          }
      }, 300);
  });

}





// create async sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var buttonClickState = "normal";
function updateButton(button, buttonClickState){
  button.innerHTML = '<svg stroke="currentColor" style="color: #b3b300;" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="14" y2="14"></line><line x1="8" y1="18" x2="10" y2="18"></line></svg>Start ChatGPT API';
  if(buttonClickState == "running"){
    button.innerHTML = button.innerHTML.replace("Start ChatGPT API", "Running ChatGPT API...");
    button.innerHTML = button.innerHTML.replace("#b3b300", "#02b300");
  }else if(buttonClickState == "stopped"){
    button.innerHTML = button.innerHTML.replace("Start ChatGPT API", "Start ChatGPT API");
    button.innerHTML = button.innerHTML.replace("#b3b300", "#b3b300");
  }
}
const ButtonClickTrigger = () => {
  // replace "Start ChatGPT API" with "Running ChatGPT API..."
  buttonClickState = "running";
  updateButton(button, buttonClickState);
  run((socket) => {
    // replace "Running ChatGPT API..." with "Start ChatGPT API"
    runnigFirstTime = true;
    buttonClickState = "stopped";
    updateButton(button, buttonClickState);
    document.getElementById('kha-gpt-enable-button').remove();
    injectButton();
  }); // Call the run() function
};

async function injectButton(){
  await sleep(1000);
  if(document.getElementById('kha-gpt-enable-button')) return;
  // Find the nav element to append the button to
  const nav = document.querySelector("nav");
  
  // Create the button element
  const button = document.createElement("a");
  button.id = "kha-gpt-enable-button";
  button.classList.add("flex", "py-3", "px-3", "items-center", "gap-3", "rounded-md", "hover:bg-gray-500/10", "transition-colors", "duration-200", "text-white", "cursor-pointer", "text-sm");

  updateButton(button, buttonClickState);
  // Add a click event listener to the button
  button.addEventListener("click", ButtonClickTrigger);
  
  const fourthElement = nav.children[3]; // Get the fourth child element (index 3)
  nav.insertBefore(button, fourthElement); // Insert the button before the fourth element
}
const navElements = document.getElementsByTagName('nav');

for (const navElement of navElements) {
  navElement.addEventListener('click', function(event) {
    injectButton();
  });
}
injectButton();
console.log("========== CHATGPT API ==========");