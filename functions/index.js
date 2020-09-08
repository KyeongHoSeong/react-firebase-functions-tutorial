const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp();

const firebaseConfig = {
  
};



const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);


const db = admin.firestore();

app.get('/screams', (request, response) => {
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
}) 


app.post('/scream', (request, response) => {
  const newScream = {
    body: request.body.body,
    userHandle: request.body.userHandle,
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
});

//signup route

app.post("/signup", (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle,
  };

  //validate data
  let token, userId;
  //db.collection('users').doc()
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) { //handle이 존재하면 리턴
        return response
          .status(400)
          .json({ handle: "this handle is already taken" });
      } else { // handle 존재하지 않으면 새로운 계정 만들기
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      //return response.status(201).json({ token });
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        //userId: userId
        userId,
      };
      return db
        .doc(`/users/${newUser.handle}`)
        .set(userCredentials);
    })
    .then(() => {
      return response.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return response.status(400).json({ email: "email is already exist" });
      } else {
        return response.status(500).json({ error: err.code });
      }
    });
});

  // firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.passowrd)
  //   .then(data => {
  //     return response.status(200).json({ message: `user ${data.user.uid} signed up successuflly`});
  //   })
  //   .catch(err => {
  //     console.error(err);
  //     return response.status(500).json({error: err.code});
  //   })


exports.api = functions.region('asia-northeast3').https.onRequest(app);
