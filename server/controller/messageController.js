const userService = require('../services/userService');
const allUsersController = require('./allUsersController');
const User = require('../services/userService');


module.exports.onClose = (wss,clients, id) =>{
    clients.delete(id);
    allUsersController.sendToAll({statusCode:"find_new_users"},wss);
}

module.exports.onError = (err) => {
    console.error(err);
}

module.exports.onMessage = async (message, wss, clients, user) => {
    const userConnection = clients.get(user.id).ws; // ошибка
    const objectInfo = JSON.parse(message);

    switch(objectInfo.statusCode){     
        case "send_message":{
            const answerObj = await User.sendMessage(objectInfo.message,user);

            if(answerObj.statusCode === 'invalid_user') {
                return;
            }

            if(answerObj.statusCode === 'send_message'){
                return allUsersController.sendToAll(answerObj, wss); // Придумать как прокидывать wss (или просто передавать в onMessage)
            }

            break;
        }
        case "get_all_messages":{
            const answerObj = await User.getAllMessages();
            return userConnection.send(JSON.stringify(answerObj));
            
            break;
        }
        case 'ban': {
            const answerObj = await User.banUser(objectInfo.banUserId, user, clients);
            
            if(answerObj.statusCode === 'invalid_user'){
                return userConnection.close(1013);
            }

            if(answerObj.banUserConnection){
                answerObj.banUserConnection.close(1013);
            }

            return allUsersController.sendToAll(answerObj,wss);
            break;
        }
        case 'mute':{
            const answerObj = await User.muteUser(objectInfo.muteUserId, user, clients);
            console.log(answerObj);
            if(answerObj.statusCode === 'invalid_user'){
                return userConnection.close(1013);
            }

            if(answerObj.muteUserConnection){
                answerObj.muteUserConnection.send(JSON.stringify({statusCode:"mute"}));
            }
            console.log("TUTAA");   
            return userConnection.send(JSON.stringify(answerObj));
            break;
        }
        case "get_all_users":{
            const answerObj = await User.getAllUsers(user,clients);
            return userConnection.send(JSON.stringify(answerObj));
            break;
        }
        case "user_exit":
            return userConnection.close(1013);
            break;
        default:
            break;
    }

}