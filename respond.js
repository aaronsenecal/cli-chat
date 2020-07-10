// Socket Respodner class. Each instance manages a WebSocket connection with a single client.
class SocketResponder {

    constructor(connection, name) {

        // Attach the connection object.
        this.connection = connection;

        // Increase the active and total connections counters,
        // and assign a name to this connection.
        activeConnections++
        this.name = name || `client#${++totalConnections}`;

        // Respond to the connection opening.
        this.open();
    }

    open() {
        // Log that we opened the connection.
        console.log(`Connection to ${this.name} opened. (Active Connections: ${activeConnections}, Total Connections: ${totalConnections})`);

        // Bind some responses to socket events:
        this.connection.on('message', this.respond.bind(this));
        this.connection.on('close', this.close.bind(this));

        // Send a greeting to the client.
        this.send(`Hello there! You are ${this.name}.`);

        // Tell everyone else that we're here.
        this.broadcast({type: 'enter'});
    }

    send(message) {
        const serialized = typeof message === 'string' ? message :JSON.stringify(message);

        // Send the message to the socket.
        this.connection.send(serialized);

        // Log that we sent the message.
        console.log(`Message sent to ${this.name}:`, message);
    }

    broadcast(message, excludeSource) {
        message.source = message.source || this.name;
        Object.keys(responders).map((name) => {
            const responder = responders[name];
            (!excludeSource || name !== message.source) && responder.send(message);
        });
    }

    respond(event) {
        // Log that we received the message.
        console.log(`Message received from: ${this.name}`, (event.type === 'utf8' ? event.utf8Data : event));

        // Send a message in response.
        if (event.type === 'utf8') {
            let message = event.utf8Data;
            if (message.trim().indexOf('/') === 0) {
                let split = message.split(/ +/),
                    command = split[0];
                switch (command) {
                    case '/whisper':
                        let to = split[1],
                            whisper = split.slice(2).join(' ');
                        if (whisper.length && responders[to]) {
                            responders[to].send({type: 'message', message: whisper, source: this.name, whisper: true});
                        }
                        else if (!responders[to]) {
                            this.send({type: 'error', message: `User ${to} is not online!`});
                        }
                        break;
                    default:
                        this.send({type: 'error', message: `Unrecognized slash command: ${command}.`});
                }
            }
            else {
                this.broadcast({type: 'message', message}, true);
            }
        }
    }

    close(event) {

        // Log that we closed the connection.
        console.log(`Connection to ${this.name} closed. (Active Connections: ${activeConnections}, Total Connections: ${totalConnections})`);
        
        // Tell everyone else that we're leaving.
        this.broadcast({type: 'exit'}, true);

        // Unsubscribe from the list of active respodners.
        delete responders[this.name];
    }
}

// Set up the HTTP and WebSocket servers and environment variables.
let httpServer = require('http').createServer((req, resp) => {}),
    socketServer = new (require('websocket').server)({httpServer}),
    activeConnections = 0,
    totalConnections = 0,
    responders = {};

// Tell the HTTP server to start listening on port 1337.
httpServer.listen('1337', () => {});

// Initialize a new SocketResponder for each incoming WebSocket request.
socketServer.on('request', (request) => {
    const name = `client#${++totalConnections}`;
    responders[name] = new SocketResponder(request.accept(null, request.origin), name);
});

// Log that we're listening for connections.
console.log('Listening for incoming connections...');
