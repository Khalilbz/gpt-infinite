# Documentation for Creating a Custom ChatGPT Template

To create a custom ChatGPT template, follow these steps:

- Create a new file inside the folder templates to hold the template logic. For this example, we will use customTemplate.js.

Define the story content as a string.

Define the message format for requesting chapter titles. This should be a string that the user will send to request the chapter titles.

Define the message format for receiving chapter titles. This should be a regular expression that matches the format of the chapter titles.

Define the sendFirstMessage function to send the initial message to ChatGPT. This function takes a socket parameter, which is the WebSocket connection to ChatGPT.

Define the handleIncomingMessage function to handle incoming messages from ChatGPT. This function takes a socket parameter, which is the WebSocket connection to ChatGPT, and a message parameter, which is the message received from ChatGPT.

Export the sendFirstMessage and handleIncomingMessage functions as an object.

In the main Node.js file, import the sendFirstMessage and handleIncomingMessage functions from your custom template file.

Modify the server.on('connection') event listener to use your custom template functions.