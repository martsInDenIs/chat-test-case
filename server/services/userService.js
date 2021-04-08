const createConnection = require('../mysqlConnection');
const textService = require('./textService');
const {colorList} = require('../config');
let connection = null;

//Delete second color in checkUser

module.exports.getUserInfo = async (userId) =>{
        connection = await createConnection();
        const [share_result] = await connection.query("SELECT * FROM users WHERE id = ?",[userId]);
        return share_result[0];
    }

module.exports.loginUser = async(payload) => { // it was checUser method
        connection = await createConnection();

        const hashPassword = textService.encodePassword(payload.password);
        const [findUser] = await connection.query("SELECT id, name, password, color, mute, ban, isAdmin\
                                                                                FROM users WHERE name = ? AND password = ?;",[payload.login, hashPassword]);

        if(findUser.length <= 0){
            // Can create a new method
                try{
                    const [users] = await connection.query("SELECT COUNT(*) AS count FROM users");
                    const isAdmin = users[0].count > 0 ? false : true;

                    const color = colorList[Math.round(Math.random() * colorList.length)];
                    const [createdUser] = await connection.query("INSERT INTO users(name,password,color, mute, ban, isAdmin)\
                                                                        VALUES(?,?,?,?,?,?);",[payload.login, hashPassword, color, false, false, isAdmin]); 

                                                                        console.log("paaasword");
                    const [findUserId] = await connection.query("SELECT id FROM users WHERE name = ?",[payload.login]);
                    console.log('New user has created!');

                    return ({
                        statusCode: 'login_ok',
                        userInfo: {
                            isAdmin,
                            userId: findUserId[0].id,
                            name: payload.login,
                            mute: false
                        }
                    });
                }catch(err){
                    return {
                        statusCode: "login_error"
                    };
                }
        }

        if(findUser.length == 1) {
            return {
                statusCode: "login_ok",
                userInfo: {
                    isAdmin: findUser[0].isAdmin,
                    userId: findUser[0].id,
                    name: findUser[0].name,
                    mute: findUser[0].mute,
                }
            }
        }

        return {
            statusCode: "something_wrong"
        };
    }

module.exports.getAllMessages = async () => {
        const [allMessages] = await connection.query("SELECT users.name as name, messages.text as text, users.color as color\
                                                                FROM messages INNER JOIN users ON messages.user = users.id ORDER BY messages.date DESC LIMIT 20");

        return allMessages;
    }

module.exports.sendMessage = async(message, user) =>{
        if(user.mute){
            return {
                statusCode: "invalid_user",
            }
        }
        
        const validMessage = textService.textControll(message, 1, 200, false);
        if(!validMessage) return;

        const [lastMessageTime] = await connection.query("SELECT date FROM messages WHERE user = ? ORDER BY date DESC LIMIT 1",[user.id]);
        const currentTime = new Date();
    
        if(lastMessageTime[0]){
            let timeOffset = parseFloat((currentTime - lastMessageTime[0].date)/1000);

            if(timeOffset < 15) {
                return;
            }
        }

        try{
            await connection.query("INSERT INTO messages(user, text, date) VALUES(?,?,?)",[user.id, message, new Date()]);
        }catch(err){
            console.error(`Err: ${err}`);
        }

        return {
            statusCode: "send_message",
            payload:{
                name: user.name,
                text: validMessage,
                color: user.color
            }
        };
    }

module.exports.banUser = async (banUserId,sender, clients) => {
        // after return controller need to send new set of users and clear clients map
        if(!sender.isAdmin){ 
            return {
                statusCode: "invalid_user",
            }
        }

        try{
            await connection.query("UPDATE users SET ban = !ban WHERE id = ? ", [banUserId]);
            console.log("Ban is successfull");

            if(clients.has(parseInt(banUserId))){
                const banUserConnection = clients.get(parseInt(banUserId)).ws;
                clients.delete(banUserId);

                return {
                    statusCode: 'find_new_users',
                    banUserConnection,
                };
            }

            return{
                statusCode: 'find_new_users',
            }

        }catch(err){
            console.error(err);
        }
    };

module.exports.muteUser = async (muteUserId,sender, clients) => {
        if(!sender.isAdmin){
            return{
                statusCode: "invalid_user"
            }
        }

        console.log(clients);

        try{
            await connection.query("UPDATE users SET mute = !mute WHERE id = ?",[muteUserId]);
            console.log("Mute successful");

            if(clients.has(parseInt(muteUserId))){
                const muteUser = clients.get(parseInt(muteUserId));
                muteUser.user.mute = !muteUser.user.mute;
    
                return{
                    statusCode: "find_new_users",
                    muteUserConnection: muteUser.ws,
                }
            }

            return{
                statusCode: "find_new_users"
            }
        }catch(err){
            console.error(err);
        }
    }

module.exports.getAllUsers = async (sender,clients) =>{
        const usersOnLine = Array.from(clients.values()).map((client)=>{
            return client.user.name;
        });

        if(!sender.isAdmin) return {
            usersOnLine,
            statusCode: "get_all_users",
        };
 
        try{
            const [allUsers] = await connection.query("SELECT id, name, mute, ban FROM users WHERE id <> ?", [sender.id]);
            return {
                allUsers,
                usersOnLine,
                statusCode: "get_all_users",
            };
        }catch(err){
            console.error(err);
        }
    }
