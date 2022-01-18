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
const { async } = require('@firebase/util');
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

app.post('/findMentor/:studId', async (req, res) => {
    const { studId } = req.params;
    const { chosenCourse, chosenTiming, chosenTimeSlot, chosenDays } = req.body;
    // console.log(chosenCourse, chosenTiming, chosenTimeSlot,chosenDays);
    // console.log(typeof(chosenDays));
    // find Mentor 
    try {
        const matchingMentors = await db.collection('mentors')
            .where('course', '==', chosenCourse)
            .where('days', 'array-contains-any', chosenDays)
            .where('timing', '==', chosenTimeSlot)
            .get();
        var assignedMentorId;
        matchingMentors.forEach((mentor) => {
            assignedMentorId = mentor.id;
        });
        console.log(assignedMentorId);

        await db.collection('students').doc(studId).update({
            mentors: FieldValue.arrayUnion(assignedMentorId)
        });

        await db.collection('mentors').doc(assignedMentorId).update({
            students: FieldValue.arrayUnion({
                studId: studId,
                chosenCourse: chosenCourse,
                chosenTiming: chosenTiming,
                chosenTimeSlot: chosenTimeSlot,
                chosenDays: chosenDays,
            })
        })
        res.send('Done!');
    } catch (err) {
        console.log(err.code, err.message);
        res.send(err.message);
    }
})

app.get('/mentorInfo/:mentorId', async (req, res) => {
    const { mentorId } = req.params;
    try {
        const docRef = await db.collection('mentors').doc(mentorId).get();
        res.send(JSON.stringify(docRef.data()));
    } catch (err) {
        res.send(err.message);
    }
})

app.get('/studentInfo/:studId', async (req, res) => {
    const { studId } = req.params;
    try {
        const docRef = await db.collection('students').doc(studId).get();
        res.send(JSON.stringify(docRef.data()));
    } catch (err) {
        res.send(err.message);
    }
})

// Fetching user details
app.get('/getUserInfo/:id', async (req, res) => {
    const { id } = req.params;
    const userData = {};
    var docRef = await db.collection('students').doc(id).get();
    // console.log('1',docRef.data());
    if (!docRef.data()) docRef = await db.collection('mentors').doc(id).get();
    // console.log(docRef.data());s
    res.send(JSON.stringify(docRef.data()));
})

app.post('/scheduleClass/:mentorId', async (req, res) => {
    const { mentorId } = req.params;
    const { studId, dateOfMeet, timeOfMeet, meetLink, course } = req.body;
    try {
        await db.collection('mentors').doc(mentorId).update({
            upcomingClasses: FieldValue.arrayUnion({
                studId: studId,
                date: dateOfMeet,
                time: timeOfMeet,
                course: course,
                link: meetLink,
            })
        });
        await db.collection('students').doc(studId).update({
            upcomingClasses: FieldValue.arrayUnion({
                mentorId: mentorId,
                date: dateOfMeet,
                time: timeOfMeet,
                course: course,
                link: meetLink,
            })
        });
        res.send('Done');
    } catch (err) {
        console.log(err.message);
        res.send(err.message);
    }

})

app.post('/signUp', async (req, res) => {
    const { username, email, password, type } = req.body;
    // console.log(username, email, password, type);
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            // console.log(user, " --> SignUp successful");
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
                    mentors: [],
                }).then(() => {
                    // console.log('Added user');
                })
            } else if (type == 'Teach') {
                db.collection('mentors').doc(user.uid).set({
                    username: username,
                    email: email,
                    type: type,
                    upcomingClasses: [],
                    students: [],
                    days: [],
                    course: '',
                    timing: '',
                }).then(() => {
                    // console.log('Added user')
                })
            }
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // console.log(errorCode, errorMessage);
            res.send(errorMessage);
            // res.redirect(`/authSucc/${errorMessage}`);
        });
})


app.post('/signIn', async (req, res) => {
    // console.log(req.body);
    const { email, password } = req.body;
    // console.log(email, password);
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            // console.log(user.reloadUserInfo, " --> Signin successful");
            const userData = {
                userId: user.uid,
                token: user.accessToken,
                expirationTime: user.stsTokenManager.expirationTime,
            }
            res.send(JSON.stringify(userData));

        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // console.log(errorCode, errorMessage);
            res.send(errorMessage);
        });
    // res.send(userCredential);
})

app.post('/addCourseAndTime/:id', async (req, res) => {
    const { id } = req.params;
    const { course, timing, days } = req.body;
    try {
        await db.collection('mentors').doc(id).update({
            course: course,
            timing: timing,
            days: days
        })
        // console.log("updated");
        res.send('updated');
    } catch (err) {
        console.log(err);
        res.send(err);
    }

})

app.get('/updateUpcomingClassesList/:id', async (req, res) => {
    const { id } = req.params;
    const type = req.query.type;
    console.log(type);
    try {
        const docRef = await db.collection(type).doc(id).get();
        const prevClasses = docRef.data().upcomingClasses;
        // console.log(prevClasses);
        var classesToDelete = [];
        prevClasses.forEach(class_ => {
            // console.log(class_.date,class_.time);
            const d = class_.date.substring(0, 10) + ' 00:' + class_.time;
            const classTime = new Date(d);
            // console.log(classTime);
            if (classTime < new Date()) {
                console.log(d);
                classesToDelete.push(class_);
            }
        });
        if(classesToDelete.length != 0){
            await db.collection(type).doc(id).update({
                upcomingClasses: FieldValue.arrayRemove(...classesToDelete)
            })
        }
        res.send('Deleted')
    } catch (err) {
        console.log(err.message);
        res.send(err.message);

    }
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`serving on port ${port}`);
})