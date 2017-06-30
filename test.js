var sosa_datastore = require('./');
var assert = require('assert');

var state = {};

function ran (method) {
  state[method] || (state[method] = 0);
  state[method]++;
}

var DatastoreClient = require("@google-cloud/datastore")({
  projectId: 'crypto-bigquery',
  keyFilename: '/home/allenday/crypto-bigquery.json'
});

var collection_name = 'test_' + Math.random().toString(16).substring(2);
var collection = sosa_datastore({db: DatastoreClient});

var humans = collection('humans', {
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

// test null response
var testNull = function() {
	return new Promise(function(resolve, reject) {

		humans.load('carlos', function (err, human) {
			if(err) {
				assert.ifError(reject(err));
				reject(err);
			}

			resolve(human);
		});

	});
};


var testSave = function(save_obj) {

	return new Promise(function(resolve, reject) {
		humans.save(save_obj, function(err, human) {
			if(err) {
				assert.ifError(err);
				reject(err);
			}

			assert.deepEqual(save_obj, human);
			resolve(human);

		});
	});

};


var testSelect = function(selectObj) {
	return new Promise(function(resolve, reject) {

		humans.select(function (err, results) {

			if(err) {
				assert.ifError(err);
				reject(err);
			}

			assert.deepEqual(results, selectObj);

		});

	});
};

var carlos = { id: 'carlos', name: 'los' };
testNull()
	.then(testSave(carlos))
	.then(testSelect, console.error);
	.then(function(human) {
		assert.ifError(err);
		assert.deepEqual(carlos, human);
		assert.deepEqual(state, { save: 1, afterSave: 1, load: 1 });
	}, console.error);



/*


humans.load('carlos', function (err, human) {
	//assert.ifError(err);
	//assert.strictEqual(human, null);
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
						assert.deepEqual(results, [carlos, brian]);
						assert.deepEqual(state, {save: 2, afterSave: 2, load: 3});
						var nick = {id: 'nick', name: 'nick'};
						humans.save(nick, function (err, human) {
							assert.ifError(err);
							assert.deepEqual(nick, human);
							humans.select(function (err, results) {
								assert.ifError(err);
								assert.deepEqual(results, [carlos, brian, nick]);
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
														db.dropDatabase(function (err) {
															assert.ifError(err);
															db.close();
															console.log('passed');
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
});*/