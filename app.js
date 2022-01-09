const express = require('express');
const app = express();
const firebase = require("firebase/app");
// const path = require('path');
const { urlencoded, json } = require('express');

app.use(urlencoded({ extended: true }));
app.use(express.json());

// Firebase Firestore
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require("./gyandaan-19f42-firebase-adminsdk-s3gqj-96d164c7c6.json");
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

// Firebase Auth
const firebaseConfig = {
    apiKey: "AIzaSyA73VSwU-UKQVOFm2bEZO93iYEfjDhWuF8",
    authDomain: "gyandaan-19f42.firebaseapp.com",
    projectId: "gyandaan-19f42",
    storageBucket: "gyandaan-19f42.appspot.com",
    messagingSenderId: "246523796593",
    appId: "1:246523796593:web:c0b0ace676e21f65cf8fd0"
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
const auth = getAuth();

app.get('/', async (req, res) => {
    res.send('Working....');
})

app.get('/courses', async (req, res) => {
    var listOfCourses = [];

    const courseDb = await db.collection('courses').get();
    courseDb.forEach((course) => {
        listOfCourses.push({
            courseName: course.id,
            courseInfo: course.data(),
        })
    });
    // listOfCourses.forEach((ele) => console.log(ele))
    res.send(JSON.stringify(listOfCourses));


})

// app.get('/students/:id', async (req, res) => {
//     const { id } = req.params;
//     console.log(id);
//     const stdData = await db.collection('students').doc(id).get();
//     // await  db.collection('students').doc(id).update({mentor: 'Rock'});
//     res.send(JSON.stringify(stdData.data()));
// })

app.post('/addMentor/:id', async (req, res) => {
    const { id } = req.params;
    const { mentorId } = req.body;
    console.log(mentorId, id);

    var mentorList = [];
    const studDataRef = db.collection('students').doc(id);
    const studData = await studDataRef.get();
    console.log(studData.data());
    mentorList = studData.data().mentors;
    mentorList.push(mentorId);
    await studDataRef.update({ mentors: mentorList });
    res.send("Done");
})

// app.get('/mentors/:id', async (req, res) => {
//     const { id } = req.params;
//     console.log(id);
//     const mentorData = await db.collection('mentors').doc(id).get();
//     res.send(JSON.stringify(mentorData.data()));
// })

// app.post('/addMentee/:id', async (req, res) => {

// })


// app.post('/findMentor', async (req, res) => {

// })


app.post('/signUp', async (req, res) => {
    const { username, email, password, type } = req.body;
    console.log(username, email, password, type);
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log(user, " --> SignUp successful");
            // res.statusCode = 400;
            const userData = {
                userId: user.uid,
                token: user.accessToken,
                expirationTime: user.stsTokenManager.expirationTime,
            }
            res.send(JSON.stringify(userData));

            // todo :: add user to database
            if (type == 'Learn') {
                db.collection('students').doc(user.uid).set({
                    username: username,
                    email: email,
                    type: type,
                    upcomingClasses: [],
                    nentors: [],
                }).then(() => {
                    console.log('Added user');
                })
            } else if (type == 'Teach') {
                db.collection('mentors').doc(user.uid).set({
                    username: username,
                    email: email,
                    type: type,
                    upcomingClasses: [],
                    students: [],
                    course: '',
                    timing: '',
                }).then(() => {
                    console.log('Added user')
                })
            }
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            res.send(errorMessage);
            // res.redirect(`/authSucc/${errorMessage}`);
        });
})


app.post('/signIn', async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    console.log(email, password);
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log(user.reloadUserInfo, " --> Signin successful");
            const userData = {
                userId: user.uid,
                token: user.accessToken,
                expirationTime: user.stsTokenManager.expirationTime,
            }
            res.send(JSON.stringify(userData));

            // todo :: retrieve id of user and send it
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            res.send(errorMessage);
        });
    // res.send(userCredential);
})

// Fetching user details
app.get('/getUserInfo/:id', async (req, res) => {
    const { id } = req.params;
    const userData = {};
    var docRef = await db.collection('students').doc(id).get();
    // console.log('1',docRef.data());
    if (!docRef.data()) docRef = await db.collection('mentors').doc(id).get();
    // console.log(docRef.data());
    res.send(JSON.stringify(docRef.data()));
})



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`serving on port ${port}`);
})