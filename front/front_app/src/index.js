import React from "react";
import ReactDOM from "react-dom";
import "./index.css"
import {GridList, Container, Button, TextField, Grid, Paper, Typography, Box, AppBar, Toolbar} from '@material-ui/core';


let socket = null;
const myRequest = new XMLHttpRequest();

class LoginForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            nameField: "",
            passwordField: "",
            isLogFail: false,
            chatRender: false,
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
                    this.setState({chatRender: true});
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
            <Paper className = "loginBlock"  elevation ={12}>
                <Container component = "main" maxWidth = 'ms'>
                    <Typography  variant = 'h4' component = 'h4' >Log in</Typography>
                    <form onSubmit = {this.handleSubmit} className = "form">
                        <Grid container direction = 'column' justify = 'center' alignItems = 'center' >
                            <TextField
                            id = 'login' 
                            margin = 'normal' 
                            className = "inputField" 
                            variant = 'outlined' 
                            required  
                            label = "Login"  
                            maxLength = '20' 
                            minLength = '3' 
                            value = {this.state.nameField} 
                            onChange = {this.handleChange}
                            />
                            <TextField
                            id = 'password'
                            className = 'inputField'
                            margin = 'none'
                            variant = 'outlined'
                            required
                            type = 'password'
                            label = 'Password'
                            maxLength = '10'
                            minLength = '1'
                            value = {this.state.passwordField}
                            onChange = {this.handleChange}
                            />
                            <Button type = 'submit' variant = "contained" color = "primary"> Sign up </Button>
                        </Grid>
                    </form>
                    {!this.state.isLogFail ? null : <div>Invalid name or password</div>}
                </Container>
            </Paper>
        );
        
    }

}


class ChatForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            messages: [],
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
                case "get_primary_information":
                    this.setState({
                        messages: answerObj.allMessages,
                        allUsers: answerObj.allUsers,
                        usersOnLine: answerObj.usersOnLine,
                        isMute: answerObj.userInfo.isMute,
                        name: answerObj.userInfo.name,
                    });
                    break;
                case "send_message":
                    this.setState({messages: this.state.messages.concat(answerObj.message)});
                    break;
                case "get_all_users":
                    if(answerObj.allUsers){
                        this.setState({allUsers: answerObj.allUsers, usersOnLine: answerObj.usersOnLine});
                    }else{
                        this.setState({usersOnLine: answerObj.usersOnLine});
                    }
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
        return (
            <div>
                <AppBar position = 'static'> 
                    <Toolbar>
                        <Typography variant = 'h2' class = 'title'>Chat</Typography>
                        <Button color = 'inherit' onClick = {this.handleClick}>Exit</Button>
                    </Toolbar>
                </AppBar>
                <Grid container xl = {12} justify = 'center'> 
                    <Grid className = "gridContainer" container item direction = 'row'>
                        <Grid item xs = {5} sm ={6} md = {4} xl = {3} >
                            <SideUsersBlock usersOnLine = {this.state.usersOnLine} allUsers = {this.state.allUsers}/>
                        </Grid>
                        <Grid item xs = {7} sm = {6} md = {8} xl = {9}>
                            <MessageWindow  messages = {this.state.messages}/>
                        </Grid>  
                    <Grid item className = "inputBlock">
                        <UserInputForm onHandleSubmit = {this.handleSubmit} isMute = {this.state.isMute} />
                    </Grid>
                    </Grid>
                </Grid>
        </div>
                );
    }
}





class MessageWindow extends React.Component{
    render(){
        return  (
            <Grid >
                <Paper className = 'messagePaperBlock' >
                    {this.props.messages.map((user,index)=>(
                    <Grid className = "messageBlock" key={index}>
                                <Typography variant = 'h5' component = 'p' style = {{color: user.color}}>{user.name}</Typography>
                                <Typography component = 'p' style = {{color: user.color}}>{user.text}</Typography> 
                    </Grid>
                    )
                    )}
                </Paper>
            </Grid>
                );
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
        return (
        <Paper className = "paperInputForm" elevation = {24}>
                <form onSubmit = {this.handleSubmit}>
                        <TextField className variant = 'standard' maxLength = '200' value = {this.state.messageInput} disabled = {this.props.isMute} onChange = {this.handleChange} required = {true} placeholder = "Input your message..." ></TextField>
                        <Button type = 'submit' color = 'primary' variant = 'container' disabled = {this.state.disabled || this.props.isMute}>Send message</Button> 
                </form>
        </Paper>);
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
        return (
            <Paper elevation = {23} className = "sideUsersBlock">
                    <ul >{this.props.usersOnLine.map((user,index)=>
                        <li key = {index}>{user}</li>)}
                    </ul>
                    {this.props.allUsers ? <div>
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
            </Paper>
        );
    }
}


ReactDOM.render(<LoginForm />,document.getElementById("root"));