const jwt = require('jsonwebtoken');

module.exports.getSecretKey = function(){
    return "jushlgkdq421la";
}



// try{
//     let a = jwt.sign({name: "Denis"},this.getSecretKey(),{expiresIn: 0});
//     jwt.verify(a,this.getSecretKey());
// }catch(err){
//     console.log(err.message);
// }

