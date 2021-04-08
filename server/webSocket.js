const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jsonParser = express.json();

const jwt = require('jsonwebtoken');
const secret = require('./config');
const messageController = require('./controller/messageController');
const textService = require('./services/textService');
const User = require('./services/userService');
const allUsersController = require('./controller/allUsersController');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const clients = new Map();

app.use(cors());


//МОГУ ОБЕРНУТЬ В КОНТРОЛЛЕР
app.post('/',jsonParser,async (req,res) => {
    res.on("login_error",()=>{
        res.json({statusCode:"login_error"});
    });

    res.on("login_ok",(user)=>{
        const token = jwt.sign(user,secret.secretKey,{expiresIn: 60*60});
        
        res.json({
            token,
            user,
            statusCode: "login_ok",
        }); 
    });
   
    switch(req.body.statusCode){
        case "login":
            let validLogin = textService.textControll(req.body.login,3,20,true);
            let validPassword = textService.textControll(req.body.password,1,20,true);
            if(!validLogin || !validPassword) return  res.emit('login_error');

            const answerObj = await User.loginUser(req.body);

            if(answerObj.statusCode == 'login_error'){
                return res.emit("login_error");
            }

            return res.emit('login_ok',answerObj.userInfo);
            break;           
        default:
            console.error("Something go wrong!");
    }
});




wss.on("connection",async (ws,req)=>{
    const token = req.url.split('token=')[1];// get token from query

    if (!token) {
       return ws.close(1013);
    }

    let payload = null;  

    try {
         payload = jwt.verify(token,secret.secretKey); // decode token
    }catch(e){
        return ws.close(1013);
    }

    const user =  await User.getUserInfo(payload.userId); 
    
    if (!user || user.ban){
       return ws.close(1013);
    }

    if(clients.has(user.id)){
        const client = clients.get(user.id).ws;
        client.close(1013);
        clients.delete(user.id);
    }
    
    clients.set(user.id, {user, ws});

    const allMessages = await User.getAllMessages();
    const getUsers = await User.getAllUsers(user,clients);

    ws.on('close', ()=> messageController.onClose(wss,clients,user.id));
    ws.on('error', (...args)=> messageController.onError(...args));
    ws.on('message', (message)=> messageController.onMessage(message,wss,clients,user));

    ws.send(JSON.stringify({
        allMessages,
        statusCode: 'get_primary_information',
        allUsers: getUsers.allUsers,
        usersOnLine: getUsers.usersOnLine,
        userInfo: {
            isMute: user.mute,
            name: user.name,
        }
    }));

    allUsersController.sendToAll({
        statusCode: "find_new_users",
    },wss);

});

server.listen(8080,async ()=> {
    console.log("server is started!");
}); 