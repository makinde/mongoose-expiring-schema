# mongoose-expiring-schema

A schema plugin that allows documents to have expiration dates, and defaults queries to respect these.

This plugin is meant to be used on a class of documents that is only valid for a certain period of time. That mainly means that the document might have a validFrom date (which means it is only valid AFTER the specific time) and an expiresAt date (which means it is only valid until that date). Either of these values can be null, which means the document is valid indefinitely on that end.

When querying for documents that have this plugin, by default, documents will only be returned if they are currently valid.

## Getting Started

```
const ExpiringSchemaPlugin = require('mongoose-expiring-schema');
const TicketSchema = new mongoose.Schema({ concertId: String });

TicketSchema.plugin(ExpiringSchemaPlugin);

// Create some new tickets
// TODO

// Results will only contain tickets that are unexpired
// TODO
const result = await Model.find({}, 'real_key virtual_key').lean().exec();

// Run a query like this to ignore expiration
// TODO
```

### Installing

```
npm install mongoose-expiring-schema
```

## Running the tests

Tests written using [`ava`](https://www.npmjs.com/package/ava) framework. Run them using:

```
npm test
```

## Deployment

Designed for use in node environments, currently no build process. Supports node 8 and above.

## Contributing

Please feel free to fork and submit pull requests

## Versioning

We use [SemVer](http://semver.org/) for versioning and [np](https://www.npmjs.com/package/np) for to publish releases.

## Authors

* **Makinde Adeagbo** - [makinde (github)](https://github.com/makinde)

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details
