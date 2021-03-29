import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

class LoginForm extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            name_field: "",
            password_field: ""
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
                console.error("The other id, that i didn't meet");
        }
    }

    handleSubmit(event){
        alert(this.state.name_field + " " + this.state.password_field);
        event.preventDefault();
    }




    render(){
        return (<div className = "loginBlock">
            <h3>Log in</h3>
            <form onSubmit = {this.handleSubmit}>
                <label><input type = 'text' id = 'login' placeholder = "Input login..." onChange = {this.handleChange}/></label>
                <label><input type = 'password' id = 'password' placeholder = "Input password..." onChange = {this.handleChange}/></label>
                <input type = 'submit' />
            </form>
        </div>);
    }
}


ReactDOM.render(<LoginForm />,document.getElementById("root"));