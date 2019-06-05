module.exports = function expiringSchema(schema) {
  // This will be used to check for `null` in the DB. Mongo will return documents
  // that don't have a field set if you just query for null the way you'd think.
  // See: https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
  const NULL_TYPE = 10;

  // Use this to make sure a field is there. If you use `.require(true)` it'll
  // fail since `null` is valid and false-y.
  function dateNullValidator(val) {
    return val === null || val instanceof Date;
  }

  // Add extra fields to schema
  schema.path('validFrom', Date);
  schema.path('validFrom').default(() => new Date());
  schema.path('validFrom').index(true);
  schema.path('validFrom').required(dateNullValidator);

  schema.path('validUntil', Date);
  schema.path('validUntil').default(null);
  schema.path('validUntil').index(true);
  schema.path('validUntil').required(dateNullValidator);
  schema.path('validUntil').validate({
    validator(validUntil) {
      // If dates are specified for both, they must be in the right order
      if (validUntil !== null && this.validFrom !== null) {
        return validUntil > this.validFrom;
      }
      return true;
    },
    msg: 'validUntil ({VALUE}) must be after validFrom',
  });

  // add preFind hooks
  function preFind(next) {
    const queryConditions = this.getQuery();

    if (
      Object.prototype.hasOwnProperty.call(queryConditions, 'validFrom')
      || Object.prototype.hasOwnProperty.call(queryConditions, 'validUntil')
    ) {
      // The developer is getting their hands dirty and specifying the range
      // themselves. Ball is in their court.
      return next();
    }

    const validAsOf = queryConditions.validAsOf || new Date();
    delete queryConditions.validAsOf;

    this.and([
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
    ]);

    return next();
  }

  schema.pre('find', preFind);
  schema.pre('findOne', preFind);
  schema.pre('findOneAndDelete', preFind);
  schema.pre('findOneAndRemove', preFind);
  schema.pre('findOneAndReplace', preFind);
  schema.pre('findOneAndUpdate', preFind);
};
