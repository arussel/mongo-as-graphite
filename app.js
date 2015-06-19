var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
var url = require('url');
var _ = require('lodash');
var mongo = require('./mongo.js');
var translator = require('./translator.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

app.get('/metrics/find/', function(req, res){
    var parsedUrl = url.parse(req.url);
    var query = parsedUrl.query.replace("query=", "");
    mongo.findKeysStartingWith(function (result) {
        res.send(translator.dbResultFromQuery(query, result));
    }, translator.findQueryToRegex(query));
});

app.post('/render', function(req, res) {
    var body = req.body;
    mongo.findDatapoints(translator.graphiteQueryToDBQuery(body.target, body.from, body.until), function(result){
        res.send(translator.dbResultFromDatapoints(result));
    });
});

module.exports = app;
