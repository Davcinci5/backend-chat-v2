//NODE MODULES 
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const { buildContext } = require('graphql-passport');
const { ApolloServer } = require('apollo-server-express');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const path = require("path");
const http = require('http');
const socketIO = require("socket.io");
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');


const PORT = 4000;
require('./passport/local-auth');

//conexxion to database
mongoose.connect('mongodb://localhost:27017/userChat');
mongoose.connection.once('open',()=>{console.log('connected to db',{useNewUrlParser: true
  });
})

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const {generateMessage} = require('./utils/message');
const {resolveToken} = require('./token/token');
const User = require('./model/user');
const Message = require('./model/message');



io.on('connection', async(socket)=>{
  //identify user 
  if(!socket.handshake.headers.cookie) return;
  const token = cookie.parse(socket.handshake.headers.cookie)['access_token'];
  if(!token) return;
  const userID = await resolveToken(token);
  const user = await User.findById(userID);
  
  // join to user
  socket.join(user.email); 

  for(let group of user.groups){
    socket.join(group);
  }
 
  socket.on('leave',()=>{
    socket.leave(user.email);
  });

  socket.on('say',async({to,text,from})=>{

    
    try{
    const newMessage = new Message();
    newMessage.sender = user.email;
    newMessage.receiver = to;
    newMessage.date = new Date().getTime();
    newMessage.text = text;
    newMessage.image ="default";

    await newMessage.save();
    }catch(e){
      throw Error(e);
    }
    io.to(to).emit('newMessage', generateMessage(from,text));
    let regex = /@\w+\.com/; 
    let isOneToOne = regex.test(to);
    if(isOneToOne) socket.emit('newMessage', generateMessage(from,text));
  });
  
  socket.on('disconnect',()=>{
        console.log("User left la conversation");
    });

    socket.on('getHistorial',async({from,to},callback)=>{
    try{
    let regex = /@\w+\.com/;
    let isOneToOne = regex.test(to);
    let messages;

    if(isOneToOne){
     messages = await Message.find({
          $or:[
            {$and:[{sender:new RegExp("^"+from+"$")},{receiver:new RegExp("^"+to+"$")}]},
            {$and:[{receiver:new RegExp("^"+from+"$")},{sender:new RegExp("^"+to+"$")}]}
          ]
      })
    }else{
      messages = await Message.find({receiver:new RegExp("^"+to+"$")});   
    }
      
      socket.emit('receiveHistorial',{messages:messages});
      
      }catch(e){
          callback("Error: "+e)
        }
  });

  });



  app.use(cookieParser());
  //initialize passport
  app.use(passport.initialize());
  app.use("/images", express.static(path.join(__dirname, "./images")));

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => buildContext({ req, res }),
  });
  
  apolloServer.applyMiddleware({app});//{ app, corse:false }

server.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});