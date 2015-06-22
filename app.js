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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
