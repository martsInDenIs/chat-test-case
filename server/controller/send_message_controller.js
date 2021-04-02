const mysql = require('mysql2/promise');
let connection = null;


module.exports.showAllMessages = async function(ws){
    let conn = await mysql.createConnection({host:'localhost',database:"web_socket_chat", user:"root", password: 'root'});
    let [share_result] = await conn.query("SELECT users.name as name, messages.text as text, users.text_color as text_color, users.login_color as login_color FROM messages INNER JOIN users ON messages.user_id = users.user_id");
    console.log("SHARE RESULT: " + share_result);
    conn.end();
    ws.send(JSON.stringify({statusCode: "show_all_messages",messages: share_result}));
}





async function showAmountOfMessages(){
    let [share_message] = await connection.query("SELECT COUNT(*) AS message_count FROM messages");
    return share_message[0].message_count;
}

async function deleteLastMessage(){
    try{
        let [max_autoincremet] = await connection.query("SELECT MAX(ms.id) AS max FROM messages AS ms");
        let [share_result] = await connection.query("DELETE FROM messages ORDER BY date DESC LIMIT 1");
        await connection.query("ALTER TABLE messages AUTO_INCREMENT = ?", max_autoincremet[0].max + 1);
    
        console.log('Delete was successful');
        return share_result;
    }catch(err){
        console.log("Error: " + err);
    }
}


module.exports.sendMessage = async function(message,user,wss){
    connection = await mysql.createConnection({host:'localhost',database:"web_socket_chat", user:"root", password: 'root'});
    let message_count = showAmountOfMessages();
    if(message_count >= 2){
       let delete_message = deleteLastMessage();
       console.log(delete_message);
    }

    try{
        await connection.query("INSERT INTO messages(user_id, text, date) VALUES(?,?,?)",[user.user_id, message, new Date()]);
        // console.log(wss.clients);
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
