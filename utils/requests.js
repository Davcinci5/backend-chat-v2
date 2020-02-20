const cancelRequest = async(user,friend,indexFriendInUserSent,userID) =>{
    await user.deleteFromReqSent(indexFriendInUserSent);
    let indexUserInFriendReceveid = friend.reqReceived.indexOf(userID)
    await friend.deleteFromReqRec(indexUserInFriendReceveid);
}

const addFriend = async(user,friend,indexFriendInUserReceived,userID) =>{
    let newFriendIDAdded = await user.deleteFromReqRec(indexFriendInUserReceived);
    await user.addToFriendList(newFriendIDAdded);
    let indexUserInFriendSent = friend.reqSent.indexOf(userID),
        userAddedToFriendList = await friend.deleteFromReqSent(indexUserInFriendSent);
    await friend.addToFriendList(userAddedToFriendList);
};

const deleteFriend = async(user,friend,indexFriendInUserFriends,userID) =>{
    await user.deleteFromFriend(indexFriendInUserFriends);
    let indexUserInFriendFriends = friend.friendsList.indexOf(userID);
    await friend.deleteFromFriend(indexUserInFriendFriends);
}

const sentReq = async(user,friend,userID,friendID) =>{
    await user.addToReqSent(friendID);
    await friend.addToReqRec(userID);
}

module.exports = {cancelRequest,addFriend,deleteFriend,sentReq};  