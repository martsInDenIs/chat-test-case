const crypto = require('crypto');
const regExpr = /[&<>'";`]/g;
// const validChar = new Set(["<",">",'"',"'",';','&']);

module.exports.encodePassword = (password)=>{
    return crypto.createHash('md5').update(password).digest('hex');
}

module.exports.textControll = (text,leftBorder, rightBorder, hardCheck)=>{
    if(text.length < leftBorder || text.length > rightBorder) return '';
    
    if(hardCheck == true){
        const match = text.match(regExpr);
        console.log(match);
        if(match) return '';
    }

    return text.replace(regExpr, (char)=>'\\' + char);
};