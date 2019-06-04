module.exports = function expiringSchema(schema) {
  // Add extra fields to schema
  schema.path('validFrom', Date);
  schema.path('validFrom').default(Date.now);
  schema.path('validFrom').index(true);

  schema.path('expiresAt', Date);
  schema.path('expiresAt').default(undefined);
  schema.path('expiresAt').index(true);

  // add preFind hooks
  function preFind(next) {
    const queryConditions = this.getQuery();

    if (
      Object.prototype.hasOwnProperty.call(queryConditions, 'validFrom')
      || Object.prototype.hasOwnProperty.call(queryConditions, 'expiresAt')
    ) {
      // The developer is getting their hands dirty and specifying the range
      // themselves. Ball is in their court.
      return next();
    }

    const validAsOf = queryConditions.validAsOf || Date.now();
    delete queryConditions.validAsOf;

    this.or([
      { validFrom: { $lte: validAsOf } },
      { validFrom: undefined },
    ]);

    this.or([
      { expiresAt: { $gte: validAsOf } },
      { expiresAt: undefined },
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
