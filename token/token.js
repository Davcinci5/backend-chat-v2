const jwt = require('jsonwebtoken');

const options = { expiresIn: '30m'}; 
const secret = "forthemoment"; 

const resolveToken = async (token)=>{
  if(token){
      try{
        //verify makes sure that the token hasn't expired and has been issued by us
        let {user} = jwt.verify(token,secret,options);
        return user;
        //await User.findById(user);       
    }catch(err){
        //Throw new Error(err);
       return null;
        }
      }
  }

  const createToken = (id) => {
      //Create a token
      const payload = { user:id }; //user._id
      //const options = { expiresIn: '30m'};
      const token = jwt.sign(payload,secret,options);
      return token;
  }

  const clearCookie = context =>{
    context.res.clearCookie('access_token',{httpOnly:true});
  }

  module.exports ={createToken,resolveToken,clearCookie};