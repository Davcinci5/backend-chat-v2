const { gql } = require('apollo-server-express');

const typeDefs = gql`

  type User {
    id: ID
    fullName: String 
    birthday: String
    gender: String
    email: String
    password: String
    profileImg:String
    friendsList:[User]
    reqSent:[User]
    reqReceived:[User]
    groups:[Group]
  }

  
  type AuthPayload {
    user: User
  }

  type Query {
    currentUser: User
    groups:[Group]
  }

  type Group {
    id:ID,
    name:String,
    participants:[User]
  }

  type Mutation {
    signup(fullName: String!, birthday: String!, gender: String!, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    logout: Boolean
    uploadFile(file: Upload!): String
    friendRequest(friendID:String!):String
    searchUsers(chain:String!):[User]
    createGroup(name:String!,addedFriends:[String]!):Group
    getDatos:User
  }
`; 

module.exports =typeDefs;