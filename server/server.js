var socket = require('socket.io');
var express = require('express'), port = 9999;
var _Dots = require('./dots');

var app = express(),
	io = socket.listen(app.listen(port));
	io.set('log level', 1);
	console.log("listen on port " + port);

var clients = [], idClient=0, connCount=0, idLeaveClient=undefined;
var currentGame;

function getClientHandler(curentHandler, id){

	if(id != undefined){
		for(var i=0; i<clients.length; i++)
			if(clients[i].id == id)
				return clients[i];
	} else {
		for(var i=0; i<clients.length; i++)
			if(clients[i].socket == curentHandler)
				return clients[i];	
	}	
			
	return false;
}
function clientCountControl(socket){
	if(connCount > 2) {
		socket.emit("disconnect", JSON.stringify({msg : "Sorry, Server is busy now, u r disconnected, try again later!"}));
		socket.disconnect();
		--connCount;
	}	
}
function dropClient(id){
	for(var i=0; i<clients.length; i++)
		if(clients[i].id == id){
			clients.splice(i, 1);
			break;
		}
		
		if(clients.length > 0)
			idLeaveClient = id;
		else {
			idLeaveClient = undefined;
			idClient = 0;
		}
}
	
io.sockets.on('connection', function(client){
	
	++connCount;
	clientCountControl(client);
	
	idClient = (idLeaveClient == undefined) ? idClient : idLeaveClient;  
	clients.push({id : idClient++, status : 'connected', socket : client});

	client.on('newGame', function(data){
		
		var player1 = getClientHandler(client), player2 = false;
			
		if(player1.status == 'connected'){
		
			for(var i=0; i<clients.length; i++)
				if(clients[i].status == 'waitingForRival'){
					player2 = clients[i];
					break;
				}
					
			if(player1 && player2){
				
				console.log('p1('+getClientHandler(client).id+')&p2('+getClientHandler(client, (getClientHandler(client).id + 1) % 2).id+') connected and ready to start the game');
				
				var tmp = player1;
				player1 = player2;
				player2 = tmp;
				var tmpArr = [player1, player2];
				
				currentGame = new _Dots();
				
				for(var i=0; i<tmpArr.length; i++){
					var data = {verge : currentGame.verge, sqVerge : currentGame.sqVerge, movesLeft : currentGame.leftMoves};
					
					var sendObj = {
						player : {id:tmpArr[i].id, color:currentGame.colors[ tmpArr[i].id ]}, 
						moveNow : 0, 
						data : data, 
						msg : "Игра началсь, удачи!"
					};
					tmpArr[i].socket.emit("startGame", JSON.stringify(sendObj));
					clients[i].status = 'playing';
				}
				
			} else {
						
				getClientHandler(client).status = player1.status ='waitingForRival';
				getClientHandler(client).socket.emit('waitingForRival', JSON.stringify({msg : "Ожидаем соперника..."}));
				console.log('p1 connected the game');
					
			}
			
		}

	});
	
	client.on('sendCoords', function(data){
		
		var data = JSON.parse(data);
		var obj = {
			player:data.player,
			x:data.x, 
			y:data.y, 
			pwned:data.pwned,
		}
		currentGame.pointList.push(obj) ;

		io.sockets.emit('sendField', JSON.stringify({x:data.x, 
													y:data.y, 
													moveColor:currentGame.colors[ getClientHandler(client).id ], 
													field:currentGame.pointList,
													nextMove : (obj.player + 1) % 2}));
	});
	
	client.on('pointSetComplete', function(data){
		
		var data = JSON.parse(data);
		
		for(var i=0; i<currentGame.pointList.length; i++){
			currentGame.PL[ currentGame.pointList[i].x+":"+currentGame.pointList[i].y ] = currentGame.pointList[i];
		}	
		
		currentGame.closedArea(data.x, data.y, data.player, data.x, data.y, currentGame.PL, null, 0, currentGame.curentPoints, true);
		
		if(currentGame.results.dotsInArea > 0){
			sendObj = {
				res : currentGame.results,
				coordinates : currentGame.curentPoints,
				lineColor : currentGame.colors[ getClientHandler(client).id ],
				id : getClientHandler(client).id
			};
			io.sockets.emit('bordersDrawing', JSON.stringify(sendObj));
		}
		currentGame.curentPoints = []; currentGame.results = {};
		
	});
	
	client.on('changeStatus', function(data){
		
		data = JSON.parse(data);
		getClientHandler(client).status = data.status;
		
	});
	
	client.on('disconnect', function(){
		
		clientHandler = getClientHandler(client);
		rivalHandler = getClientHandler(client, (clientHandler.id + 1) % 2);
		console.log("Client " + clientHandler.id + " leave the server!", "connCount", --connCount);
		
		if(clients.length > 1 && clientHandler.status == 'playing'){
			rivalHandler.socket.emit('rivalLeaveThegame', JSON.stringify({msg:"Ваш соперник покинул игру! Вы победили!"}));
			rivalHandler.status = 'connected';
		}
			
		dropClient(clientHandler.id); 
		currentGame = undefined;
	
	});

});

