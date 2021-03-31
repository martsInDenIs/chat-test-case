const User = require('./model/user');
const loginController = require('./controller/login_controller');
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

wss.on("connection",(ws,req)=>{
    ws.on("message",(message) =>{
        let obj = JSON.parse(message);
        switch(obj.target){
            case "login":
                let user = loginController.checkUser(obj, ws);
                break;           
        }

    });

    
});

app.post('/',jsonParser,function(req,res){
    switch(req.body.target){
        case "login":
            let user = loginController.checkUser(req.body, res);
            break;           
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
