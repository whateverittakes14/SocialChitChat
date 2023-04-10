const path = require('path')
const http = require('http')
const badword = require("bad-words");
const express = require('express')
const socketio  = require('socket.io')
const messages = require("./utils/messages.js")
const generateMessage = messages.generateMessage;
const app = express();
 const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')
const server = http.createServer(app)
const io = socketio(server)

const Public_dir = path.join(__dirname,"../public");

app.use(express.static(Public_dir));
io.on('connection', (socket)=>{
     console.log("New socketio connection")
    socket.on('join',(options,callback)=>{
      const {error ,user} =addUser({id:socket.id,...options})
      if(error){
        return callback(error)
      }
       socket.join(user.room)
       socket.emit("message",generateMessage("admin","Welcome to our app"))
       socket.broadcast.to(user.room).emit('message',generateMessage(user.username,`${user.username} has joined! `))
       io.to(user.room).emit('roomData',{
         room :user.room,
         users:getUsersInRoom(user.room)
       })
       callback()
     })
     socket.on('sendMessage',(message,callback)=>{
      const filter = new badword();
      const user = getUser(socket.id);
      if(filter.isProfane(message)){
        return callback("No profanity allowed")
      }
      io.to(user.room).emit('message',generateMessage(user.username,message))
      callback();
      })
      socket.on('sendLocation',(location,cb)=>{
        const user = getUser(socket.id) ;
        const url = `https://google.com/maps?q=${location.latitude},${location.longitude}`
        io.to(user.room).emit('locationmessage',generateMessage(user.username,url))
        cb();
      })

      socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
          io.to(user.room).emit('message',generateMessage(`${user.username} has left`))
          io.to(user.room).emit('roomData',{
            room :user.room,
            users:getUsersInRoom(user.room)
          })
        }
      })

})
server.listen("3000",()=>{
  console.log("server is started")
})