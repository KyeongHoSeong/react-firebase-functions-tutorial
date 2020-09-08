const { db } = require('../utils/admin');

const config = require('../utils/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const  { validateSignupData, validateLoginData} = require('../utils/validators');

exports.signup = (request, response) => {
    const newUser = {
      email: request.body.email,
      password: request.body.password,
      confirmPassword: request.body.confirmPassword,
      handle: request.body.handle,
    };
  
    const { valid, errors } = validateSignupData(newUser);

    if(!valid) return response.status(400).json(errors);

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
  };

//   exports.login = (request, response) => {
//     const user = {
//       email: request.body.email,
//       password: request.body.password,
//     };

//     const { valid, errors } = validateLoginData(user);

//     if (!valid) return response.status(400).json(errors);

//     firebase
//       .auth()
//       .signInWithEmailAndPassword(user.email, user.password)
//       .then((data) => {
//         return data.user.getIdToken();
//       })
//       .then((token) => {
//         return response.json({ token });
//       })
//       .catch((err) => {
//         console.error(err);
//         if (err.code === "auth/wrong-password") {
//           return response
//             .status(403)
//             .json({ general: "Wrong credentials, please try again" });
//         } else {
//           return response.status(500).json({ error: err.code });
//         }
//       });
//   };

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    

    const { valid, errors } = validateLoginData(user);
    if(!valid) return res.status(400).json(errors);

    firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password)
      .then((data) => {
        return data.user.getIdToken();
      })
      .then((token) => {
        return res.json({ token });
      })
      .catch((err) => {
        console.error(err);
        if (err.code === 'auth/user-not-found') {
          return res
            .status(403)
            .json({ general: 'Wrong user email, please try again' });
        } else if (err.code === "auth/wrong-password") {
          return res
            .status(403)
            .json({ general: "Wrong credentials, please try again" });
        } else
            return res.status(500).json({ error: err.code });
      });
}; 