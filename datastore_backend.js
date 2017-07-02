var crypto = require('crypto');

module.exports = function (coll_name, backend_options) {
  backend_options || (backend_options = {});

  if (!backend_options.db) throw new Error('must pass a Datastore db connection with backend_options.db');
  var db = backend_options.db;

  function escapeBase64 (str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  function hash (id) {
    return escapeBase64(crypto.createHash('sha1').update(id).digest('base64'))
  }

  var coll_path = coll_name;
  if (backend_options.key_prefix && backend_options.key_prefix.length) {
    coll_path += '.' + backend_options.key_prefix.map(hash).join('.')
  }

  //var coll = db.collection(coll_path);
  var coll = coll_path;

  return {
    load: function (id, opts, cb) {
      db.get(db.key([coll, id]), function (err, doc) {
        if (err) return cb(err)

        // translate undefined to null
        if(doc === undefined) {
          doc = null;
        }

        cb(null, doc)
      });
    },
    //OK
    save: function (id, obj, opts, cb) {

      var doc = JSON.parse(JSON.stringify(obj));
      doc.timestamp = datetime.datetime.utcnow();

      db.save({ key: db.key([coll, id]), data: doc }, function(err) {
        cb(err, doc);
      });
    },
    //OK
    destroy: function (id, opts, cb) {
      this.load(id, {}, function (err, obj) {
        if (err) return cb(err);
        if (obj) {
          db.delete(db.key([coll, id]), function(err) {
            if (err) return cb(err);
            cb(null, obj);
          });
        }
      });
    },
    select: function (opts, cb) {
      if (typeof opts.query === 'undefined') opts.query = {};
      var cursor = db.createQuery(coll);

      if (typeof opts.project === 'object') console.log("TODO: cursor.project");
      if (typeof opts.comment === 'string') console.log("TODO: cursor.comment");
      if (typeof opts.hint    === 'object') console.log("TODO: cursor.hint");

      if (typeof opts.limit === 'number') cursor = cursor.limit(opts.limit);
      if (typeof opts.skip === 'number')  cursor = cursor.offset(opts.skip);
      if (typeof opts.sort === 'object')  {
        if (Object.keys(opts.sort).length > 1 ) console.log("TODO: support multiple sort fields");
        var sortKey = Object.keys(opts.sort)[0];
        var sortDir = Object.values(opts.sort)[0];
        var sortDescending = sortDir > 0 ? true : false;
        cursor = cursor.order(sortKey, {descending: sortDescending});
      }

      var docs = [];
      db.runQuery(cursor, function(err, entities, info) {
        docs = entities;
        console.log('docs', docs);
        cb(null, docs);
      });

/*
      cursor.runStream()
        .on('error', console.error)
        .on('data', function (entity) {
          docs.push(entity);
console.log(entity);
//console.log(docs);
        })
        .on('info', function() {})
        .on('end', function() {});
*/


    }
  };
};
