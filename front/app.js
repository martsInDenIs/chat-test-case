let socket = new WebSocket("ws://localhost:8080");

document.forms.publish.onsubmit = function(){
    let outgoingMessage = this.message.value;

    socket.send(outgoingMessage);
    return false;
}

socket.onmessage = function(event){
    let message = event.data;

    let messageElem = document.createElement("div");
    messageElem.textContent = message;
    messageElem.style.display = 'inline-block';
    document.getElementById("message").before(messageElem);
}
socket.onopen = function(event){
    console.log("Cennection is successful");
}

socket.onerror = function(error){
    console.log(error);
}