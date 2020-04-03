module.exports = {
  // This will be used to check for `null` in the DB. Mongo will return documents
  // that don't have a field set if you just query for null the way you'd think.
  // See: https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
  NULL_TYPE: 10,
};
