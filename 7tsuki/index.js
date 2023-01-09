const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const path = require('path');
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const upload = require('./upload.js');
app.use('/upload', upload)
app.listen(2053, () => console.log("服务器开启"))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/main.html');
});
app.use('/source', express.static('res'));
app.use('/res', express.static('static'));