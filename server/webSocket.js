const User = require('./model/user');
const loginController = require('./controller/login_controller');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({server});
const clients = new Map();

wss.on("connection",(ws,req)=>{
    ws.on("message",(message) =>{
        let obj = JSON.parse(message);
        switch(obj.target){
            case "login":
                let user = loginController.checkUser(obj, ws);
                // if(user == 'LOGIN_ERROR'){
                //     console.log("Gagaga");
                //     ws.send(JSON.stringify({answer_code: "LOGIN_ERROR", message: "Client with this name already exists"}));
                // }else{
                //     clients.set(user.user_id, ws);
                // }
                break;           
        }

    });

    ws.on("login_error",()=>{
        ws.send(JSON.stringify({status_code:"login_error"}));
    });

})

server.listen(8080,()=> console.log("server is started!"));
