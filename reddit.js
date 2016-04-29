var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;  

module.exports = function RedditAPI(conn) {
  return {
    createUser: function(user, callback) {
      
      // first we have to hash the password...
      bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          conn.query(
            'INSERT INTO `users` (`username`,`password`, `createdAt`) VALUES (?, ?, ?)', [user.username, hashedPassword, null],
            function(err, result) {
              if (err) {
                /*
                There can be many reasons why a MySQL query could fail. While many of
                them are unknown, there's a particular error about unique usernames
                which we can be more explicit about!
                */
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                /*
                Here we are INSERTing data, so the only useful thing we get back
                is the ID of the newly inserted row. Let's use it to find the user
                and return it
                */
                conn.query(
                  'SELECT `id`, `username`, `createdAt`, `updatedAt` FROM `users` WHERE `id` = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      /*
                      Finally! Here's what we did so far:
                      1. Hash the user's password
                      2. Insert the user in the DB
                      3a. If the insert fails, report the error to the caller
                      3b. If the insert succeeds, re-fetch the user from the DB
                      4. If the re-fetch succeeds, return the object to the caller
                      */
                        callback(null, result[0]);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },
    createPost: function(post, callback) {
      conn.query(
        'INSERT INTO `posts` (`userId`, `title`, `url`, `createdAt`) VALUES (?, ?, ?, ?)', [post.userId, post.title, post.url, null],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT `id`,`title`,`url`,`userId`, `createdAt`, `updatedAt` FROM `posts` WHERE `id` = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
    getAllPosts: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      
      conn.query(`
        SELECT posts.id AS posts_id, posts.title AS posts_title, 
        posts.url AS posts_url, posts.createdAt AS posts_createdAt, 
        posts.updatedAt AS posts_updatedAt, posts.userId AS posts_userId,
        users.id AS users_id, users.username AS users_username, 
        users.createdAt AS users_createdAt, users.updatedAt AS users_updatedAt
        FROM posts
        JOIN users
        ON posts.userId=users.id
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(results.map(function(obj) {
              var rObj = {};
              rObj.id = obj.posts_id;
              rObj.title = obj.posts_title;
              rObj.url = obj.posts_url;
              rObj.createdAt = obj.posts_createdAt;
              rObj.updatedAt = obj.posts_updatedAt;
              rObj.userId = obj.posts_userId;
              rObj.users = {}
                  rObj.users.id = obj.users_id;
                  rObj.users.username = obj.users_username;
                  rObj.users.createdAt = obj.users_createdAt;
                  rObj.users.updatedAt = obj.users_updatedAt;
              return rObj;
            }));
          }
        }
      );
    },
    getAllPostsForUser: function(userId, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      
      var sqlQuery = `
        SELECT posts.id AS posts_id, posts.title AS posts_title, 
        posts.url AS posts_url, posts.createdAt AS posts_createdAt, 
        posts.updatedAt AS posts_updatedAt, posts.userId AS posts_userId,
        users.id AS users_id, users.username AS users_username, 
        users.createdAt AS users_createdAt, users.updatedAt AS users_updatedAt
        FROM posts
        JOIN users
        ON posts.userId=users.id
        WHERE users.id=${userId}  
        
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?
        `
      conn.query(sqlQuery, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          } 
          else if (results.length === 0) {
            console.log("User ID does not exist");
            return;
          }
          else {
            callback(results.map(function(obj) {
              var rObj = {};
              rObj.id = obj.posts_id;
              rObj.title = obj.posts_title;
              rObj.url = obj.posts_url;
              rObj.createdAt = obj.posts_createdAt;
              rObj.updatedAt = obj.posts_updatedAt;
              rObj.userId = obj.posts_userId;
              rObj.users = {}
                  rObj.users.id = obj.users_id;
                  rObj.users.username = obj.users_username;
                  rObj.users.createdAt = obj.users_createdAt;
                  rObj.users.updatedAt = obj.users_updatedAt;
              return rObj;
            }));
          }
        }
      );
    },
    getSinglePost: function(postId, callback) {
      
      var sqlQuery = `
        SELECT posts.id AS posts_id, posts.title AS posts_title, 
        posts.url AS posts_url, posts.createdAt AS posts_createdAt, 
        posts.updatedAt AS posts_updatedAt, posts.userId AS posts_userId,
        users.id AS users_id, users.username AS users_username, 
        users.createdAt AS users_createdAt, users.updatedAt AS users_updatedAt
        FROM posts
        JOIN users
        ON posts.userId=users.id
        WHERE posts.id=${postId}  
        
        ORDER BY posts.createdAt DESC
        `
      conn.query(sqlQuery,
        function(err, results) {
          if (err) {
            callback(err);
          } 
          else if (results.length === 0) {
            console.log("Post ID does not exist");
            return;
          }
          else {
            callback(results.map(function(obj) {
              var rObj = {};
              rObj.id = obj.posts_id;
              rObj.title = obj.posts_title;
              rObj.url = obj.posts_url;
              rObj.createdAt = obj.posts_createdAt;
              rObj.updatedAt = obj.posts_updatedAt;
              rObj.userId = obj.posts_userId;
              rObj.users = {}
                  rObj.users.id = obj.users_id;
                  rObj.users.username = obj.users_username;
                  rObj.users.createdAt = obj.users_createdAt;
                  rObj.users.updatedAt = obj.users_updatedAt;
              return rObj;
            }));
          }
        }
      );
    },
    createSubreddit: function(sub, callback) {
        conn.query(
          'INSERT INTO `subreddits` (`name`, `description`, `createdAt`) VALUES (?, ?, ?)', [sub.name, sub.description, null],
          function(err, result) {
            if (err) {
              callback(err);
            }
            else {
              /*
              sub inserted successfully. Let's use the result.insertId to retrieve
              the sub and send it to the caller!
              */
              conn.query(
                'SELECT `id`,`name`,`description`, `createdAt`, `updatedAt` FROM `subreddits` WHERE `id` = ?', [result.insertId],
                function(err, result) {
                  if (err) {
                    callback(err);
                  }
                  else {
                    callback(result[0]);
                  }
                }
              );
            }
          }
        );
      },  
      getAllSubreddits: function(callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      // if (!callback) {
      //   callback = options;
      //   options = {};
      // }
      // var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      // var offset = (options.page || 0) * limit;
      
      conn.query(`
        SELECT subreddits.id AS subreddits_id, subreddits.name AS subreddits_name, 
        subreddits.description AS subreddits_description, subreddits.createdAt AS subreddits_createdAt, 
        subreddits.updatedAt AS subreddits_updatedAt
        FROM subreddits
        ORDER BY subreddits.createdAt DESC
        `,
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(results);
            // callback(results.map(function(obj) {
            //   var rObj = {};
            //   rObj.id = obj.posts_id;
            //   rObj.title = obj.posts_title;
            //   rObj.url = obj.posts_url;
            //   rObj.createdAt = obj.posts_createdAt;
            //   rObj.updatedAt = obj.posts_updatedAt;
            //   rObj.userId = obj.posts_userId;
            //   rObj.users = {}
            //       rObj.users.id = obj.users_id;
            //       rObj.users.username = obj.users_username;
            //       rObj.users.createdAt = obj.users_createdAt;
            //       rObj.users.updatedAt = obj.users_updatedAt;
            //   return rObj;
            // }));
          }
        }
      );
    },
    
    
    
  }
}
