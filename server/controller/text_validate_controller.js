const regExpr = /[&<>'";`]/g;
const validChar = new Map([["<",'&lt'],[">",'&gt'],['"','&quot'],["'",'&apos'],[';','&#59'],['&','&amp']]);

module.exports.textControll = function(text,leftBorder, rightBorder, hardCheck){
    if(text.length < leftBorder || text.length > rightBorder) return '';
    
    if(hardCheck == true){
        const match = text.match(regExpr);
        console.log(match);
        if(match) return '';
    }

    return text.replace(regExpr, (char)=>validChar.get(char));
}