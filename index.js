// load the mysql library
var mysql = require('mysql');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'derlloyd', 
  password : '',
  database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);

// It's request time!
// redditAPI.createUser({
//   username: 'big boy',
//   password: 'xxx'
// }, function(err, user) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     redditAPI.createPost({
//       title: 'bye reddit!',
//       url: 'https://www.reddit.com',
//       userId: user.id
//     }, function(err, post) {
//       if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(post);
//       }
//     });
//   }
// });


// redditAPI.createSubreddit({name: 'cats', description: 'all about cats'}, console.log);
// redditAPI.getAllSubreddits(console.log);
// redditAPI.createPost({userId: '2', title: 'this is a post about something', url: 'www.google.com', subredditId: '3'  }, console.log);

redditAPI.getAllPosts({numPerPage: 20, page: 0}, console.log);
