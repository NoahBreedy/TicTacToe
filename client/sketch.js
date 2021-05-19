const socket = io();

//Socket Events
socket.on('returnRooms',(_data)=>{
  clearRooms();
  renderRooms(_data);
}).on('consoleMsg',(_msg)=>{
  console.log(_msg);
}).on('errorHandler',(_msg)=>{
  alert(_msg);
}).on('assignPlayerNum',(_data)=>{
  waiting = true;
   myRoomId = _data.id;
   document.getElementById("createRoom").style.display = "none";
   document.getElementById("roomContainer").style.display = "none";
   document.getElementById("scores").style.display = "";
   document.getElementById("dcBtn").style.display = "";  
   document.getElementById("canvasContainer").style.display = "";  
   document.getElementById("themeContainer").style.display = "";  
   cnv.show();
   playerNum = _data.num;
   changeTitleMessage("WELCOME TO TIC-TAC-TOE <br><br> Waiting.");
   if(playerNum == 2){
     socket.emit('startGame',myRoomId);
   }

}).on('startedGame',(data)=>{
    playingBoard = data.board;
    turn = data.turn;
    waiting = false;
    if(playerNum == 1){
      changeTitleMessage("WELCOME TO TIC-TAC-TOE <br><br> Your Turn");
    }else{
      changeTitleMessage("WELCOME TO TIC-TAC-TOE <br><br> X's Turn");
    }
}).on('updateGame',(data)=>{
    gameOver = false;
    turn = data.turn;
    playingBoard = data.board;
    if(playerNum == turn){
      changeTitleMessage("WELCOME TO TIC-TAC-TOE <br><br> Your Turn");
    }else{
      changeTitleMessage(`WELCOME TO TIC-TAC-TOE <br><br> ${data.turnMsg}'s Turn`);
    }
}).on('endGame',(data)=>{
   gameOver = true;
   playingBoard = data.board;
   if(data.details.winner == 1){
     changeTitleMessage(`WELCOME TO TIC-TAC-TOE <br><br> Winner is X`);
   }else if(data.details.winner == 2){
     changeTitleMessage(`WELCOME TO TIC-TAC-TOE <br><br> Winner is O`);
   }else{
     changeTitleMessage(`WELCOME TO TIC-TAC-TOE <br><br> Draw`);
   }
   winLine = data.details.grid;
   winner = data.details.winner;
   scores = data.scores;
   document.getElementById("scores").innerHTML = `Xs:${scores[0]} Os:${scores[1]}`;
}).on('roomClosed',()=>{
  alert("Player Has Left Room");
  window.location.reload();
})


socket.emit('getRooms', "give me rooms");
//prevents cheese I really should add a little loading bar but whatever
document.getElementById("themeContainer").style.display = "none";
document.getElementById("createRoom").style.display = "none";

//Graphics
let cnv;
let playerNum = null;
let myRoomId;
let waiting = false;
let turn = 1;
let gameOver = false;
let res = 134;
let playingBoard;
let winLine,winner;
let colors = [255,0,0,0,"#eb3434"];
let scores = [0,0];

function setup(){
  cnv = createCanvas(400, 400);
  cnv.parent('canvasContainer');
  cnv.hide();
}

function draw(){
  background(colors[0]);
  if( waiting || playerNum == null){
      if(frameCount % 60 == 0){
        if(waiting){
          waitingAnim();
        }
      }
  }else{
    drawGame(playingBoard);
  }
  
}


function changeTheme(e){
  switch(parseInt(e.value)){
    case 0: colors = [255,0,0,0,"#eb3434"];break;
    case 1: colors = [0,255,255,255,"#349feb"];break;
    case 2: colors = ["#2c3638",255,"#349feb","#e5ff00","#e673f5"];break;
    case 3: colors = ["#657b83","#859900","#dc322f","#2aa198","#eee8d5"];break;
    case 4: colors = ["#282244","#6153A6","#C1BBDD","#8c39d4","#504489"];break;
    case 5: colors = ["#5C89BA","#A8A9AD","#565D6C","#D8D8D8","#838996"];break;
    case 6: colors = ["#9acd32","#49796b","#009000"," #aaf0d1","#006400"];break;
  } 
}


function mousePressed(){
  if(!waiting && playerNum != null && !gameOver){
    var x = int(mouseX/res);
    var y = int(mouseY/res);
    if(playerNum == turn){
      if(playingBoard[x][y]==0){
      let data = {
        player: playerNum,
        id: myRoomId,
        coord: {col: x,row: y}
      }
      socket.emit('playerClick',data);
    }
      
    }
  } 
}

