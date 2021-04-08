module.exports = {
    "up": `INSERT INTO users(name,password,textColor,loginColor, mute, ban, isAdmin)\
             VALUES('dementor','63a9f0ea7bb98050796b649e85481845','#DAA520','#DAA520', false, false, true)` ,
    "down": "DELETE FROM users WHERE id = 1"
}