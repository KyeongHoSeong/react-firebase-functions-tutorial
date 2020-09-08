const {db} = require ('../utils/admin')

exports.getAllScreams = (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        //screams.push(doc.data());
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err));
};


// post data
/* at test
{
    "body": "data daa body...",
    "userHandle" : "userHadle4"
}
*/
exports.postOneScream = (req, res) => {

    if(req.body.body.trim() === ""){
        return res.status(400).json({body: 'Body must not be empty'})
    }

  const newScreams = {
    body: req.body.body,
    //userHandle: req.body.userHandle,
    userHandle: req.user.handle,// passed through FBAuth
    //createdAt: admin.firestore.Timestamp.fromDate(new Date())
    createdAt: new Date().toISOString(),
  };

  db
    .collection("screams")
    .add(newScreams)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ eror: "something went wrong" });
      console.error(err);
    });
}