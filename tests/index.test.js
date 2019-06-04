const test = require('ava');
// const expiringSchemaPlugin = require('../');

test.todo('validFrom defaults to current time');
test.todo('validFrom can be set in the past or future');
test.todo('expiresAt defaults to undefined');
test.todo('expiresAt can be set in the past or future');
test.todo('expiresAt must be greater or equal to validFrom');
test.todo('Query filters out invalid documents that already expired');
test.todo('Query filters out invalid documents that are not valid yet');
test.todo('Query includes docs with validFrom');
test.todo('Query includes docs with expiresAt');
test.todo('Query handles validAsOf correctly');
test.todo('Query not affected when validFrom is specified');
test.todo('Query not affected when expiresAt is specified');
test.todo('Query not affected when validFrom and expiresAt are specified');
