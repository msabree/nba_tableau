var express = require('express');
var router = express.Router();
var moment = require('moment');
var request = require('request');
var btoa = require('btoa');
var fs = require('fs');

// helper functions
const getDailyGameSchedule = function() {

  var options = {
    url: `https://api.mysportsfeeds.com/v1.2/pull/nba/current/daily_game_schedule.json?fordate=${moment().format('YYYYMMDD')}`,
    headers: {
      Authorization: `Basic ${btoa('FAKE:FAKE')}`, // don't put stuff like this in github!
    }
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        fs.writeFile('game_schedule.json', body, (err) => {
          if (err) throw err;
          console.log('The file has been saved!');
        });
      }
    });
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {

  getDailyGameSchedule();

  res.render('index', { title: 'Express' });
});

module.exports = router;
