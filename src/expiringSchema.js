const dateNullValidator = require('./dateNullValidator');
const validFilterCurrent = require('./validFilterCurrent');

module.exports = function expiringSchema(schema, installationOptions = {}) {
  const { defaultValidFilter: validFilter = validFilterCurrent } = installationOptions;

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

    // Check if the developer is getting their hands dirty and specifying the
    // range themselves. If so, don't add ranges to the query. The ball is in
    // their court.
    const queryFrom = Object.prototype.hasOwnProperty.call(queryConditions, 'validFrom');
    const queryUntil = Object.prototype.hasOwnProperty.call(queryConditions, 'validUntil');
    if (queryFrom || queryUntil) return next();

    // If this is a query for a specific id, don't bother the query
    const filterKeys = Object.keys(queryConditions);
    if (filterKeys.length === 1 && filterKeys[0] === '_id') return next();

    const validAsOf = queryConditions.validAsOf || new Date();
    delete queryConditions.validAsOf;

    this.find(validFilter(validAsOf));

    return next();
  }

  schema.pre('find', preFind);
  schema.pre('findOne', preFind);
  schema.pre('findOneAndDelete', preFind);
  schema.pre('findOneAndRemove', preFind);
  schema.pre('findOneAndReplace', preFind);
  schema.pre('findOneAndUpdate', preFind);
  schema.pre('count', preFind);
  schema.pre('countDocuments', preFind);
};
