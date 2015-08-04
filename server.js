var unirest = require('unirest');
var express = require('express');
var events = require('events');
var async = require('async');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
               if(response.body.artists.items.length==0 ){
                   emitter.emit('error');
                   return emitter;
               }
               
               var artist = response.body.artists.items[0];

               unirest.get('https://spotify-recommend-climberwb.c9.io/related_artists/'+artist.id)
                       .end(function(response2) {
                           if(response2.body.length==0 ){
                               emitter.emit('error');
                               return emitter;
                           }
                           
                      
                             var tracks = function(relArtist,cb){
                                            unirest.get('https://api.spotify.com/v1/artists/'+relArtist.id+'/top-tracks?country=US')
                                                .end(function(responseTracks) {
                                                    if(response2.body.length==0 ){
                                                           emitter.emit('error');
                                                           return emitter;
                                                       }
                                                    relArtist['tracks'] = responseTracks.body.tracks;
                                                    return cb(null,relArtist);
                                                });
                                               
                                             } 
                              async.map(response2.body, tracks, function(err, results){
                                 artist['related'] = results;
                                 emitter.emit('end', artist);
                                 return results;
                             });
                 
                        });
                          
                });

    return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(data) {
        res.json(data);
        console.log('end');
       
    });

    searchReq.on('error', function() {
        console.log('error');
        res.sendStatus(404);
    });
});


var getRelatedArtFromApi = function(id) {
    var second_emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id+'/related-artists')
           .end(function(response) {
             //  console.log(response.body);
               if(response.body.artists.length==0 ){
                   second_emitter.emit('error');
                   return second_emitter;
               }
               //console.log(response);
               second_emitter.emit('end', response.body);
               
            });
    return second_emitter;
};
app.get('/related_artists/:id', function(req, res) {
    var searchReq = getRelatedArtFromApi(req.params.id);

    searchReq.on('end', function(item) {
        var artist = item.artists.items;
        console.log('end');
        res.json(item.artists);
    });

    searchReq.on('error', function() {
        console.log('error');
        res.sendStatus(404);
    });
});
app.listen(8080);