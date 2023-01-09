const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
var multer = require('multer');
var upload = multer({
    dest: 'uploads/'
}).single('image')
router.post('/img:name', upload, (req, res) => {
    if (req.file.size > 5242880) { clear(req.file.path); return res.send('too big') }
    let extname = req.file.mimetype.split('/')[1]
    if (['png', 'jpg', 'jpeg', 'webp'].indexOf(extname) == -1) { clear(req.file.path); return res.send('not image') }
    fs.readFile(req.file.path, (err, data) => {
        if (err) { clear(req.file.path); return res.send('上传失败') }
        let time = Date.now() + parseInt(Math.random() * 999) + parseInt(Math.random() * 2222);
        let keepname = (req.path.split(':')[1] ? req.path.split(':')[1] : time) + '.' + extname
        fs.writeFile(__dirname + '/static/img/' + keepname, data, (err) => {
            if (err) { clear(req.file.path); return res.send('写入失败') }
            res.send({ err: 0, msg: '上传ok', data: '/res/img/' + keepname })
            clear(req.file.path)
        });
    });
})
module.exports = router;

function clear(path) {
    fs.unlink(__dirname + '/' + path, function (error) {
        if (error) {
            console.log(error);
            return false;
        }
    })
}