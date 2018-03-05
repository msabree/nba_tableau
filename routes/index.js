var express = require('express');
var router = express.Router();
var moment = require('moment');
var request = require('request');
var btoa = require('btoa');
var fs = require('fs');

const NBA_SEASON = 'current'; // Change here for other options (e.g. 'current', 'latest', 'upcoming', 2016-playoff', '2016-2017-regular')
const AUTH = btoa('fake:fake'); // don't put stuff like this in github!
const FORMAT = 'json';

// get the games going on today (be careful with server date and games happening late.. server date may roll over to next day)
const getDailyGameSchedule = function() {

  var options = {
    url: `https://api.mysportsfeeds.com/v1.2/pull/nba/${NBA_SEASON}/daily_game_schedule.${FORMAT}?fordate=${moment().format('YYYYMMDD')}`,
    headers: {
      Authorization: `Basic ${AUTH}`, 
    }
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body));
      }
      else{
        reject({error, code: response.statusCode});
      }
    });
  });
}

// Fetch on an n-second interval
const startFetcher = function(arrGameIds) {
  console.log('new pull initiated');
  console.log(arrGameIds);
  const boxScorePromises = [];
  for(let i = 0; i < arrGameIds.length; i++){
    // Generate a dynamic url
    var options = {
      url: `https://api.mysportsfeeds.com/v1.2/pull/nba/${NBA_SEASON}/game_boxscore.${FORMAT}?gameid=${arrGameIds[i]}`,
      headers: {
        Authorization: `Basic ${AUTH}`, // don't put stuff like this in github!
      }
    };
    console.log(options.url);
    boxScorePromises.push(new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          resolve(JSON.parse(body));
        }
        else if(response.statusCode === 404){
          resolve({custom_message: 'Game may not have started yet.'})
        }
        else{
          reject({error, code: response.statusCode});
        }
      });
    }));
  }

  Promise.all(boxScorePromises).then((arrJsonResponses) => {
    console.log(arrJsonResponses.length)
  })
  .catch((err) => {
    console.log(err);
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {

  getDailyGameSchedule()
  .then((dailyGameJSON) => {
    const games = dailyGameJSON.dailygameschedule.gameentry;
    const ids = [];
    for(let i = 0; i < games.length; i++){
      const gameId = `${moment().format('YYYYMMDD')}-${games[i].awayTeam.Abbreviation}-${games[i].homeTeam.Abbreviation}`;
      ids.push(gameId);
    }

    // CREATE REFRESHER HERE
    const refreshEverySecs = 5;
    setInterval(startFetcher.bind(null, ids), refreshEverySecs * 1000);
  })
  .catch((error) => {
    console.log(error);
  })

  res.render('index', { title: 'Express' });
});

module.exports = router;
