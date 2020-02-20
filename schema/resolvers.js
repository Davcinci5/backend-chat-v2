
const { createWriteStream } = require("fs");
const path = require("path");
const User = require('../model/user');
const Group = require('../model/group');
const { createToken, resolveToken, clearCookie } = require('./../token/token');
const {cancelRequest,addFriend,deleteFriend,sentReq} = require('../utils/requests')




const resolvers = {
  Group:{
    participants(group){
      return group.participants.map(id =>User.findById(id));
    }
  },
  User:{
    friendsList(user){
      return user.friendsList.map(id => User.findById(id));
    },
    reqSent(user){
      return user.reqSent.map(id => User.findById(id));
    },
    reqReceived(user){
      return user.reqReceived.map(id => User.findById(id));
    },

    groups(user){
      return user.groups.map(id => Group.findById(id));
    }
  },
  Query: {
    groups:async(parent, args, context)=>{

      return await Group.find({});
    },
    currentUser: async (parent, args, context) =>{ 
      if(context.user) return context.user;
      try{
        let usrID = await resolveToken(context.req.cookies["access_token"],context);
        return await User.findById(usrID); 
      }catch(e){
        //throw new Error(e);
        clearCookie(context)
        //context.res.clearCookie('access_token',{httpOnly:true});
      }
    }
  },
  Mutation: {
    createGroup:async(parent,{name,addedFriends},context) => {
      try{
        const userID = await resolveToken(context.req.cookies["access_token"]);
        addedFriends.push(userID);
        const newGroup = new Group();
        newGroup.name = name,
        newGroup.participants = addedFriends,
        newGroup.date = new Date().getTime();
        await newGroup.save();
        addedFriends.forEach(async(friendID) =>{
          let participant = await User.findById(friendID);
          participant.groups.push(newGroup.id);
          await participant.save();
        });
        return newGroup;
      }catch(e){
        throw Error(e);
      }
    },
    searchUsers: async(parent,{chain},context) =>{
      if(chain === "") return [];
      //let {email} = await resolveToken(context); 
      try{
      let token = context.req.cookies["access_token"];
      let userID = await resolveToken(token); 
       let user = await User.find(
       {
         $and:[
           {$or:[{fullName: new RegExp(chain,'i')},
                    {email:new RegExp(chain+'@','i')}
                ]
           },
           {_id:{$ne:userID}}
             ]
       }
       );   
       return user;
     }catch(e){
       throw new Error(e)
     }
       
   },
    friendRequest:async (parent,{friendID},context)=>{
      try{
      let userID = await resolveToken(context.req.cookies["access_token"]),
          user = await User.findById(userID),
          friend =  await User.findById(friendID);

      let indexFriendInUserSent = user.reqSent.indexOf(friendID);
          if(indexFriendInUserSent!==-1){
             await cancelRequest(user,friend,indexFriendInUserSent,userID);
             return "Sent Request";
          }

      let indexFriendInUserReceived = user.reqReceived.indexOf(friendID);
          if(indexFriendInUserReceived!==-1){
            await addFriend(user,friend,indexFriendInUserReceived,userID);
            return "Delete Friend";
          }

      let indexFriendInUserFriends =  user.friendsList.indexOf(friendID);
          if(indexFriendInUserFriends!==-1){
            await deleteFriend(user,friend,indexFriendInUserFriends,userID)
            return "Sent Request";
          }

          await sentReq(user,friend,userID,friendID);
          return "Cancel Request";

      }catch(e){
        return false;
      }


    },
    signup: async (parent, { fullName, birthday, gender, email, password }, context) => {
      const existingUsers = await User.findOne({email});

      if (existingUsers) {
        //return {error:'User with email already exists'};
        return new Error('User with email already exists');
      }

      const newUser = new User();
      newUser.fullName = fullName;
      newUser.birthday = birthday;
      newUser.gender = gender;
      newUser.email = email;
      newUser.password = newUser.encryptPassword(password);
      newUser.profileImg = "default.jpg";
      newUser.friendsList = [];
      newUser.reqSent = [] ;
      newUser.reqReceived = [];
      newUser.groups =[];
      await newUser.save();
      
      
      context.login(newUser);
      
      return { user: newUser };
    },
    login: async (parent, { email, password }, context) => {
      const { user } = await context.authenticate('graphql-local', { email, password });
      context.login(user);
        const token = createToken(user._id);
        //sending the token into a cookie
        context.res.cookie('access_token',token,{expires:new Date(Date.now() + 8 * 3600000),httpOnly:true});  
        return { user}
    },
    logout: (parent, args, context) =>{
            context.logout();
            clearCookie(context);
            //context.res.clearCookie('access_token',{httpOnly:true});
       },
    uploadFile: async (_, { file },context) => {
        const { createReadStream, filename } = await file;
  
        await new Promise(res =>
          createReadStream()
            .pipe(createWriteStream(path.join(__dirname, "../images", filename)))
            .on("close", res)
        );
            let userIDByToken = await resolveToken(context.req.cookies["access_token"]);
                userID = await User.findById(userIDByToken);
                userID.profileImg = filename;
          await userID.save();
            return filename;
    },
  },
};
  
 module.exports = resolvers;

 