const User = require('./model/user');
const loginController = require('./controller/login_controller');
const messageController = require('./controller/send_message_controller');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jsonParser = express.json();

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({server});

const clients = new Map();


app.use(cors());

wss.on("connection",(ws)=>{

    // check token, check ban status, check user exists

    ws.on("message",(message) =>{
        let obj = JSON.parse(message);
        console.log(obj.status_code);
        switch(obj.status_code){     
            case "socket_id":
                clients.set(obj.user_id,ws);
                break;
            case "send_message":
                console.log("GG")
                messageController.sendMessage(obj,wss);
                break;
            case "show_all_messages":
                messageController.showAllMessages(ws);
                break;
            default:

                break;
        }

    });

    ws.on('show_all_messages',(message_arr)=>{
        console.log(JSON.stringify(message_arr[0]));
        ws.send(JSON.stringify({status_code: "show_all_messages", messages: message_arr}));
    });

    
});

app.post('/',jsonParser,function(req,res){
    switch(req.body.status_code){
        case "login":
            let user = loginController.checkUser(req.body, res);
            break;           
        default:
            console.error("Something go wrong!");
    }
    res.on("login_error",()=>{
        res.json({status_code:"login_error"});
    });

    res.on("login_ok",(obj)=>{
        obj.status_code = 'login_ok';
        res.json(obj);
    });
    
});

server.listen(8080,()=> console.log("server is started!"));
