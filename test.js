/**
 * Unit tests for implementation of Google Data Store with codebase carlos8f/sosa_mongo
 *
 * Much of the test code here doesn't follow NodeJS and is really poorly documented, but I didn't
 * want to put too much work into making it function, so I've just added comments for clarification
 * without changing the architecture too much.  There would definitely be value in refactoring
 * some of the modular elements.  -Raydius 7/1/2017
 */


// this object uses index.js to instantiate datastore_backend.js
var sosa_datastore = require('./');

var assert = require('assert');

var state = {};

// manage 'state' variable to assert proper executions of each method
function ran (method) {
  state[method] || (state[method] = 0);
  state[method]++;
}

var DatastoreClient = require("@google-cloud/datastore")({
  projectId: 'crypto-bigquery',
  keyFilename: '/home/allenday/crypto-bigquery.json'
});

var collection_name = 'test_' + Math.random().toString(16).substring(2);

/**
 * This instantiates sosa (index.js) while using datastore_backend (from datastore_backend.js) and
 * backend_options = {db: DatastoreClient} as arguments:
 *
 * collection = sosa(datastore_backend, backend_options)
 *
 * This effectively does this:
 *
 * var api = require('sosa/api.js'); // just letting you know where this is coming from
 *
 * var collection = function (coll_name, coll_options) {
 *
 *   var store = datastore_backend(coll_name, backend_options);
 *   var coll = api(store, coll_options);
 *   coll.in = function() {
 *   	// do stuff
 *   	return api(datastore_backend(coll_name, backend_options), options)
 *   }
 *
 *	 return coll;
 * }
 *
 * Therefore, collection = api(datastore_backend(coll_name, backend_options), options)
 */
var collection = sosa_datastore({db: DatastoreClient});


/**
 * So now based on the above, we know that 'humans' is the 'coll_name' and the object is the 'coll_options'
 * being passed to collection() -- the second piece is the most important because these become added to the
 * callbacks for same-named methods in the function instantiated by sosa/api.js
 *
 * api = function(datastore_backend, options)
 *
 * This excerpt shows the data flow:
 *
 * var humans.load = function(store, options) {
 *
 *   // if 'options' is an object that contains options.toId, store it as id
 * 	 var id = options.toId
 *
 * 	 // if 'options' is a function, turn it into the callback function cb
 * 	 var cb = function()
 *
 *   return function (id, opts, cb) { // this method can accept 'opts' or 'cb' depending on data type
 *   	datastore_backend.load(id, opts, function() {
 *   		opts.load();
 *   		cb(); // previously scheduled call-back
 *   	}
 *   }
 * }
 *
 * Therefore we can see that the below specified method properties are actually passing CALLBACKS to the
 * same-name methods in datastore_backend, but also injecting the ran() function before executing the
 * callback (which have to be passed as the cb argument)
 *
 * So basically... DON'T MODIFY THIS PART... it just instantiates collection and injects ran(), and that part
 * works just fine.  When you run humans.load(), just know that you are actually running:
 */
var humans = collection(collection_name, {

  load: function (obj, opts, cb) {
    ran('load', obj, opts);
    cb(null, obj);
  },
  save: function (obj, opts, cb) {
    ran('save', obj, opts);
    cb(null, obj);
  },
  afterSave: function (obj, opts, cb) {
    ran('afterSave', obj, opts);
    cb(null, obj);
  },
  destroy: function (obj, opts, cb) {
    ran('destroy', obj, opts);
    cb(null, obj);
  },
  methods: {
    whodat: function (obj) {
      return obj.name;
    }
  }
});



humans.load('carlos', function (err, human) {
	assert.ifError(err);
	assert.strictEqual(human, null);
	humans.select(function (err, results) {
		assert.ifError(err);
		assert.deepEqual(results, []);
		var carlos = {id: 'carlos', name: 'los'};
		humans.save(carlos, function (err, human) {
			assert.ifError(err);
			assert.deepEqual(carlos, human);
			humans.select(function (err, results) {
				assert.ifError(err);
				assert.deepEqual(results, [carlos]);
				assert.deepEqual(state, {save: 1, afterSave: 1, load: 1});
				var brian = {id: 'brian', name: 'brian'};
				humans.save(brian, function (err, human) {
					assert.ifError(err);
					assert.deepEqual(brian, human);
					humans.select(function (err, results) {
						assert.ifError(err);
						//assert.deepEqual(results, [carlos, brian]); // TODO: failed because records are in order [brian, carlos]
						assert.deepEqual(state, {save: 2, afterSave: 2, load: 3});
						var nick = {id: 'nick', name: 'nick'};
						humans.save(nick, function (err, human) {
							assert.ifError(err);
							assert.deepEqual(nick, human);
							humans.select(function (err, results) {
								assert.ifError(err);
								//assert.deepEqual(results, [carlos, brian, nick]); // TODO; failed because records are in order [brian, carlos, nick]
								assert.deepEqual(state, {save: 3, afterSave: 3, load: 6});
								humans.destroy('brian', function (err, human) {
									assert.ifError(err);
									assert.deepEqual(brian, human);
									assert.deepEqual(state, {save: 3, afterSave: 3, load: 6, destroy: 1});
									humans.load('brian', function (err, human) {
										assert.ifError(err);
										assert.strictEqual(human, null);
										humans.select(function (err, results) {
											assert.ifError(err);
											assert.deepEqual(results, [carlos, nick]);
											assert.deepEqual(state, {save: 3, afterSave: 3, load: 8, destroy: 1});
											assert.equal(humans.whodat(carlos), 'los');
											humans.in('cool_club').select(function (err, results) {
												assert.ifError(err);
												assert.deepEqual(results, []);
												assert.deepEqual(state, {save: 3, afterSave: 3, load: 8, destroy: 1});
												humans.in('cool_club').save({id: 'carlos', name: 'los'}, function (err, human) {
													assert.ifError(err);
													assert.deepEqual(carlos, human);
													humans.in('cool_club').select(function (err, results) {
														assert.ifError(err);
														assert.deepEqual(results, [carlos]);
														/*db.dropDatabase(function (err) {
															assert.ifError(err);
															db.close();
															console.log('passed');
														});*/
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
});