const { admin, db } = require('./admin');

//middle ware
// if login then ...write data, etc...
module.exports = (request, response, next) => {
    let idToken;
   if( // Refer to JWT
    request.headers.authorization && 
    request.headers.authorization.startsWith('Bearer ') 
   ) {
       idToken = request.headers.authorization.split('Bearer ')[1];
   } else {
       console.error('No token found');
       return response.status(403).json({ error: 'Unauthorized' });
   }

   // auth의 정보를 users정보와 공유하여 사용자 관리
   // auth.Users.uid = (firestore)users.<<<handle?>>>.userId
   admin
     .auth()
     .verifyIdToken(idToken)
     .then((decodedToken) => {
        request.user = decodedToken;
       console.log(decodedToken);
       return db
         .collection('users')
         .where('userId', '==', request.user.uid)
         .limit(1)
         .get();
     })
     .then((data) => { // get user.hadle, and post to user package
        request.user.handle = data.docs[0].data().handle;
        request.user.imageUrl = data.docs[0].data().imageUrl;
       return next();
     })
     .catch((err) => {
       console.error('Error   while verifying token', err);
       return response.status(403).json(err);
     });
};


