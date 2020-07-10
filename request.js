// Socket requester class. Each instance initializes a single connection wtih a WebSocket server.
class SocketRequester {
    constructor(url, protocol) {

        // Initialize the client and bind the connection event.
        this.client = new (require('websocket').client)();
        this.client.on('connect', this.open.bind(this));
        this.client.on('connectionfailure', this.failOut.bind(this));

        // Initialize the terminal interface for user interaction.
        this.readline = require('readline');
        this.input = this.readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        // Allow the user to specify a URL interactively, if needed.
        if (!url) {
            this.input.question("What WebSocket server would you like to connect to [Default: ws://localhost:1337]?\n> ", (answer) => {
                url = answer.length && answer || 'ws://localhost:1337';
                this.connect(url, protocol);
            });
            return;
        }
        // Otherwise, connect with the URL provided in the constructor.
        this.connect(url, protocol);
    }

    connect(url, protocol) {
        try {
            // Open the connection.
            this.client.connect(url, protocol);
        } catch (e) {
            this.failOut();
        }
    }

    open(connection) {
        // Attach the connection object, and bind socket events.
        this.connection = connection;
        this.connection.on('message', this.receive.bind(this));
        this.connection.on('close', this.close.bind(this));

        // Log that the connectio was opened.
        console.log(`Opened WebSocket connection to responder at ${this.client.url.href}. Listening for user input...`);
        this.listenForInput();
    }

    listenForInput() {
        // User input loop. Read user input from stdin.
        this.input.question("> ", (answer) => {
            // On input, clear the prompt, and send the message, if present.
            this.readline.moveCursor(process.stdout, 0, -1);
            if (answer.length) {
                this.send(answer);
                return;
            }
            // Continue listening.
            this.listenForInput();
        });
    }

    interruptInput(message) {
        // Interrupt the input listener loop to update message output.
        // Ensuring that the input prompt continues to apear at the bottom
        // of the terminal.
        this.readline.cursorTo(process.stdout, 0);
        this.readline.clearLine(process.stdout);
        console.log.apply(null, [].slice.call(arguments));
        this.listenForInput();
    }

    send(message) {

        if (message.trim().indexOf('/') === 0) {
            let split = message.split(/ +/),
                command = split[0];
            switch (command) {
                case '/whisper':
                    let to = split[1],
                        whisper = split.slice(2).join(' ');
                    if (whisper.length) {
                        this.connection.send(message);
                        // Log our sent message for the client.
                        this.interruptInput(chalk.redBright(`You: (to ${to}):`), whisper);
                    }
                    break;
                default:
                    this.interruptInput(chalk.red(`Error: Unrecognized slash command: ${command}.`));
                    return;
            }
        }
        else {
            this.connection.send(message);
            // Log our sent message for the client.
            this.interruptInput(chalk.redBright('You:'), message);
        }
    }

    receive(event) {
        // Determine whether or not we're receiving a textual message.
        // If so, just log the text.
        let message = event,
            source = chalk.blue(`responder at ${this.client.url.href}:`);
        if (event.type === 'utf8') {
            try {
                let parsed = JSON.parse(event.utf8Data);
                if (parsed.message) {
                    message = parsed.message;
                }
                if (parsed.source) {
                    if (parsed.whisper) {
                        parsed.source += ' (to you)'
                    }
                    source = `${chalk.blueBright(parsed.source)}:`;
                }
                if (parsed.type && ['enter', 'exit'].includes(parsed.type)) {
                    source = `${chalk.white(parsed.source)}`;
                    message = `${chalk.gray(`has ${parsed.type}ed the chat.`)}`;
                }
                if (parsed.type && parsed.type === 'error') {
                    source = chalk.red('Error:');
                    message = chalk.red(message);
                }
            } catch (e) {
                message = event.utf8Data
            }
        }
        
        // Log the message we received.
        this.interruptInput(source, message);
    }

    close() {
        // Stop listening for user input and close the terminal.
        this.readline.cursorTo(process.stdout, 0);
        this.readline.clearLine(process.stdout);
        this.input.close();
        // Log that the connection was closed.
        console.log(`Closed WebSocket connection to responder at ${this.client.url.href}.`);
    }

    failOut() {
        // Stop listening for user input and close the terminal.
        this.readline.cursorTo(process.stdout, 0);
        this.readline.clearLine(process.stdout);
        this.input.close();

        if (this.client.url) {
            // Log that the connection was failed.
            console.log(`Failed to connect to WebSocket server at ${this.client.url.href}. Please make sure it's online.`);
            return;
        }
        console.log('No valid server URL specified. Please try again.');
    }
}

// Pretty colors
let chalk = require('chalk');

// Initialize a new requester object.
new SocketRequester();