module.exports = {
    "up": "CREATE TABLE users(id int PRIMARY KEY AUTO_INCREMENT, name varchar(25) NOT NULL UNIQUE,\
            password varchar(200) NOT NULL, textColor varchar(20) NOT NULL, loginColor varchar(20) NOT NULL, mute BOOLEAN NOT NULL,\
             ban BOOLEAN NOT NULL, isAdmin BOOLEAN NOT NULL)",
    "down": "DROP TABLE users"
}