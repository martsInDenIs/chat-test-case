import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

const socket = new WebSocket("ws://localhost:8080");


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
        socket.send(JSON.stringify({
            target: "login",
            login: this.state.name_field, 
            password: this.state.password_field
        }));
        event.preventDefault();
    }

    componentDidMount(){
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
            if(answer_obj.status_code === 'login_error'){
                this.setState({isLogFail: true});
            }
        }
        socket.onopen = function(event){
            console.log("Cennection is successful");
        }
        socket.onerror = function(error){
            console.log(error);
        }
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


ReactDOM.render(<LoginForm />,document.getElementById("root"));