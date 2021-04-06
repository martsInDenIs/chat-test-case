const mysql = require('mysql2');
const migration = require('mysql-migrations');

const connection = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'web_socket_chat',
});

migration.init(connection, __dirname + '/migrations');