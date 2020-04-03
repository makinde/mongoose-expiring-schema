const { NULL_TYPE } = require('./constants');

module.exports = function validFilterCurrent(validAsOf) {
  return {
    $and: [
      {
        $or: [
          { validFrom: { $lte: validAsOf } },
          { validFrom: { $type: NULL_TYPE } },
        ],
      },
      {
        $or: [
          { validUntil: { $gte: validAsOf } },
          { validUntil: { $type: NULL_TYPE } },
        ],
      },
    ],
  };
};
