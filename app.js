const express = require('express');
const app = express();
// const path = require('path');
const { urlencoded } = require('express');

app.use(urlencoded({ extended: true }));

const courses = {
    class9th: {
        Math: ['Trignometry', 'circles'],
        Science: ['Heriditary', 'Respiration'],
        Sst: ['Climate', 'India Revoulation'],
    },
    class10th: {
        Math: ['Surface Area', 'Triangles'],
        Science: ['Electricity', 'Magnetism'],
        Sst: ['Industries', 'Food Revoulation'],
    }
}

app.get('/', (req, res) => {
    res.send(JSON.stringify(courses));
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`serving on port ${port}`);
})