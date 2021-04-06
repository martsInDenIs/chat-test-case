module.exports = {
    "up": "CREATE TABLE messages (id int PRIMARY KEY AUTO_INCREMENT, user int, text TEXT NOT NULL, date DATETIME NOT NULL, FOREIGN KEY(user) REFERENCES users(id))",
    "down": "DROP TABLE messages"
}