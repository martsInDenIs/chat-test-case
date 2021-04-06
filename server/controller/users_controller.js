const mysql = require('mysql2/promise');
const secret = require('../config');

// TODO mysql in the separate module

// TODO input sanitize

module.exports.banUser = async function(banUserId,clients,allWss){
    const connection = await mysql.createConnection(secret.dbconfig);
    try{
        await connection.query("UPDATE users SET ban = !ban WHERE id = ? ", [banUserId]);
        const user = clients.get(parseInt(banUserId));
        if(user){
            clients.delete(banUserId);
            user.ws.close(1013);
        }
        console.log("Ban successful");
        
        allWss.clients.forEach((ws)=>ws.send(JSON.stringify({statusCode: "find_new_users"})));
    }catch(err){
        console.error(err);
    }
    connection.end();
};

module.exports.muteUser = async function(muteUserId,clients, adminWs){
    let connection = await mysql.createConnection(secret.dbconfig);
    try{
        await connection.query("UPDATE users SET mute = !mute WHERE id = ?",[muteUserId]);
        const userInfo = clients.get(parseInt(muteUserId));

        if(userInfo){
            userInfo.user.mute  = !userInfo.user.mute;
            userInfo.ws.send(JSON.stringify({statusCode: "mute"}));
        }
        console.log("Mute successful");

        adminWs.send(JSON.stringify({statusCode: 'find_new_users'}));
        
    }catch(err){
        console.error(err);
    }


    connection.end();
}


module.exports.getAllUsers = async function(user, ws, usersOnLine){
    let connection = await mysql.createConnection(secret.dbconfig);
    try{
        const [share_result] = await connection.query("SELECT id, name, mute, ban FROM users WHERE id <> ?", [user.id]);
        console.log(usersOnLine);
        ws.send(JSON.stringify({statusCode: "get_all_users", allUsers: share_result, usersOnLine: usersOnLine}));
    }catch(err){
        console.error(err);
    }
    connection.end();
}