const mysql = require('mysql2/promise');
let connection = null;

async function adminId(){
    let [share_result] = await connection.query("SELECT user_id FROM admin WHERE id = 1");
    return share_result.length == 1 ? share_result[0].user_id : -1; 
}


async function findUserInDB(obj){
    let [share_result] = await connection.query("SELECT user_id, name FROM users WHERE name = ? AND password = ?;",[obj.login, obj.password]);
    return share_result;
}

async function createUser(obj, res){
    let [user_count] = await connection.query(`SELECT COUNT(user_id) as amount FROM users WHERE user_id LIKE '${obj.login[0].toUpperCase()}%' ;`);
    try{
        let user_id = obj.login[0].toUpperCase() + (+user_count[0].amount + 1);
        await connection.query("INSERT INTO users VALUES(?,?,?,?,?);",[user_id, obj.login, obj.password, obj.text_color, obj.login_color]); 
        console.log(`New user has created`);
        if(obj.createAdmin == true) await connection.query("INSERT INTO admin VALUES(?,?)",[1,user_id]); 
        res.emit('login_ok',{user_id: user_id, name: obj.login, text_color: obj.text_color, login_color: obj.login_color});
    }catch(err){
        res.emit('login_error');
    }
}

module.exports.checkUser = async function(obj, res){
    connection = await mysql.createConnection({host:'localhost',user:"root",database:"web_socket_chat",password: "root"});
    let admin_id = await adminId();
    let user = await findUserInDB({login: obj.login, password: obj.password});

    if(user.length <= 0) {
        let choise = null;
        if(admin_id == -1) choise = true;  // возвращает user_id, name
        else choise = false;
        
        await createUser({createAdmin: choise, login: obj.login, password: obj.password, text_color: "#000", login_color: "#000"}, res);
    }
    else if(user.length == 1) return res.emit('login_ok',({user_id: user[0].user_id, name: user[0].name}));
    else console.error('Can`t be more than 1 user with this name and password...'); 

    connection.end();
}