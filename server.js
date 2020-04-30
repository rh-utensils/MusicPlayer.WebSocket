'use strict';

const express = require('express');
const uuid = require('uuid');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
	.use((_, res) => res.sendFile(INDEX, { root: __dirname }))
	.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Create and configure socket.io 
const io = socketIO(server);
//io.origins(['https://music.hampoelz.net']);

var console = {};
console.log = message => {
	var date = new Date;

	var seconds = date.getSeconds();
	var minutes = date.getMinutes();
	var hour = date.getHours();

	io.emit('log', "[" + hour + ":" + minutes + ":" + seconds + "] => " + message + "\n");
};
window.console = console;

// keeping track of connections
var sockets = {};

io.on('connection', (socket) => {
	console.log('Client connected');

	console.log(sockets.toString());
	
	var id;

	// Fetermine an identifier that is unique for us.

	do {
		id = uuid.v4();
	} while (sockets[id]);

	// We have a unique identifier that can be sent to the client

	sockets[id] = socket;
	socket.emit('room-id', id);

	// Remove references to the disconnected socket
	socket.on('disconnect', () => {
		sockets[socket] = undefined;
		delete sockets[socket];

		console.log('Client disconnected')
	});

	// When a message is received forward it to the addressee
	socket.on('message', (message) => {
		if (sockets[message.to]) {
			sockets[message.to].emit('message', message);
		} else {
			socket.emit('disconnected', message.from);
		}
	});

	// When a listener logs on let the media streaming know about it
	socket.on('logon', (message) => {
		if (sockets[message.to]) {
			sockets[message.to].emit('logon', message);
		} else {
			socket.emit('error', 'Does not exsist at server.');
		}
	});

	socket.on('logoff', (message) => {
		if (sockets[message.to]) {
			sockets[message.to].emit('logoff', message);
		} else {
			socket.emit('error', 'Does not exsist at server.');
		}
	});
});
