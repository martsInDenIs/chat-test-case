const loginController = require('./controller/login_controller');
const messageController = require('./controller/send_message_controller');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jsonParser = express.json();
const jwt = require('jsonwebtoken');
const secret = require('./config');
const usersController = require('./controller/users_controller');
const textController = require('./controller/text_validate_controller'); 

const app = express();
const server = http.createServer(app);


const wss = new WebSocket.Server({server});

const clients = new Map();

app.use(cors());

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

    const user =  await loginController.getUser(payload.userId); 
    
    if (!user || user.ban){
       return ws.close(1013);
    }

    await clients.set(user.id, {user, ws});

    ws.on('close',(reason)=>{
        clients.delete(user.id);
        wss.clients.forEach((ws)=>ws.send(JSON.stringify({statusCode: "find_new_users"})));
    });

    ws.on("message",(message) =>{
        let objectInfo = JSON.parse(message);
        switch(objectInfo.statusCode){     
            case "send_message":
                // const validMessage = textController.textControll(objectInfo.message,1,200,false);
                // if(!validMessage) return false;
                if(user.mute) return ws.close(1013); // if client changed front
                messageController.sendMessage(objectInfo.message,user,wss);
                break;
            case "get_all_messages":
                messageController.getAllMessages(ws);
                break;
            case 'ban': 
                if (!user.isAdmin) return ws.close(1013); //do i need it?
                usersController.banUser(objectInfo.banUserId,clients,wss);
                break;
            case 'mute':
                if(!user.isAdmin) return ws.close(1013); 
                usersController.muteUser(objectInfo.muteUserId,clients, ws);
                break;
            case "get_all_users":
                const usersOnLine = [];
                for(let client of clients.values()){
                    usersOnLine.push({name: client.user.name, userId: client.user.id})
                }
                // clients.forEach(((user, usersOnLine) => ({ //нет метода map
                //     name: user.user.name, userId: user.user.user_id,
                // })));

                if(user.isAdmin) usersController.getAllUsers(user, ws, usersOnLine);
                else {
                    ws.send(JSON.stringify({statusCode: "get_all_users", usersOnLine: usersOnLine}));
                }
                break;
            case "user_exit":
                ws.close(1013);
                break;
            default:
                break;
        }

    });

    ws.on('get_all_messages',(messageArr)=>{
        ws.send(JSON.stringify({statusCode: "get_all_messages", messages: messageArr}));
    });

    ws.send(JSON.stringify({statusCode: "take_user_information", user: {isAdmin: user.isAdmin, isMute: user.mute, name: user.name}}));

    ws.send(JSON.stringify({statusCode: "find_messages"}));

    wss.clients.forEach((ws)=>ws.send(JSON.stringify({statusCode: "find_new_users"})));
});

app.post('/',jsonParser,function(req,res){
    res.on("login_error",()=>{
        res.json({statusCode:"login_error"});
    });

    res.on("login_ok",(user)=>{
        const token = jwt.sign(user,secret.secretKey,{expiresIn: 60*60});
        
        res.json({
            statusCode: "login_ok",
            token,
            user,
        }); 
    });
   
    switch(req.body.statusCode){
        case "login":
            let validLogin = textController.textControll(req.body.login,3,20,true);
            let validPassword = textController.textControll(req.body.password,1,20,true);
            if(!validLogin || !validPassword) return  res.emit('login_error');

            loginController.checkUser(req.body, res);
            break;           
        default:
            console.error("Something go wrong!");
    }
});

server.listen(8080,async ()=> {
    console.log("server is started!");
}); 