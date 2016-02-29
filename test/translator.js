var assert = require("assert")
var translator = require("../translator.js");
var moment = require('moment');

describe('Translator', function () {
    describe('#findQueryToRegex(*)', function () {
        it('should return an empty regex', function () {
            assert.equal("^", translator.findQueryToRegex("*"))
        });
    });
    describe('#findQueryToRegex(a)', function () {
        it('should return a plain regex', function () {
            assert.equal("^a", translator.findQueryToRegex("a"))
        })
    });
    describe('#findQueryToRegex(a.*)', function () {
        it('should return a query with escaped dot', function () {
            assert.equal("^a\\.", translator.findQueryToRegex("a.*"));
        });
    });
    describe('#dbResultFromQuery', function () {
        it('should return an element per first field for a star query', function () {
            var dbResult = ["a.b.c1", "a.b.c2", "a1.b.c4"];
            var query = "*";
            var expectedResult = [
                {"leaf": 0, "context": {}, "text": "a", "expandable": 1, "id": "a", "allowChildren": 1},
                {"leaf": 0, "context": {}, "text": "a1", "expandable": 1, "id": "a1", "allowChildren": 1}
            ];
            assert.deepEqual(expectedResult, translator.dbResultFromQuery(query, dbResult));
        });
        it('should return an element per next field for a text star query', function () {
            var dbResult = ["a.b.c1", "a.b.c2", "a.b1.c4"];
            var query = "a.*";
            var expectedResult = [
                {"leaf": 0, "context": {}, "text": "b", "expandable": 1, "id": "a.b", "allowChildren": 1},
                {"leaf": 0, "context": {}, "text": "b1", "expandable": 1, "id": "a.b1", "allowChildren": 1}
            ];
            assert.deepEqual(expectedResult, translator.dbResultFromQuery(query, dbResult));
        });
        it('should return a single element for a plain query', function () {
            var dbResult = ["a.b.c1", "a.b.c2", "a.b1.c4"];
            var query = "a.b";
            var expectedResult = [
                {"leaf": 0, "context": {}, "text": "b", "expandable": 1, "id": "a.b", "allowChildren": 1}
            ];
            assert.deepEqual(expectedResult, translator.dbResultFromQuery(query, dbResult));
            query = "a.b.c1";
            dbResult = ["a.b.c1"];
            var expectedResult = [
                {"leaf": 1, "context": {}, "text": "c1", "expandable": 0, "id": "a.b.c1", "allowChildren": 0}
            ];
            assert.deepEqual(expectedResult, translator.dbResultFromQuery(query, dbResult));
        });
    });
    describe('#graphiteQueryToDBQuery', function () {
        it('should create a query from timestamp', function () {
            var query = translator.graphiteQueryToDBQuery(["a.b.c", "x.y.z"], 1419133439, 1434681959);
            assert.deepEqual(query, {
                aliasedMapping: {
                    "a.b.c": "a.b.c",
                    "x.y.z": "x.y.z"
                },
                query: {
                    key: {$in: ["a.b.c", "x.y.z"]}, day: {$gte: 20141221, $lte: 20150619}
                }
            });
        });
        it('should create a query from a single target', function () {
            var query = translator.graphiteQueryToDBQuery("a.b.c", 1419133439, 1434681959);
            assert.deepEqual(query, {
                aliasedMapping: {
                    "a.b.c": "a.b.c"
                },
                query: {key: {$in: ["a.b.c"]}, day: {$gte: 20141221, $lte: 20150619}}
            });
        });
        it('should create a query from a range', function () {
            var query = translator.graphiteQueryToDBQuery(["a.b.c", "x.y.z"], "-120d", "-1h");
            assert.deepEqual(query.query.key, {$in: ["a.b.c", "x.y.z"]});
            var start = query.query.day.$gte;
            var end = query.query.day.$lte;
            var startM = moment("" + start, "YYYYMMDD");
            var endM = moment("" + end, "YYYYMMDD");
            assert.equal(endM.from(startM), "in 4 months");
        });
    });
    describe('#dbResultFromDatapoints', function () {
        it('should return a graphite array', function () {
            var dbDatapoints = [{day: 20150101, key: "a.b.c.array", value: [1]},
                {day: 20150301, key: "a.b.c.array", value: [1, 2]},
                {day: 20150601, key: "a.b.c.array", value: [1, 2, 3]},
                {day: 20150101, key: "a.b.d.daily", value: 10},
                {day: 20150301, key: "a.b.d.daily", value: 13},
                {day: 20150601, key: "a.b.d.daily", value: 15}];
            var result = [{target: "a.b.c.array", datapoints: [[1, 1420066800], [2, 1425164400], [3, 1433109600]]},
                {target: "a.b.d.daily", datapoints: [[10, 1420066800], [13, 1425164400], [15, 1433109600]]}];
            assert.deepEqual(translator.dbResultFromDatapoints(dbDatapoints), result);
        });
    });
});