# cli-chat
A simple command-line chat client and server. For now, this is just an experiment that allows you to send messages between terminal windows on your local machine.

## To install
You'll need [node](https://nodejs.org/) and [npm](https://www.npmjs.com/). After you've got those, clone this puppy down and run `npm install` from the repository root to grab all the dependencies. That's it!

## To Run

### Server

Start this first. From the repo root, in a terminal window, run `node respond.js`. Your chat server will be ready to accept clients when you see the message `Listening for incoming connections...`. Leave this window open.

### Clients

For each client you want to join the chat, open a new terminal window, and in the repo root, run `node respond.js`. You'll be asked for a server to join, just press ENTER to join the default server (ws://locahost:1337), where your server should be listening.

Once you've joined successfully, your client will be assigned a name, and you'll be ready to begin sending and recieving messages. Start typing and press ENTER to send.

#### Slash Commands

The client interface allows each client to perform a limited number of "slash commands" (i.e: messages that begin with a `/`) which perform certain functions, or change the way a message is delivered. Available slash commands are:

##### `/whisper name message`

Whispering allows you to send a specific client (identified by `name`) a private `message`.
