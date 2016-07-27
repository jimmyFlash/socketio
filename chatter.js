var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require("redis");

var client = redis.createClient();



/* helper method to store data */
var storeMsgs = function (name, data){
	var messages = JSON.stringify({name:name, data:data});

	client.lpush("event", messages , function(error, reply ){

		client.ltrim("event", 0, 10);

	});
}


 
var currentConnections = {};
var userDate = {};
var userCount = 0;

 app.use(express.static(__dirname + '/'));
app.get("/", function(req, res){
/* serve the index.html page on connection to the host and port  */
  res.sendFile(__dirname + '/index.html');

});

/* listent to connection from host */
io.sockets.on("connection", function(socket){

	var s = socket;
	currentConnections[socket.id] = {socket: socket};
/*
	client.del("event", function(err, o) {
		console.log(o);
	});
*/
var hostoryArry = [];
	client.lrange("event", 0 , 10, function (error, messages){

			
			/* to display messages in the recent to oldest order*/
			messages = messages.reverse();
			//console.log(" messages array " + messages.length);
			 messages.forEach(function (message){
			 	var jsnMsg = JSON.parse(message); 
			 	/*console.log("stored mesage : " + jsnMsg.name + "," + jsnMsg.data);*/
				   /*io.emit('history', jsnMsg); */

				  hostoryArry.push(jsnMsg);
			});  

		});


	io.emit('listOnline',  {usersObj : userDate} );

	socket.on('join', function(name) {

		/* check if the nickname already exists in list of user */


	
/*
		var dupNick = validatenickNames(name);

		console.log("duplicate found " + dupNick);

		if(dupNick == true){


		   io.emit('list',  name );

		   console.log("emitting error event  ------------");


			return ;


		}
	*/	

	
	
		userCount++;

		currentConnections[socket.id].username = name;


		userDate[socket.id] = {user: name, id : userCount, sockID: socket.id};
		
		var size = Object.keys(userDate).length;

		console.log(" joined users " + size + "," + userCount);

		 
		  io.emit('history',  hostoryArry);   


		 hostoryArry = [];
		 
		var userObj = {user : "New user joined chat .......", name : name};

		io.emit('user', {user : userObj.user, name : userObj.name , usersObj : userDate});


		storeMsgs ("eve", (userObj.user + userObj.name) );


	});

	/*socket.broadcast.emit('user', {user : "New user joined chat .......", name : ""} );*/
	/*io.emit('user', {user : "New user joined chat .......", name : ""});*/

	socket.on("message", function(msg){
		 
		io.emit('message', currentConnections[socket.id].username + ": " + msg);

		storeMsgs ("msg", msg );

	});


	socket.on('disconnect', function(){
			if(currentConnections[socket.id].username != undefined){

				  s.broadcast.emit('out', {user:currentConnections[socket.id].username});

				 storeMsgs ("eve", currentConnections[socket.id].username + " has left");

				 /*io.emit('out', currentConnections[socket.id].username + " left.");*/
				  console.log("disconnect socket id: " + socket.id + "," + currentConnections[socket.id].username);
				  delete currentConnections[socket.id];
				  delete userDate[socket.id];
				  userCount--;
				  console.log("number of active users " + userCount);
				  io.emit('leave', {usersObj : userDate});
			}
		 
		 /*s.broadcast.emit('out', 'User left');*/
	});
});


function validatenickNames(nickname){
	

	for (var key in currentConnections){
				
		if (currentConnections.hasOwnProperty(key)) {
			//console.log("key(socketid) : " + key + " -> key value: " + currentConnections[key]);
			 var usernameJoined = currentConnections[key]["username"];
			// console.log("the user name joined: " + usernameJoined);
			 
			 /* all data stored in the sub key */
			 for (var key2 in currentConnections[key]){
				 if (currentConnections[key].hasOwnProperty(key2)) {

					// console.log("embbeded key value : "  + key2 + " -> sub key: " + currentConnections[key][key2]);

					 if(currentConnections[key][key2] === nickname){
					 	 return true;
					 }
				 }
			 }
			
		 }
	 }

	return  false;

}


// exception class function 
function DuplicateValueException(name ){
		
	 this.value = name;
	 this.message = "DuplicateValueException";

}

http.listen(3000, function(){
  console.log('listening on *:3000');
});


