var express = require('express');
var socket = require('socket.io');
var app = express();
var io = socket.listen(app);
io.sockets.on('connection', function(client) {
	console.log('Client connected...');
	client.on('chatmessage', function (data) {
		console.log(data);
	});
});