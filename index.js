const express = require('express');
const redis = require('redis');
const request = require('superagent');


// App
const app = express();



// Initialize Redis
const REDIS_PORT = process.env.REDIS_PORT;

const client = redis.createClient(REDIS_PORT);
client.on('error', (error) => {
    console.log('Redis client error: ', error.message);
});



// Request
const orgName = 'octokit';

const response = (numOfRepos, orgName) => {
    return `The organization ${ orgName } has ${ numOfRepos } public repositories.`;
};

const getNumberOfRepos = (req, res, next) => {
    
    request
        .get(`https://api.github.com/orgs/${ orgName }/repos`)
        .end( (error, resp) => {
            // console.log('Error: ', error, 'Response: ', res.body.length);
            
            if(error) {
                console.log('Error: ', error);
            }
            
            const numOfRepos =  resp.body.length;

            // this key will expire after x seconds
            client.set(orgName, numOfRepos, 'EX', 3600);

            res.send( response(numOfRepos, orgName) );
        });
        
};
    


// Cache
const cache = (req, res, next) => {
    
    client.get(orgName, (error, data) => {

        if(error) {
            console.log(error);
        }

        data !== null ? res.send( response(data, orgName) ) : next();

    });

};


    
// Routes
app.get('/repos', cache, getNumberOfRepos);



// Initalize server
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('Listening on port ', port);
});