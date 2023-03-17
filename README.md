## GPT Infinite

This is a Node.js based automation tool that helps to automate tasks in chat GPT. It follows a mission-based methodology, For now we only use the free version available on the web.
> ChatGPT API implementation will come later

## Available Messions

### 1. Indexed Content Mission:
* This mission asks for a specific set of requests and returns detailed documentation or a to-do list. It can also be used for translating large content by splitting it into multiple requests or similar things.
    
### 2. Multi-section Indexed Content Mission:
* This mission asks for a specific set of requests, and for each request, it will ask for a custom set of sections. This can be used to go into detail for a large number of stories, books or any other content by asking for a set number of sections per item.
    
### 3. Long Translation:
* This mission to translate a file by sending it section by section, for now only text based files are supported (TXT, HTML, XML, JSON, ...).
    

For instance, if you want to create a book of 100 stories, each story with 50 sections, this mission can be used to generate it with just one automation request.

To use this tool, you need to install the Chrome extension and open a ChatGPT chrome tab.

## Installation

1.  Clone this repository on your local machine.
2.  Install Node.js.
3.  Install Google Chrome.
4.  Import the Chrome extension form the `extension_project` folder into your Googel chrome.
5.  Init the Node.js project by runing `npm install` in the folder `node_project`
6.  To start working run the command `npm start MESSION_NAME` where MESSION_NAME is the name of your mession from the `node_project/messions` folder

## Usage

1.  Copy a mession file in the `messions` folder
2.  Run the Node.js program `npm start MESSION_NAME`.
3.  Open a Chat GPT tab in Google Chrome, and click the button in the left Menu `Start ChatGPT API`
4.  The magic will start

## Requirements

-   Node.js
-   Google Chrome

## Contributing

Please feel free to contribute to this project. You can fork the repository, make changes, and submit a pull request.

## Upcoming Features

- **Automation templates for development (Auto files Read/Save)**
- **Logs for review and analysis**
- WebCrawler
- Automated testing and validation of chat responses (Error handling)
- Task scheduling
- ChatGPT API Implementation
- Davinci-3 API Implementation
- Integration with webhooks for external automation triggers
- Support for conditional logic and branching in automation requests
- Support for custom plug-ins and extensions to extend automation capabilities
- Integration with voice assistants
- Auto Model selection (GPT 3.5, GPT 4)

## License

This project is licensed under the MIT License