// Use this to make sure a field is there. If you use `.require(true)` it'll
// fail since `null` is valid and false-y.
module.exports = function dateNullValidator(val) {
  return val === null || val instanceof Date;
};
