const mysql = require('mysql2/promise');
let connection = null;


async function findUserInDB(obj){
    let [shareResult] = await connection.query("SELECT user_id, name, password, text_color, login_color, mute, ban, isAdmin FROM users WHERE name = ? AND password = ?;",[obj.login, obj.password]);
    return shareResult;
}

async function createUser(obj, res){
    let [userCount] = await connection.query(`SELECT COUNT(user_id) as amount FROM users WHERE user_id LIKE '${obj.login[0].toUpperCase()}%' ;`);
    try{
        let userId = obj.login[0].toUpperCase() + (+userCount[0].amount + 1);
        await connection.query("INSERT INTO users VALUES(?,?,?,?,?,?,?,?);",[userId, obj.login, obj.password, obj.textColor, obj.loginColor, false, false, obj.createAdmin]); 
        console.log(`New user has created`);
        res.emit('login_ok',{isAdmin: obj.createAdmin, userId: userId, name: obj.login});
    }catch(err){
        console.log(err);
        res.emit('login_error');
    }
}

module.exports.checkUser = async function(obj, res){
    connection = await mysql.createConnection({host:'localhost',user:"root",database:"web_socket_chat",password: "root"});
    let users = await connection.query("SELECT COUNT (*) FROM users");
    let isAdmin = null
    
    if(users.length == 0) isAdmin = true;  // возвращает user_id, name
        else isAdmin = false;
    
    let user = await findUserInDB({login: obj.login, password: obj.password});
    if(user.length <= 0) {
        console.log("tut");
        await createUser({createAdmin: isAdmin, login: obj.login, password: obj.password, textColor: "#000", loginColor: "#000", mute: obj.mute, ban: obj.ban}, res);
    }
    else if(user.length == 1) return res.emit('login_ok',({isAdmin: isAdmin, userId: user[0].user_id, name: user[0].name}));
    else console.error('Can`t be more than 1 user with this name and password...'); 

    connection.end();
}


module.exports.getUser = async function(userId){
    connection = await mysql.createConnection({host:'localhost',user:"root",database:"web_socket_chat",password: "root"});

    let [share_result] = await connection.query("SELECT * FROM users WHERE user_id = ?",[userId]);
    console.log(share_result[0]);
    connection.end();
    return (share_result[0]);
}