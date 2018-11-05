var express = require("express");
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.listen(process.env.PORT || 3000, () => {
 console.log("Server running on port 3000");
});

app.get("/transformationData", (req, res, next) => {
    var fs = require('fs');
    var obj;
    fs.readFile('../../data/DataTransformation.json', 'utf8', function (err, data) {
        if (err) throw err;
        obj = JSON.parse(data);
        res.json(obj['dataTransformation']['data']);
    });
});

app.post("/saveTransformation", (req, res) => {
    var source = req.body.source;
    
    var toSave = {    
        "dataTransformation": {
            "data": source === [] ? [] : source
        }
    };

    var fs = require('fs');
    fs.writeFile('../../data/DataTransformation.json', JSON.stringify(toSave), 'utf8', function(err) {
        if (err) {
            return console.log(err);
        }
        res.send({ msg: "success" });
    });
});