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


const PORT = process.env.PORT || 4000;
require('./passport/local-auth');

const start = ()=>{
  const app = express();
  const server = http.createServer(app);
  const io = socketIO(server);

  const {generateMessage} = require('./utils/message');
  const {resolveToken} = require('./token/token');
  const User = require('./model/user');
  const Group = require('./model/group');
  const Message = require('./model/message');



  io.on('connection', async(socket)=>{
    //identify user 
    if(!socket.handshake.headers.cookie) return;
    const token = cookie.parse(socket.handshake.headers.cookie)['access_token'];
    if(!token) return;
    const userID = await resolveToken(token);
    const user = await User.findById(userID);
    socket.join(user.email); 

    for(let group of user.groups){    
      socket.join(group);
    }
  ///
  socket.on("joinGroup",({id})=>{
    socket.join(id);
  });

  socket.on('newGroup',async({to})=>{
  //  console.log(to);
   socket.join(to.id);
   for(let p of to.participants){    
    let participant = await User.findById(p.id);
    if(p.id !== userID){      
      socket.broadcast.to(participant.email).emit('receiveNewGroup', {newGroup:to});
       //console.log(participant.email);
    }
  }
  });

  ////
  socket.on('reqSent',async({to})=>{
    //console.log("entro a req sent ",to);
    
    socket.broadcast.to(to.email).emit('reqReceived',{id:userID,fullName:user.fullName,email:user.email});
  })

  ///

  socket.on('reqAccepted',async({to})=>{
   // console.log("req ",to);
    socket.broadcast.to(to.email).emit('newFriend',{id:userID,fullName:user.fullName,email:user.email});
  })
  ////
    socket.on('leave',()=>{
      socket.leave(user.email);
      for(let group of user.groups){    
        socket.leave(group);
      }
    });

    socket.on('say',async({from, text, to })=>{
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
     // console.log("before to use emit, to variable value is changed", to)
     // console.log("How soxket rooms ",socket.rooms);
      
      //socket.broadcast.to(to).emit('newMessage', generateMessage(from,to,text))
      io.to(to).emit('newMessage', generateMessage(from,to,text));
      let regex = /@\w+\.com/; 
      let isOneToOne = regex.test(to);
      if(isOneToOne) socket.emit('newMessage', generateMessage(from,to,text));
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
///

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
    console.log(`🚀 Server ready at http://mongo:${PORT}`);
  });


}

//conexxion to database
mongoose.connect('mongodb://localhost:27017/userChat').then(start)
mongoose.connection.once('open',()=>{console.log('connected to db',{useNewUrlParser: true
  });
})
// Retry connection
const connectWithRetry = () => {
  console.log('MongoDB connection with retry')
  return mongoose.connect('mongodb://localhost:27017/userChat').then(start);
}

// Exit application on error
mongoose.connection.on('error', err => {
  console.log(`MongoDB connection error: ${err}`)
  setTimeout(connectWithRetry, 5000)
  // process.exit(-1)
})

