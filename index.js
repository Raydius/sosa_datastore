var sosa = require('sosa')
  , backend = require('./datastore_backend')

module.exports = function (backend_options) {
  return sosa(backend, backend_options);
};
module.exports.backend = backend;
