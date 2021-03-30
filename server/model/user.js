class User{
    constructor(obj){
        this.id = obj.user_id;
        this.name = obj.name;
        // Создать метод для заполнения полей с цветами
        this.text_color = '#fff'; 
        this.name_color = '#fff';
    }
}

class BasicUser extends User{
    constructor(){
        super();
        this.mute = false;
        this.ban = false;
    }
}

class Admin extends User{
    constructor(){
        super();
        this.isAdmin = true;
    }
}