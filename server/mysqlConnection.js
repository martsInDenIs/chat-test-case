const mysql = require('mysql2/promise');
let connection = null;
console.log("Первый вызов");

module.exports = async () => {
    if(connection) return connection;
    connection = mysql.createConnection({host:'localhost',user: 'root',password:'root', database: 'web_socket_chat'});

    console.log(connection);
    return connection;
};
