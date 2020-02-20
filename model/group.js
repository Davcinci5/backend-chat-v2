const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupSchema = new Schema({
    name:String,
    participants:[String],
    date:Date
});

module.exports = mongoose.model('group',groupSchema);