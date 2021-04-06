const mysql = require('mysql2/promise');
const secret = require('../config');
const MESSAGE_LIMIT = 20;
// singleton connection


let connection = null;


module.exports.getAllMessages = async function(ws){
    let conn = await mysql.createConnection(secret.dbconfig);
    let [share_result] = await conn.query("SELECT users.name as name, messages.text as text, users.textColor as textColor, users.loginColor as loginColor FROM messages INNER JOIN users ON messages.user = users.id ORDER BY messages.date DESC LIMIT 20");
    conn.end();
    ws.send(JSON.stringify({statusCode: "get_all_messages",messages: share_result}));
}


// async function getAmountOfMessages(){
//     let [share_message] = await connection.query("SELECT COUNT(*) AS messageСount FROM messages");
//     return share_message[0].messageСount;
// }

// async function deleteLastMessage(){
//     try{
//         let [share_result] = await connection.query("DELETE FROM messages ORDER BY date ASC LIMIT 1");
//         console.log('Delete was successful');
//         return share_result;
//     }catch(err){
//         console.log("Error: " + err);
//     }
// }


module.exports.sendMessage = async function(message,user,wss){
    connection = await mysql.createConnection(secret.dbconfig);
    
    // let messageCount = await getAmountOfMessages();
    // console.log("Message count: " + messageCount);
    // if(messageCount >= MESSAGE_LIMIT){
    //    await deleteLastMessage();
    // }

    const [lastMessageTime] = await connection.query("SELECT date FROM messages WHERE user = ? ORDER BY date DESC LIMIT 1",[user.id]);
    const currentTime = new Date();
    
    if(lastMessageTime[0]){
        let timeOffset = parseFloat((currentTime - lastMessageTime[0].date)/1000);
        if(timeOffset < 15) return '';
    }

    try{
        await connection.query("INSERT INTO messages(user, text, date) VALUES(?,?,?)",[user.id, message, new Date()]);
    }catch(err){
        console.error(`Err: ${err}`);
    }

    wss.clients.forEach((client)=>{
        client.send(JSON.stringify({statusCode: "send_message", message: {
            text: message,
            name: user.name,
            textColor: user.textColor,
            loginColor: user.loginColor,
        }}));
    });

    connection.end();
}
