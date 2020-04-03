const { NULL_TYPE } = require('./constants');

module.exports = function validFilterCurrentAndFuture(validAsOf) {
  return {
    $or: [
      { validUntil: { $gte: validAsOf } },
      { validUntil: { $type: NULL_TYPE } },
    ],
  };
};
