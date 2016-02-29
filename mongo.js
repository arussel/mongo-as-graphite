var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var mongoUser = process.env.MONGO_USER;
var mongoPassword = process.env.MONGO_PASSWORD;
console.log(mongoUser + ' ' + mongoPassword);
var auth = "";
if(mongoUser && mongoPassword) {
    auth = mongoUser + ':' + mongoPassword + '@';
}
var url = 'mongodb://' + auth + 'localhost:27017/mpact';
var mongo = {
    findKeysStartingWith: function (callback, regex) {
        MongoClient.connect(url, function(err, db) {
            assert.equal(err, null);
            db.collection('mm.timeseries').distinct('key', {key: {$regex: (regex)}}, null, function (err, result) {
                assert.equal(err, null);
                db.close();
                callback(result);
            });
        });
    },
    findDatapoints: function(query, callback) {
        MongoClient.connect(url, function(err, db){
           assert.equal(err, null);
            db.collection('mm.timeseries').find(query).sort({key: 1, day: 1}).toArray(function(err, result){
                assert.equal(err, null);
                db.close();
                callback(result);
            });
        });
    }
};
module.exports = mongo;