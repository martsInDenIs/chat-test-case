const mysql = require('mysql2/promise');
const secret = require('../config');
const MESSAGE_LIMIT = 20;
// singleton connection


let connection = null;


module.exports.getAllMessages = async function(ws){
    let conn = await mysql.createConnection(secret.dbconfig);
    let [share_result] = await conn.query("SELECT users.name as name, messages.text as text, users.text_color as text_color, users.login_color as login_color FROM messages INNER JOIN users ON messages.user = users.id ORDER BY messages.date LIMIT 20");
    conn.end();
    ws.send(JSON.stringify({statusCode: "get_all_messages",messages: share_result}));
}


async function getAmountOfMessages(){
    let [share_message] = await connection.query("SELECT COUNT(*) AS messageСount FROM messages");
    return share_message[0].messageСount;
}

async function deleteLastMessage(){
    try{
        let [share_result] = await connection.query("DELETE FROM messages ORDER BY date ASC LIMIT 1");
        console.log('Delete was successful');
        return share_result;
    }catch(err){
        console.log("Error: " + err);
    }
}


module.exports.sendMessage = async function(message,user,wss){
    connection = await mysql.createConnection(secret.dbconfig);
    // let messageCount = await getAmountOfMessages();
    // console.log("Message count: " + messageCount);
    // if(messageCount >= MESSAGE_LIMIT){
    //    await deleteLastMessage();
    // }

    try{
        await connection.query("INSERT INTO messages(user, text, date) VALUES(?,?,?)",[user.id, message, new Date()]);
    }catch(err){
        console.error(`Err: ${err}`);
    }

    wss.clients.forEach((client)=>{
        client.send(JSON.stringify({statusCode: "send_message", message: {
            text: message,
            name: user.name,
            textColor: user.text_color,
            loginColor: user.login_color,
        }}));
    });

    connection.end();
}
