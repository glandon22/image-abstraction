var express = require('express');
var app = express();
var path = require('path');
var mongo = require('mongodb').MongoClient;
var dbUrl = 'mongodb://localhost:27017/abstraction';
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var autoIncrement = require('mongodb-autoincrement');
var history = [];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);

  } else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}

app.get('/', function(req,res) {
	//this address brings u to landing page. explains usage and such
});

app.get('/search/:term', function(req,res) {
	//where a user wil go when they want to retrieve images
	//console.log(req.params.term);
	var output = [];
	var term = req.params.term;
	console.log(term);
	var offset = req.query.offset;
	//if there is an offset param in url make user to add to link
	if (offset) {
		var url = 'https://www.googleapis.com/customsearch/v1?q=' + term + '&cx=018442205493622656496%3A8s3-ancyquq&num=10&searchType=image&start=' + offset + '&key=AIzaSyAVohYv0lK2upFi5mnRbRTdb6xIkpjpF1M';
	}

	else {
		var url = 'https://www.googleapis.com/customsearch/v1?q='  + term + '&cx=018442205493622656496%3A8s3-ancyquq&num=10&searchType=image&key=AIzaSyAVohYv0lK2upFi5mnRbRTdb6xIkpjpF1M';
	}

	var xhr = createCORSRequest('GET', url);

	if (!xhr) {
	  throw new Error('CORS not supported');
	}

	xhr.send();
	xhr.onload = function() {

		var date = new Date();
		var responseText = xhr.responseText;
		//console.log(responseText);
		responseText = JSON.parse(responseText);
		for (var i = 0; i < 10; i++) {
			var obj = {};
			obj.thumbnail = responseText.items[i].link;
			obj.snippet = responseText.items[i].snippet;
			obj.context = responseText.items[i].image.contextLink;
			output[i] = obj;
		}

		res.render('search', {results: output});
		mongo.connect(dbUrl, function(err, db) {
			if (err) {
				console.log(err);
				return; 
			}

			else {
				autoIncrement.getNextSequence(db, null, function (err, autoIndex) {
					if (err) {
						console.log(err);
						return;
					}

					else {
						var collection = db.collection('searches');
						collection.insert({
							_id: autoIndex,
							date: date,
							term: term
							}, function(err, data) {
								if (err) {
									console.log(err);
									return;
								}

								else {
									console.log(data);
								}
								
						});
					}	
				});
			}
		});
	};

	xhr.onerror = function() {
	  console.log('There was an error!');
	  return;
	};
});

app.get('/history', function(req,res) {
	mongo.connect(dbUrl, function(err, db) {
		if (err) {
			console.log(err);
			return;
		}

		else {
			var collection = db.collection('searches');
			collection.find({_id: {$gt: 0}}).toArray(function(err, data) {
				if (err) {
					console.log(err);
					return;
				}

				else {
					
					if (data.length > 10) {
						data = data.slice(data.length - 10, data.length);
					}
					data.reverse();
					res.render('history', {data: data});
				}
				
			});
		}

		
	})
});

app.listen(8080, function(req,res) {
	console.log('listening on 8080');
});