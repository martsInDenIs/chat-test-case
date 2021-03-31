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
        
        myRequest.send(JSON.stringify({target: "login", login:this.state.name_field, password: this.state.password_field}));
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
            message: '',
            user_id: props.user_id,
            name: props.name,
            text_color: props.text_color,
            login_color: props.login_color,

        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event){
        this.setState({message: event.target.value});
    }


    handleSubmit(event){
        this.setState({message: ''});
    }
    componentDidMount(){
        socket =  new WebSocket("ws://localhost:8080");
        socket.onmessage = (event) =>{
            let answer_obj = JSON.parse(event.data);
            console.log(answer_obj);
            
            switch(answer_obj.status_code){
                case "login_error":
                    this.setState({isLogFail: true});
                    break;
                default:
                    break;    
            }
        }
        socket.onopen = function(event){
            console.log("Connection is successful");
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
                <MessageWindow />
                <SideUsersBlock />
            </div>
            <UserInputForm onHandleSubmit = {this.handleSubmit} onHandleChange = {this.handleChange}/>
        </div>);
    }
}

class MessageWindow extends React.Component{
    render(){

        return <div></div>;
    }
}

class UserInputForm extends React.Component{
    constructor(props){
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            disabled: false,
        }
    }


    handleChange(e){
        this.props.onHandleChange(e);
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
            <input type = 'text' maxLength = {200} value = {this.props.message} onChange = {this.handleChange} placeholder = "Input your message..." />
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