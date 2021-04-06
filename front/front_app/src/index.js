import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./index.css"
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {makeStyles, ThemeProvider, useTheme} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

let socket = null;
const myRequest = new XMLHttpRequest();
// Just example

class LoginForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            nameField: "",
            passwordField: "",
            isLogFail: false,
            chatRender: false,
            userObj: '',
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.loginRender = this.loginRender.bind(this);
    }

    componentDidMount() { 
        let token = localStorage.getItem('web_token');
        if(token){
            this.setState({chatRender: true});
        }
    }

    handleChange(event){
        const text = event.target.value.replace(/[&<>'";`]/g,'');
        switch(event.target.id){
            case "login":
                this.setState({nameField: text});
                break;
            case "password":
                this.setState({passwordField: text});
                break;
            default:
                console.error("The other id, that i haven`t met");
        }
    }

    loginRender(){
        this.setState({chatRender: false});
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
                    localStorage.setItem('web_token',answerObj.token);
                    this.setState({chatRender: true, userObj: answerObj.user});
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
        return (this.state.chatRender ? <ChatForm onLoginRender = {this.loginRender} user = {this.state.userObj}/> :
         <Container component = "main" maxWidth = 'sm' className = "loginBlock">
            <h3>Log in</h3>
            <form onSubmit = {this.handleSubmit} className = "form">
                <Grid container direction = 'column' justify = 'center' alignItems = 'center' >
                    <TextField variant = 'outlined' required = {true} fullWidth id = 'login'  maxLength = '20' minLength = '3' placeholder = "Input login..." value = {this.state.nameField} onChange = {this.handleChange}/>
                    <TextField variant = 'outlined' required = {true} fullwidth type = 'password'  id = 'password' maxLength = '10' minLength = '1' placeholder = "Input password..." value = {this.state.passwordField} onChange = {this.handleChange}/>
                    <Button type = 'submit' variant = "contained" color = "primary"> Sign up </Button>
                </Grid>
            </form>
            {!this.state.isLogFail ? null : <div>Invalid name or password</div>}
        </Container>);
        
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
            isAdmin: '',
            isMute: '',
            usersOnLine: [],
            allUsers:[],
            name: ''
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClick = this.handleClick.bind(this);

        socket =  new WebSocket(`ws://localhost:8080/?token=${localStorage.getItem('web_token')}`);

        socket.onmessage = (event) =>{
            let answerObj = JSON.parse(event.data);
            switch(answerObj.statusCode){
                case "take_user_information":
                    this.setState({isAdmin: answerObj.user.isAdmin, isMute: answerObj.user.isMute, name: answerObj.user.name});
                    break;
                case "send_message":
                    this.setState({messages: this.state.messages.concat(answerObj.message)});
                    break;
                case "get_all_messages":
                    this.setState({messages: answerObj.messages});
                    break;
                case "get_all_users":
                    if(answerObj.allUsers){
                        this.setState({allUsers: answerObj.allUsers, usersOnLine: answerObj.usersOnLine});
                    }else{
                        this.setState({usersOnLine: answerObj.usersOnLine});
                    }
                    break;
                case "find_messages":
                    socket.send(JSON.stringify({statusCode: "get_all_messages"}));       
                    break;
                case "find_new_users":
                    socket.send(JSON.stringify({statusCode: "get_all_users"}));
                    break;
                case "mute":
                    this.setState({isMute: !this.state.isMute});
                    break;
                default:
                    break;    
            }
        }

      
        socket.onopen = (event)=>{
            console.log("Connection is successful"); 
        }


        socket.onerror = (error) => {
            console.log(error);
            this.props.onLoginRender();
        }

        socket.onclose = (event)=>{
            if(event.code === 1013){
                localStorage.removeItem('web_token');
                this.props.onLoginRender();
            }
        }
    }


    handleSubmit(event){
        socket.send(JSON.stringify({statusCode: "send_message", message: event.target[0].value}));
    }

    componentWillUnmount(){
        socket.close();
    }

    handleClick(){
        socket.send(JSON.stringify({statusCode: 'user_exit'}));
    }

    render(){
        return (<div>
            <div>
                <ul>
                    <MessageWindow  messages = {this.state.messages}/>
                </ul>
                <SideUsersBlock usersOnLine = {this.state.usersOnLine} allUsers = {this.state.allUsers}/>
            </div>
            <UserInputForm onHandleSubmit = {this.handleSubmit} isMute = {this.state.isMute}/>
            <button onClick = {this.handleClick}>Exit</button>
        </div>);
    }
}





class MessageWindow extends React.Component{
    render(){
        return  (<div className = "messageWindow">{this.props.messages.map((user,index)=><div key={index} className = 'messageBlock'>
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
            // isMute: this.props.isMute,
            disabled: false,
            messageInput: '',
        }
    }


    handleChange(event){
        this.setState({messageInput: event.target.value});
    }


    handleSubmit(e){
        e.preventDefault();
        this.setState({disabled: true, messageInput: ""});

        setTimeout(()=>{
            this.setState({disabled: !this.state.disabled})
        },15000);

        this.props.onHandleSubmit(e);
    }

    render(){
        return (<form onSubmit = {this.handleSubmit}>
            <textarea maxLength = '200' value = {this.state.messageInput} disabled = {this.props.isMute} onChange = {this.handleChange} required = {true} placeholder = "Input your message..." ></textarea>
            <input type = 'submit' value = "Send message" disabled = {this.state.disabled || this.props.isMute}/>
        </form>);
    }
    
}

class SideUsersBlock extends React.Component{
    constructor(props){
        super(props);
        this.handleClickMute = this.handleClickMute.bind(this);
        this.handleClickBan = this.handleClickBan.bind(this);
    }

    handleClickMute(event){
        socket.send(JSON.stringify({statusCode: "mute", muteUserId: event.target.id}));
    }

    handleClickBan(event){
        socket.send(JSON.stringify({statusCode: "ban", banUserId: event.target.id}));
    }

    render(){
        return <div className = "sideUsersBlock">
                    <ul>{this.props.usersOnLine.map((user,index)=>
                        <li key = {index}>{user.name}</li>)}
                    </ul>
                    {this.props.allUsers.length > 0 ? <div>
                        <p>All users</p>
                            <ul>
                                {this.props.allUsers.map((user,index)=>
                                    <li key = {index} >{user.name} 
                                        <button onClick = {this.handleClickMute} id = {user.id}>{user.mute ? "unmute" : "mute"}</button>
                                        <button onClick = {this.handleClickBan} id = {user.id}>{user.ban ? "unban" : 'ban'}</button>
                                    </li>
                                )}
                            </ul>
                    </div>: null}
        </div>;
    }
}


ReactDOM.render(<LoginForm />,document.getElementById("root"));