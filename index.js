const express = require('express');
const app = express();
const serv = require('http').Server(app);


const Max_Rooms=10,Max_players=2,dict="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let Rooms = [];

Rooms.push(new RoomData('defaultRoom'));

function createId(len){
  let id = "";
  for(var i =0; i<len;i++){
    id += dict[parseInt(getRandomInt(0,dict.length))]
  }
  return id;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


function RoomData(name,password=null){
    this.id = createId(5);
    this.player_num = 0;
    this.roomName = name;
    this.password = password;
    this.started = false;
    this.turn = 1; // 1 or 2   X or O
    this.msg = "X";
    this.moves = 0;
    this.board = null;
    this.scores = [0,0];
}

app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT);



app.get('/', (req,res)=>{
  res.sendFile(__dirname + "/client/index.html");
});

const socket = require('socket.io');
const io = socket(serv);


setInterval(()=>{
  io.sockets.in("main").emit('returnRooms', Rooms);
},1500);


function make2DArray(cols,rows){
     arr = new Array(cols);
    for(let i =0;i<arr.length;i++){
       
       arr[i] = new Array(rows);
    
    }
  //Fill with X's
  for(var i =0;i<cols;i++){
    for(var j =0;j<rows;j++){
      arr[i][j] = 0;
    }
  } 
  return arr;
}

function checkGame(squares,moves=null){
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {winner:squares[a],grid:lines[i]};
    }
  }
  if(moves == 9){
    return "Draw";
  }
  return null
}

io.sockets.on('connection', function(socket) {
    console.log("New Connection: " + socket.id);
    socket.join("main");
    //Events
    socket.on('getRooms',()=>{
      io.to(socket.id).emit('returnRooms',Rooms);
    }).on('connectToRoom',(_data)=>{
      let flag = true;
      for(var room of Rooms){
        if(room.id == _data && room.player_num<2){
             flag = false;
             socket.leave("main");
             socket.join(_data);
             room.player_num++;
             let roomdata = {
               id: _data,
               num: room.player_num
             }
             io.to(socket.id).emit('assignPlayerNum', roomdata);
             break;
        }
      }
      if(flag){
        io.to(socket.id).emit('errorHandler',"Too Many Players");
      }  
    }).on('startGame',(id)=>{
        for(var room of Rooms){
          if(room.id == id){
            room.started = true;
            room.board = make2DArray(3,3);
            let data = {
              turn: room.turn,
              board: room.board,
            }
            io.sockets.in(id).emit('startedGame',data);
            break;
          }
        }  
    }).on('playerClick', async (data)=>{
      for(var room of Rooms){
        if(room.id == data.id){
          room.moves++;
          room.board[data.coord.col][data.coord.row] = data.player;
          let squares = getSquares(room.board);
          let finished = await checkGame(squares,room.moves);
          if(finished == null){
            if(room.turn == 1){
            room.turn = 2;
            room.msg = "O"
          }else if(room.turn == 2){
            room.turn = 1;
            room.msg = "X"
          }
          let _data = {
             turn: room.turn,
             board: room.board,
             turnMsg: room.msg
          }
          io.sockets.in(room.id).emit('updateGame',_data);
          }else{
            if(finished.winner == 1){
              room.scores[0] += 1;
            }else if(finished.winner == 2){
              room.scores[1] += 1;
            }
            let _data = {
             board: room.board,
             details: finished,
             scores: room.scores

            }
            io.sockets.in(room.id).emit('endGame',_data);
          }
        }
      }
    }).on('restartGame',(id)=>{
       for(var room of Rooms){
         if(room.id == id){
            room.board = make2DArray(3,3);
            room.turn = 1;
            room.moves = 0;
            room.msg = "X";
            let _data = {
             turn: room.turn,
             board: room.board,
             turnMsg: room.msg
          }
          io.sockets.in(room.id).emit('updateGame',_data);
         }
       }
    }).on('newRoom',(data)=>{
       if(Rooms.length<Max_Rooms){
          Rooms.push(new RoomData(data.Rname,data.Rpas));
          io.sockets.in("main").emit('returnRooms', Rooms);
        }else{
          io.to(socket.id).emit('errorHandler',"Too many Rooms");
        }
    }).on('leaveRoom',(data)=>{
       for(var i =0;i<Rooms.length;i++){
         if(Rooms[i].id == data.id){
           Rooms.splice(i,1);
           io.sockets.in(data.id).emit('roomClosed');
           break;
         }
       }  
    });

});

function getSquares(board){
  let arr = [];
  for(var i =0;i<board.length;i++){
    for(var j=0;j<board[0].length;j++){
      arr.push(board[i][j]);
    }
  }
  return arr;
}