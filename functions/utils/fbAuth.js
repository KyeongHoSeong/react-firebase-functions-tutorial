const { admin, db } = require('./admin');
//middle ware
// if login then ...write data, etc...
module.exports = (req, res, next) => {
    let idToken;
   if( // Refer to JWT
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer ') 
   ) {
       idToken = req.headers.authorization.split('Bearer ')[1];
   } else {
       console.error('No token found');
       return res.status(403).json({ error: 'Unauthorized' });
   }

   // auth의 정보를 users정보와 공유하여 사용자 관리
   // auth.Users.uid = (firestore)users.<<<handle?>>>.userId
   admin
     .auth()
     .verifyIdToken(idToken)
     .then((decodedToken) => {
       req.user = decodedToken;
       console.log(decodedToken);
       return db
         .collection('users')
         .where('userId', '==', req.user.uid)
         .limit(1)
         .get();
     })
     .then((data) => { // get user.hadle, and post to user package
      console.log(data.docs[0].data().handle);
       req.user.handle = data.docs[0].data().handle;
       req.user.imageUrl = data.docs[0].data().imageUrl;
       return next();
     })
     .catch((err) => { 
       console.error('Error   while verifying token', err);
       return res.status(403).json(err);
     });
}; 

/*(req, res, next) => {
    let idToken;
   if(
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer ') 
   ) {
       idToken = req.headers.authorization.split('Bearer ')[1];
   } else {
       console.error('No token found');
       return res.status(403).json({ error: 'Unauthorized' });
   }
   admin
     .auth()
     .verifyIdToken(idToken)
     .then((decodedToken) => {
       req.user = decodedToken;
       console.log(decodedToken);
       return db
         .collection('users')
         .where('userId', '==', req.user.uid)
         .limit(1)
         .get();
     })
     .then((data) => {
       req.user.handle = data.docs[0].data().handle;
       return next();
     })
     .catch((err) => {
       console.error('Error   while verifying token', err);
       return res.status(403).json(err);
     });
};
*/