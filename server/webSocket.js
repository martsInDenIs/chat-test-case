const loginController = require('./controller/login_controller');
const messageController = require('./controller/send_message_controller');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jsonParser = express.json();
const jwt = require('jsonwebtoken');
const secretKey = require('./config');

const app = express();
const server = http.createServer(app);


const wss = new WebSocket.Server({server});

// делать update при установке mute and ban
const clients = new Map();

app.use(cors());

wss.on("connection",async (ws,req)=>{
    // check token, check ban status, check user exists
    
    const token = req.url.split('token=')[1];// get token from query
    console.log(token);

    if (!token) {
        ws.close(1013);
    }
    let payload = null;  

    try {
         payload = jwt.verify(token,secretKey.getSecretKey()); // decode token
    }catch(e){
        ws.close(1013);
        return;
    }

    // console.log(payload);
    const user =  await loginController.getUser(payload.userId); 
    console.log(user);
    if (!user || user.ban){
        ws.close(1013);
    }else{
        await clients.set(user.user_id, {user, ws});
    }

    console.log(clients);
    

    ws.on('close',(reason)=>{
        clients.delete(user.user_id);
    });

    ws.on("message",(message) =>{
        let obj = JSON.parse(message);
        console.log(obj.statusCode);
        switch(obj.statusCode){     
            case "send_message":
                console.log(clients.get(user.user_id).user);
                messageController.sendMessage(obj.message,clients.get(user.user_id).user,wss);
                break;
            case "show_all_messages":
                messageController.showAllMessages(ws);
                break;
            case 'ban':
                if (!user.isAdmin){
                    return;
                }
                break;
            default:

                break;
        }

    });

    ws.on('show_all_messages',(messageArr)=>{
        console.log('tuta');
        ws.send(JSON.stringify({statusCode: "show_all_messages", messages: messageArr}));
    });

    ws.send(JSON.stringify({statusCode: "find_messages"}));
});



app.post('/',jsonParser,function(req,res){
    switch(req.body.statusCode){
        case "login":
            loginController.checkUser(req.body, res);
            break;           
        default:
            console.error("Something go wrong!");
    }
    res.on("login_error",()=>{
        res.json({statusCode:"login_error"});
    });

    res.on("login_ok",(obj)=>{
        const token = jwt.sign(obj,secretKey.getSecretKey(),{expiresIn: 60*60});
        res.json({
            statusCode: "login_ok",
            token: token,
        }); 
    });
    
});

server.listen(8080,async ()=> {
    console.log("server is started!");
});