function drawGame(grid){
  for(var i =0;i<grid.length;i++){
    for(var j =0;j<grid[0].length;j++){
      push();
      noFill();
      stroke(colors[1]);
      strokeWeight(4);
      rect(i*res,j*res,res,res);
      if(gameOver){
        if(winLine != undefined){
          highlightWinner(winLine,winner)
        }
      }
      pop();
      drawMark(grid[i][j],i,j,res);
    }
  }
}

function drawMark(mark,i,j){
  
  if(mark == 1){
    push()
    noFill();
    stroke(colors[2]);
    strokeWeight(10);
    
    line((i*res)+25,(j*res)+25,((i*res)+res)-25,((j*res)+res)-25);
    line((i*res)+(res-25),(j*res)+25,((i*res)+res)-(res-25),((j*res)+res)-25);
    pop()
  }else if(mark == 2){
    push()
    noFill();
    stroke(colors[3]);
    strokeWeight(10);
    circle((i*res)+(res/2),(j*res)+(res/2),(res/2)+25);
    pop()
  }
}

function highlightWinner(winnerSpaces,winner){
   for(var i =0;i<winnerSpaces.length;i++){
     let spot = convert(winnerSpaces[i]);
     push();
     fill(colors[4]);
     rect(spot.x*res,spot.y*res,res,res);
     pop();
     drawMark(winner,spot.x,spot.y)
   }
}

function convert(num){
  switch(num){
    case 0: return {x: 0, y:0}
    case 1: return {x: 0, y:1}
    case 2: return {x: 0, y:2}
    case 3: return {x: 1, y:0}
    case 4: return {x: 1, y:1}
    case 5: return {x: 1, y:2}
    case 6: return {x: 2, y:0}
    case 7: return {x: 2, y:1}
    case 8: return {x: 2, y:2}
  }
}


function keyPressed(){
  if(keyCode == 32 && gameOver && playerNum == 1){
    socket.emit('restartGame',myRoomId);
  }
}

//HelperFunctions
function renderRooms(rooms){
   rooms.forEach(room =>{
    var button = document.createElement('button');
    button.innerHTML = room.roomName  +"<br> players: " + room.player_num;
    button.onclick = function(){
      connectToRoom(room);return false;
    };
    document.getElementById('roomContainer').appendChild(button);
  });
  document.getElementById("createRoom").style.display = "";
  document.getElementById("scores").style.display = "none";
  document.getElementById("dcBtn").style.display = "none";  
  document.getElementById("themeContainer").style.display = "none";  
  changeTitleMessage("WELCOME TO TIC-TAC-TOE");
}

function clearRooms(){
  let roomContainer = document.getElementById("roomContainer");
  while (roomContainer.firstChild) {
      roomContainer.removeChild(roomContainer.lastChild);
  }
  document.getElementById("createRoom").style.display = "none";
}

function connectToRoom(room){
  if(room.password != null){
    let myAttempt = window.prompt("Whats the password?");
    if(myAttempt == room.password){
      socket.emit('connectToRoom',room.id)
    }else{
      alert("Wrong Password!");
    }
  }else{
    socket.emit('connectToRoom',room.id)
  }
}

function createNewRoom(){
  let name = window.prompt("Name Of Room: "); 
  if(name == ""){
    name = null;
  }
  let password = window.prompt("Give Room Password: (type the password if yes)");
  let msg = "Name: " +  name + " Password: " + password;
  if(password==''){
    password = null;
  }
  const data = {
    Rname: name,
    Rpas: password 
  }
  if(name == null){
    alert("Name Cannot be Null!");
  }else{
    socket.emit('newRoom', data);
  }
}

function changeTitleMessage(msg){
  document.getElementById('titleMessage').innerHTML = msg;
}

function waitingAnim(){
  let titleMsg = document.getElementById('titleMessage').innerHTML;
    if(titleMsg.length<42){
      changeTitleMessage(titleMsg+".");
    }else{
      changeTitleMessage("WELCOME TO TIC-TAC-TOE <br><br> Waiting.");
    }
}

function leaveRoom(fromWindow= false){
  document.getElementById("dcBtn").style.display = "none";  
  document.getElementById("canvasContainer").style.display = "none";  
  overRide = fromWindow;
  let data  ={
    id: myRoomId,
    oR: overRide
  }
  socket.emit('leaveRoom', data);
}