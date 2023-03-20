const fs = require('fs');
const path = require('path');
const { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } = require('node-html-markdown');

const slugify = (str) => str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');

function generateResultFileName(title, type = 'txt') {
  return `${slugify(title).substring(0, 20)}-${new Date().toISOString()}.`+type;
}

function saveResults(title, text, type = 'txt', options = {forceFileName: null, appendToFile: false}) {
  var fileName = options.forceFileName || generateResultFileName(title, type);
  const resultsPath = path.join(__dirname, 'results');
  const filePath = path.join(resultsPath, fileName);
  
  var _text = text;
  if(options.appendToFile && fs.existsSync(filePath)){ // Append to existing file if it exists
    const existingContent = fs.readFileSync(filePath, 'utf8');
    _text = existingContent + _text;
  }

  fs.writeFileSync(filePath, _text, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
}

function convertHtmlToMD(_html) {

  var html = _html;

  // Deleting the "Copy code" text
  html = html.replace(/Copy code<\/button><\/div>/g, '</button></div>');
  // Adding the language to the code block
  // html = html.replace(/<pre><div class="bg-black mb-4 rounded-md"><div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans"><span class="">([^<]*)<\/span><button class="flex ml-auto gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http:\/\/www.w3.org\/2000\/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"><\/path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"><\/rect><\/svg><\/button><\/div><div class="p-4 overflow-y-auto"><code class="!whitespace-pre hljs language-/g, '<pre><code data-language="$1" class="!whitespace-pre hljs language-');
  html = html.replace(/<pre><div class[^]*?>([a-zA-Z\s]+)<\/span><button[^]*?<code class/g, '<pre><code data-language="$1" class');
  // Removing the additional divs, so "node-html-markdown" can detect the code blocks
  html = html.replace(/<\/code><\/div><\/div><\/pre>/g, '</code></pre>');

  var md = NodeHtmlMarkdown.translate(html, {
    codeBlockStyle: "fenced",
    code: 'block'
  });

  // saveResults('test-test-test', html+"\n\n\n\n\n\n\n\n\n"+md, 'txt');

  return md;
}

function listMissions() {
  const directoryPath = path.join(__dirname, 'missions');

  try {
    const files = fs.readdirSync(directoryPath);

    console.log("Available Missions:");
    files.forEach((file) => {
      const extension = path.extname(file);
      if (extension) {
        const fileName = path.basename(file, extension);
        console.log("\t"+fileName);
      } else {
        console.log("\t"+file);
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
}


module.exports = {
  generateResultFileName,
  slugify,
  saveResults,
  convertHtmlToMD,
  listMissions,
};