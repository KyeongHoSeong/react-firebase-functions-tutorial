const {db} = require ('../utils/admin')

exports.getAllScreams = (request, response) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        //screams.push(doc.data());
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return response.json(screams);
    })
    .catch(err => {
      console.error(err);
    });
}

// post data
/* at test
{
    "body": "data daa body...",
    "userHandle" : "userHadle4"
}
*/
exports.postOneScream = (request, response) => {

  if(request.body.body.trim() === '') {
    return response.status(400).json({ body: "body must not be empty"});
  }
  const newScream = {
    body: request.body.body,
    //userHandle: request.body.userHandle,
    userHandle: request.user.handle,
    //createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    uceatedAt: new Date().toISOString()
  };

  db
    .collection("screams")
    .add(newScream)
    .then((doc) => {
      response.json({ message: `document ${doc.id} cteated successfully` });
    })
    .catch((err) => {
      response.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
}