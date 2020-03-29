const moment = require('moment');

const generateMessage = (from,to, text) => {
    return {
        from,
        to,    
        text,    
        createdAt: moment().valueOf()  
    }; 
};

module.exports = {generateMessage};
