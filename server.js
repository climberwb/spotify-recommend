var unirest = require('unirest');
var express = require('express');
var events = require('events');


var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
               if(response.body.artists.items.length==0 ){
                   emitter.emit('error');
                   return emitter;
               }
               
               //
               var artist = response.body.artists.items[0];
               console.log(response.body);
               unirest.get('https://spotify-recommend-climberwb.c9.io/related_artists/'+artist.id)
                       .end(function(response2) {
                           console.log(response2);
                           if(response2.body.length==0 ){
                               emitter.emit('error');
                               return emitter;
                            //   return emitter;
                            console.log('error');
                           }
                           artist['related'] = response2.body;
                           emitter.emit('end', artist);
                          // response.json(response.body);
                          
                        });

            });
            console.log(emitter);
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
        console.log(data);
        res.json(data);
        //var artist = item.artists.items[0];
       // var artist_id = artist.id;//added
        console.log('end');
        //return artist_id;//added
        //res.json(string[2]);
       // res.json(artist);
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
    console.log(req.params.id);
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