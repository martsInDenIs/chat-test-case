import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

let socket = null;
let myRequest = new XMLHttpRequest();

class LoginForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            nameField: "",
            passwordField: "",
            isLogFail: false,
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() { 
        let token = localStorage.getItem('web_token');
        if(token){
            ReactDOM.render(<ChatForm />,document.getElementById("root"));
        }
    }

    handleChange(event){
        switch(event.target.id){
            case "login":
                this.setState({nameField: event.target.value});
                break;
            case "password":
                this.setState({passwordField: event.target.value});
                break;
            default:
                console.error("The other id, that i haven`t met");
        }
    }

    handleSubmit(event){
        myRequest.open("POST",'http://localhost:8080',true);
        myRequest.setRequestHeader("Content-Type","application/json; charset=utf-8");
        
        myRequest.send(JSON.stringify({statusCode: "login", login:this.state.nameField, password: this.state.passwordField}));
        myRequest.onload = ()=>{
            let answerObj = JSON.parse(myRequest.response);
            switch(answerObj.statusCode){
                case "login_error":
                    this.setState({isLogFail: true});
                    break;
                case "login_ok":
                    console.log(answerObj);
                    localStorage.setItem('web_token',answerObj.token);
                    ReactDOM.render(<ChatForm />,document.getElementById("root"));
                    break;
                default:
                    console.log('it`s not possible');
                    break;
            }

        myRequest.onerror = ()=>{console.log("Something went wrong...")};
    };
        event.preventDefault();
    }

    render(){
        return (<div className = "loginBlock">
            <h3>Log in</h3>
            <form onSubmit = {this.handleSubmit} id = 'login_f'>
                <label><input type = 'text' id = 'login' placeholder = "Input login..." onChange = {this.handleChange}/></label>
                <label><input type = 'password' id = 'password' placeholder = "Input password..." onChange = {this.handleChange}/></label>
                <input type = 'submit' />
            </form>
            {!this.state.isLogFail ? null : <div>Invalid password</div>}
        </div>);
    }

}



// Элемент после логина

// const messages = [];

// event all messages

// setState({ messages });

// render


// out => 
// event server message

// setState((prev) => ({
    // ...prev,
    // messages: messages.concat(msg),
// }))

class ChatForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            messages: [],
        }
        this.handleSubmit = this.handleSubmit.bind(this);

        socket =  new WebSocket(`ws://localhost:8080/?token=${localStorage.getItem('web_token')}`);

        socket.onmessage = (event) =>{
            let answerObj = JSON.parse(event.data);
            console.log(answerObj.message);
            switch(answerObj.statusCode){
                case "send_message":
                    console.log('ogogoog');
                    this.setState({messages: this.state.messages.concat(answerObj.message)});
                    break;
                case "show_all_messages":
                    this.setState({messages: answerObj.messages});
                    break;
                case "find_messages":
                    socket.send(JSON.stringify({statusCode: "show_all_messages"}));       
                    break;
                default:
                    break;    
            }
        }

      
        socket.onopen = (event)=>{
            console.log("Connection is successful"); 
        }


        socket.onerror = function(error){
            console.log(error);
        }

        socket.onclose = (event)=>{
            // alert(event.code);
            if(event.code === 1013){
                localStorage.removeItem('web_token');
                ReactDOM.render(<LoginForm />,document.getElementById('root'));
            }
        }
    }


    handleSubmit(event){
        socket.send(JSON.stringify({statusCode: "send_message", message: event.target[0].value}));
    }

    componentDidMount(){

    }

    componentWillUnmount(){
        socket.close();
    }

    render(){
        console.log(this.props.user_info);
        return (<div>
            <div>
                <ul>
                    <MessageWindow messages = {this.state.messages}/>
                </ul>
                <SideUsersBlock />
            </div>
            <UserInputForm onHandleSubmit = {this.handleSubmit}/>
        </div>);
    }
}





class MessageWindow extends React.Component{
    constructor(props){
        super(props);
    }

    render(){

        return  (<div>{this.props.messages.map((user,index)=><div key={index} className = 'messageBlock'>
                    <p style = {{color: user.loginColor}} className = "nameClass">{user.name}</p>
                    <p style = {{color: user.textColor}} className = 'textClass'>{user.text}</p>
                </div>)}</div>);
    }
}




class UserInputForm extends React.Component{
    constructor(props){
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            disabled: false,
            messageInput: '',
        }
    }


    handleChange(event){
        // this.props.onHandleChange(event);
        this.setState({messageInput: event.target.value});
    }


    handleSubmit(e){
        e.preventDefault();

        console.log(e.target);

        this.setState({disabled: true, messageInput: ""});
        setTimeout(()=>{
            this.setState({disabled: !this.state.disabled})
        },15000);
        this.props.onHandleSubmit(e);
    }

    render(){
        return (<form onSubmit = {this.handleSubmit}>
            <input type = 'text' maxLength = {200} value = {this.state.messageInput} onChange = {this.handleChange} placeholder = "Input your message..." />
            <input type = 'submit' value = "Send message" disabled = {this.state.disabled}/>
        </form>);
    }
    
}

class SideUsersBlock extends React.Component{


    render(){
        
        return <div>
            <ul></ul>
        </div>;
    }
}


ReactDOM.render(<LoginForm />,document.getElementById("root"));