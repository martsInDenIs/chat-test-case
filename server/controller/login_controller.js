const mysql = require('mysql2/promise');
const crypto = require('crypto');
const secret = require('../config');
let connection = null;


async function findUserInDB(login, password){
    const hashPassword = crypto.createHash('md5').update(password).digest('hex');
    let [shareResult] = await connection.query("SELECT id, name, password, text_color, login_color, mute, ban, isAdmin FROM users WHERE name = ? AND password = ?;",[login, hashPassword]);
    return shareResult;
}

async function createUser(user, res){
    // TODO mysql injection escape
    try{
        const hashPassword = crypto.createHash('md5').update(user.password).digest('hex');
        await connection.query("INSERT INTO users(name,password,text_color, login_color, mute, ban, isAdmin) VALUES(?,?,?,?,?,?,?);",[user.login, hashPassword, user.textColor, user.loginColor, false, false, user.createAdmin]); 
        let [userId] = await connection.query("SELECT id FROM users WHERE name = ?",[user.login]);
        console.log(`New user has created`);
        res.emit('login_ok',{isAdmin: Boolean(user.createAdmin), userId: userId[0].id, name: user.login, mute: false});
    }catch(err){
        console.log(err);
        res.emit('login_error');
    }
}

module.exports.checkUser = async function(payload, res){
    connection = await mysql.createConnection(secret.dbconfig);
    let [users] = await connection.query("SELECT COUNT(*) AS count FROM users");
    const isAdmin = users[0].count > 0 ? false : true;
 
    const user = await findUserInDB(payload.login, payload.password);
    if(user.length <= 0) {
        await createUser({createAdmin: isAdmin, login: payload.login, password: payload.password, textColor: "#000", loginColor: "#000"}, res);
    }
    else if(user.length == 1) return res.emit('login_ok',({isAdmin: Boolean(user[0].isAdmin), userId: user[0].id, name: user[0].name, mute: user[0].mute}));
    else console.error('Can`t be more than 1 user with this name and password...'); 

    connection.end();
}


module.exports.getUser = async function(userId){
    connection = await mysql.createConnection(secret.dbconfig);

    let [share_result] = await connection.query("SELECT * FROM users WHERE id = ?",[userId]);
    connection.end();
    return (share_result[0]);
}