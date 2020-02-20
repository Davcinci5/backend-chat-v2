const mongoose = require('mongoose');
const { Schema } = mongoose;

const conversationSchema = new Schema({
        sender:String,
        receiver:String,
        date:Date,
        text:String,
        image:String
});


module.exports = mongoose.model('conversation',conversationSchema);
