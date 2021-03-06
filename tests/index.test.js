const test = require('ava');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const expiringSchemaPlugin = require('../');

const { VALID_FILTERS } = expiringSchemaPlugin;

// The tests that look things up will all reference tickets with this name.
// That way they won't interfere with other tests that will create new tickets.
const SHARED_TICKET_NAME = 'Darius Rucker';
const ONE_DAY = 24 * 60 * 60 * 100;
const ticketSchema = new mongoose.Schema({
  name: String,
  description: String,
});
ticketSchema.plugin(expiringSchemaPlugin);
const TicketModel = mongoose.model('ticket', ticketSchema);

const billSchema = new mongoose.Schema({ name: String });
billSchema.plugin(
  expiringSchemaPlugin,
  { defaultValidFilter: VALID_FILTERS.CURRENT_AND_FUTURE },
);
const BillModel = mongoose.model('bill', billSchema);

let mongoServer;
test.before(async () => {
  mongoServer = new MongoMemoryServer();
  const uri = await mongoServer.getConnectionString();
  await mongoose.connect(uri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await TicketModel.deleteMany({});

  // Valid from now until forever
  await TicketModel.create({ name: SHARED_TICKET_NAME });
  await BillModel.create({ name: SHARED_TICKET_NAME });

  // Valid forever
  await TicketModel.create({ name: SHARED_TICKET_NAME, validFrom: null });

  // Valid for next 1 day
  await TicketModel.create({
    name: SHARED_TICKET_NAME,

    validUntil: new Date(Date.now() + ONE_DAY),
  });

  // Valid from day after tomorrow until next day
  await TicketModel.create({
    name: SHARED_TICKET_NAME,
    validFrom: new Date(Date.now() + ONE_DAY + ONE_DAY),
    validUntil: new Date(Date.now() + ONE_DAY + ONE_DAY + ONE_DAY),
  });

  // Was valid until yesterday
  await TicketModel.create({
    name: SHARED_TICKET_NAME,
    validFrom: null,
    validUntil: new Date(Date.now() - ONE_DAY),
  });
});

test.after.always(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('validFrom defaults to current time', async (t) => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  const ticket = await TicketModel.create({ name: 'Nelly' });
  t.true(ticket.validFrom instanceof Date);
  t.true(ticket.validFrom.getTime() > fiveMinutesAgo, 'validFrom time should be within last 5 minutes');
  t.true(ticket.validFrom.getTime() <= Date.now(), 'validFrom time should be within last 5 minutes');
});

test('validFrom can be set in the past or future', async (t) => {
  const now = Date.now();

  await t.notThrowsAsync(
    TicketModel.create({ name: 'Lil Nas X', validFrom: new Date(now - ONE_DAY) }),
    'validFrom times in the past should be fine',
  );
  await t.notThrowsAsync(
    TicketModel.create({ name: 'Nipsy Hustle', validFrom: new Date(now + ONE_DAY) }),
    'validFrom times in the future should be fine',
  );
});

test('validFrom can be set to null', async (t) => {
  const ticket = await TicketModel.create({ name: 'Nelly', validFrom: null });
  t.is(ticket.validFrom, null);
});

test('validUntil defaults to null', async (t) => {
  const ticket = await TicketModel.create({ name: 'Jay-Z' });
  t.is(ticket.validUntil, null);
});

test('validUntil can be set in the past or future', async (t) => {
  const now = Date.now();

  await t.notThrowsAsync(
    TicketModel.create({
      name: 'Nas',
      validFrom: new Date(now - ONE_DAY - ONE_DAY),
      validUntil: new Date(now - ONE_DAY),
    }),
    'validUntil times in the past should be fine',
  );
  await t.notThrowsAsync(
    TicketModel.create({
      name: 'Nipsy Hustle',
      validUntil: new Date(now + ONE_DAY),
    }),
    'validUntil times in the future should be fine',
  );
});

test('validUntil must be greater or equal to validFrom', async (t) => {
  const now = Date.now();

  await t.throwsAsync(
    TicketModel.create({
      name: 'Nas',
      validFrom: new Date(now),
      validUntil: new Date(now - ONE_DAY),
    }),
    { name: 'ValidationError' },
  );
});

test('Query filters should not be added to id queries', async (t) => {
  const billName = 'Passion';
  // Past
  const bill = await BillModel.create({
    name: billName,
    validFrom: new Date(Date.now() - ONE_DAY - ONE_DAY),
    validUntil: new Date(Date.now() - ONE_DAY),
  });

  const resultBill = await BillModel.findById(bill.id).exec();
  t.truthy(resultBill, 'query by id should return object for not currently valid doc');
  t.is(resultBill.id, bill.id, 'should be same doc');
});

test('Query filters out invalid documents that already expired', async (t) => {
  const artistName = 'Nickleback';
  await TicketModel.create({
    name: artistName,
    validFrom: null,
    validUntil: new Date(Date.now() - ONE_DAY),
  });

  await TicketModel.create({
    name: artistName,
    validFrom: new Date(Date.now() - ONE_DAY - ONE_DAY),
    validUntil: new Date(Date.now() - ONE_DAY),
  });

  const validTicket = await TicketModel.create({
    name: artistName,
    validFrom: null,
    validUntil: new Date(Date.now() + ONE_DAY),
  });

  const results = await TicketModel.find({ name: artistName }).exec();
  t.is(results.length, 1, 'only a single, valid doc should come back');
  t.is(results[0].id, validTicket.id, 'it should be the correct document');
});

test('Query filters out invalid documents that are not valid yet', async (t) => {
  const artistName = 'Enya';
  await TicketModel.create({
    name: artistName,
    validFrom: new Date(Date.now() + ONE_DAY),
    validUntil: null,
  });

  await TicketModel.create({
    name: artistName,
    validFrom: new Date(Date.now() + ONE_DAY),
    validUntil: new Date(Date.now() + ONE_DAY + ONE_DAY),
  });

  const validTicket = await TicketModel.create({
    name: artistName,
    validFrom: null,
    validUntil: null,
  });

  const results = await TicketModel.find({ name: artistName }).exec();
  t.is(results.length, 1, 'only a single, valid doc should come back');
  t.is(results[0].id, validTicket.id, 'it should be the correct document');
});

test('Query handles validAsOf correctly', async (t) => {
  const twoAndHalfDaysOut = new Date(Date.now() + (ONE_DAY * 2.5));
  const results = await TicketModel.find({
    name: SHARED_TICKET_NAME,
    validAsOf: twoAndHalfDaysOut,
  }).exec();
  t.is(results.length, 3);
});

test('Count query applies correct filtering', async (t) => {
  const twoAndHalfDaysOut = new Date(Date.now() + (ONE_DAY * 2.5));
  const result = await TicketModel.countDocuments({
    name: SHARED_TICKET_NAME,
    validAsOf: twoAndHalfDaysOut,
  }).exec();
  t.is(result, 3);
});

test('Current and future filter should work', async (t) => {
  const billName = 'Hillsong United';
  // Past
  await BillModel.create({
    name: billName,
    validFrom: new Date(Date.now() - ONE_DAY - ONE_DAY),
    validUntil: new Date(Date.now() - ONE_DAY),
  });

  // Present
  const currentBill = await BillModel.create({
    name: billName,
    validFrom: Date.now() - ONE_DAY,
    validUntil: new Date(Date.now() + ONE_DAY),
  });

  // Future
  const futureBill = await BillModel.create({
    name: billName,
    validFrom: new Date(Date.now() + ONE_DAY),
    validUntil: new Date(Date.now() + ONE_DAY + ONE_DAY),
  });

  const results = await BillModel.find({ name: billName }).sort('validFrom').exec();
  t.deepEqual(
    results.map(result => result.id),
    [currentBill.id, futureBill.id],
    'the current and future docs should come back',
  );
});
