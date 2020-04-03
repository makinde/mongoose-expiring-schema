const expiringSchema = require('./src/expiringSchema');
const validFilterCurrent = require('./src/validFilterCurrent');
const validFilterCurrentAndFuture = require('./src/validFilterCurrentAndFuture');

module.exports = Object.assign(expiringSchema, {
  VALID_FILTERS: {
    CURRENT: validFilterCurrent,
    CURRENT_AND_FUTURE: validFilterCurrentAndFuture,
  },
});
