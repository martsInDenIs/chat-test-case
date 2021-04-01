import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

let socket = null;


class LoginForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            name_field: "",
            password_field: "",
            isLogFail: false,
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event){
        switch(event.target.id){
            case "login":
                this.setState({name_field: event.target.value});
                break;
            case "password":
                this.setState({password_field: event.target.value});
                break;
            default:
                console.error("The other id, that i haven`t met");
        }
    }

    handleSubmit(event){
        let myRequest = new XMLHttpRequest();
        myRequest.open("POST",'http://localhost:8080',true);
        myRequest.setRequestHeader("Content-Type","application/json; charset=utf-8");
        
        myRequest.send(JSON.stringify({status_code: "login", login:this.state.name_field, password: this.state.password_field}));
        myRequest.onload = ()=>{
            let answer_obj = JSON.parse(myRequest.response);
            switch(answer_obj.status_code){
                case "login_error":
                    this.setState({isLogFail: true});
                    break;
                case "login_ok":
                    console.log(answer_obj);
                    ReactDOM.render(<ChatForm user_info = {answer_obj}/>,document.getElementById("root"));
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

class ChatForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            send_message: [],
            user_id: props.user_info.user_id,
            name: props.user_info.name,
            text_color: props.user_info.text_color,
            login_color: props.user_info.login_color,

        }
        this.handleSubmit = this.handleSubmit.bind(this);
    }


    handleSubmit(event){
        socket.send(JSON.stringify({status_code: "send_message", name: this.state.name, user_id: this.state.user_id, message: event.target[0].value, text_color: this.state.text_color, login_color: this.state.login_color}));
        this.setState({message_input: ''});
    }

    componentDidMount(){
        socket =  new WebSocket("ws://localhost:8080");
        socket.onmessage = (event) =>{
            let answer_obj = JSON.parse(event.data);
            console.log(answer_obj);
            
            switch(answer_obj.status_code){
                case "send_message":
                    this.setState({send_message: [answer_obj]})
                    break;
                case "show_all_messages":
                    this.setState({send_message: answer_obj.messages});
                    break;
                default:
                    break;    
            }
        }


        socket.onopen = (event)=>{
            console.log("Connection is successful");
            socket.send(JSON.stringify({user_id: this.state.user_id, status_code: "socket_id"}));
            socket.send(JSON.stringify({status_code: "show_all_messages"}));        
        }


        socket.onerror = function(error){
            console.log(error);
        }
    }

    componentWillUnmount(){
        socket.close();
    }

    render(){
        console.log(this.props.user_info);
        return (<div>
            <div>
                <ul>
                    <MessageWindow message_list = {[...this.state.send_message]}/>
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
        this.state = {
            messages: props.message_list,
        }
    }

    shouldComponentUpdate(nextProps){
        console.log("should update");
        return this.state.messages = [...nextProps.message_list];
    }

    render(){

        return  (<div>{this.state.messages.map((user,index)=><div key={index} className = 'messageBlock'>
                    <p style = {{color: user.text_color}} className = "nameClass">{user.name}</p>
                    <p style = {{color: user.text_color}} className = 'textClass'>{user.text}</p>
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
            message_input: '',
        }
    }


    handleChange(event){
        // this.props.onHandleChange(event);
        this.setState({message_input: event.target.value});
    }


    handleSubmit(e){
        e.preventDefault();

        console.log(e.target);

        this.setState({disabled: true});
        setTimeout(()=>{
            this.setState({disabled: !this.state.disabled})
        },15000);
        this.props.onHandleSubmit(e);
    }

    render(){
        return (<form onSubmit = {this.handleSubmit}>
            <input type = 'text' maxLength = {200} onChange = {this.handleChange} placeholder = "Input your message..." />
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