const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const { Schema } = mongoose;

const userSchema = new Schema({
    fullName: String,
    birthday: String,
    gender: String,
    email:String,
    password: String,
    profileImg: String,
    friendsList:[String],
    reqSent:[String],
    reqReceived:[String],
    groups:[String] 
});

userSchema.methods.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  };
  
  userSchema.methods.comparePassword= function (password) {
    return bcrypt.compareSync(password, this.password);
  };

  userSchema.methods.deleteFromReqSent = async function(index){
    let indexU = this.reqSent.splice(index,1)[0];
    try{
      await this.save();
      return indexU;
    }catch(e){
      return false;
    }
  };

  userSchema.methods.deleteFromReqRec = async function(index){
    let indexU = this.reqReceived.splice(index,1)[0];
    try{
      await this.save();
      return indexU;
    }catch(e){
      return false;
    }
  };

  userSchema.methods.addToFriendList = async function(newFriendIDAdded){
    try{
      this.friendsList.push(newFriendIDAdded);
      await this.save();
      return true;
    }catch(e){
      return false;
    }
  };

  userSchema.methods.deleteFromFriend = async function(index){
    let indexU = this.friendsList.splice(index,1)[0];
    try{
      await this.save();
      return indexU;
    }catch(e){
      return false;
    }
  };

  userSchema.methods.addToReqSent = async function(index){
    this.reqSent.push(index);
    try{
      await this.save();
      return true;
    }catch(e){
      return false;
    }
  };

  userSchema.methods.addToReqRec = async function(index){
    this.reqReceived.push(index);
    try{
      await this.save();
      return true;
    }catch(e){
      return false;
    }
  };
  
  

module.exports = mongoose.model('user',userSchema);