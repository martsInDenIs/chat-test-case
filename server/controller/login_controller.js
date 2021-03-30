const mysql = require('mysql2/promise');
let connection = null;

async function findUserInDB(obj){
    let [share_result] = await connection.query("SELECT user_id, name FROM users WHERE name = ? AND password = ?;",[obj.login, obj.password]);
    return share_result;
}

async function createUser(obj, ws){
    let [user_count] = await connection.query(`SELECT COUNT(user_id) as amount FROM users WHERE user_id LIKE '${obj.login[0].toUpperCase()}%' ;`);
    try{
        let user_id = obj.login[0].toUpperCase() + (+user_count[0].amount + 1);
        await connection.query("INSERT INTO users VALUES(?,?,?);",[user_id, obj.login, obj.password]); 
        console.log(`New user was created`);

        //Создать событие new_user;
        return {
            user_id: user_id,
            name: obj.login
        };
    }catch(err){
        ws.emit('login_error');
    }
}

module.exports.checkUser = async function(obj, ws){
    connection = await mysql.createConnection({host:'localhost',user:"root",database:"web_socket_chat",password: "root"});
    let user = await findUserInDB({login: obj.login, password: obj.password});

    if(user.length <= 0) {
        new_user = await createUser({login: obj.login, password: obj.password}, ws); // возвращает user_id, name
        console.log(new_user);
        return new_user;
    }
    else if(user.length == 1) return ({user_id: user[0].user_id, name: user[0].name});
    else console.error('Can`t be more than 1 user with this name and password...'); 


    connection.end();
}


// Сделать обработку ошибки, если пользователь уже существует
// module.exports.checkUser({login: "dementor", password: 'fun'});