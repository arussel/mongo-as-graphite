var _ = require('lodash');
var moment = require('moment-timezone');
moment.tz.setDefault("America/Los Angeles");

function graphiteMomentToDay(gm) {
    if(gm === "now") {
        return parseInt(moment().format("YYYYMMDD"));
    } else if((typeof gm) == "number") {
        return parseInt(moment(gm * 1000).format("YYYYMMDD"));
    } else if((typeof gm) == "string") {
        var time = gm.substring(0, gm.length - 1);
        var key = gm.slice(-1);
        return parseInt(moment().add(parseInt(time), key).format("YYYYMMDD"))
    }
}

function dayAsIntToTimestamp(dayAsInt) {
    return moment("" + dayAsInt, "YYYYMMDD").unix();
}

var translator = {
    findQueryToRegex : function(query) {
        if(query === "*") {
            return "^"
        } else if (_.endsWith(query, "*")) {
            return "^" + query.replace(".", "\\.").replace("*", "");
        } else {
            return "^" + query;
        }
    },
    dbResultFromQuery: function(query, result) {
        if (!(query.indexOf("*") > -1)) {
            var last = _.some(result, function (key) {
                return key === query
            });
            return [{
                leaf: (last ? 1 : 0),
                context: {},
                text: _.last(query.split(".")),
                expandable: (last ? 0 : 1),
                id: query,
                allowChildren: (last ? 0 : 1)
            }];
        } else {
            return _.unique(_.map(result, function (key) {
                var queryWithNoStar = query.replace("*", "");
                var rests = key.replace(queryWithNoStar, "").split(".");
                var id = (queryWithNoStar.length == 0 ? "" : queryWithNoStar) + rests[0];
                var last = rests.length == 1;
                return {
                    leaf: (last ? 1 : 0),
                    context: {},
                    text: rests[0],
                    expandable: (last ? 0 : 1),
                    id: id,
                    allowChildren: (last ? 0 : 1)
                }
            }), false, function(elem) {
                return elem.id;
            });
        }
    },
    dbResultFromDatapoints: function(result) {
        return _.map(_.pairs(_.groupBy(result, 'key')), function(dp){
            var key = dp[0];
            var values = dp[1];
            return {
                target: key,
                datapoints: _.map(values, function(datapoint){
                    var day = datapoint.day;
                    var value = _.endsWith(key, "array") ? datapoint.value.length : datapoint.value;
                    return [value, dayAsIntToTimestamp(day)]
                })
            }
        });
    },
    graphiteQueryToDBQuery: function(targets, from, until) {
        if(!targets) {
            targets = [];
        } else if(typeof targets == "string") {
            targets = [targets];
        }
        return {
            key: {$in: targets},
            day: {$gte: graphiteMomentToDay(from), $lte: graphiteMomentToDay(until)}
        };
    }
};

module.exports = translator;