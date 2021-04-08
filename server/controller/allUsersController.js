module.exports.sendToAll = (message, wss) =>{
    wss.clients.forEach((client)=>{
        client.send(JSON.stringify({
            statusCode: message.statusCode,
            message: message.payload
        }));
    });
}