const passport = require('passport');
//User Model on Mongodb
const User = require('../model/user');
//
const { GraphQLLocalStrategy} = require('graphql-passport');

passport.serializeUser((user,done)=>{
    done(null,user.id);
});

passport.deserializeUser(async(id,done)=>{
    const user = await User.findById(id);
    done(null,user);
});

passport.use(
    new GraphQLLocalStrategy(async (email, password, done) => {
      const user = await User.findOne({email: email}); 
      if(!user) {
          return done(new Error('No User Foud'), false);
      }
      if(!user.comparePassword(password)) {
        return done(new Error('Incorrect Password'), false);
      }
      return done(null, user);
    }),
  );