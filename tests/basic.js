var test = require('tape');
var SimpleError = require('..');

test('should throw if no error name given', function (t) {
  t.throws(function () {
    var FaultyError = SimpleError.define();
  }, Error);
  t.end();
});

test('default error', function (t) {
  var DefaultError = SimpleError.define('DefaultError');
  var err = new DefaultError();

  t.ok(err instanceof Error);
  t.ok(err instanceof DefaultError);

  t.equal(err.name, 'DefaultError');
  t.equal(err.type, 'DefaultError');
  t.equal(err.code, 6001);
  t.equal(err.statusCode, 500);
  t.equal(err.message, 'Unknown');
  t.end();
});

test('basic error with custom values', function (t) {
  var BasicError = SimpleError.define('BasicError', {
    code: 1234,
    statusCode: 400,
    message: 'Wrong data supplied'
  });
  var err = new BasicError();

  t.equal(err.code, 1234);
  t.equal(err.statusCode, 400);
  t.equal(err.message, 'Wrong data supplied');
  t.end();
});

test('basic error with message formatting', function (t) {
   var BasicError = SimpleError.define('BasicError', {
    message: 'Wrong data [id: %s, countryCode: %s] supplied'
  });

  var err = new BasicError(101, 'eu');
  t.equal(err.message, 'Wrong data [id: 101, countryCode: eu] supplied');

  err = new BasicError(1, 'ru', 'hello');
  t.equal(err.message, 'Wrong data [id: 1, countryCode: ru] supplied hello');

  t.end();
});

test('error with custom methods', function (t) {
  var CustomError = SimpleError.define('BasicError', {
    methods: {
      customMessage: function () {
        return 'MESSAGE: ' + this.message;
      }
    }
  });
  var err = new CustomError('hello');
  t.equal(err.customMessage(), 'MESSAGE: hello');
  t.end();
});

test('error json formatting', function (t) {
   var BasicError = SimpleError.define('BasicError', {
    code: 1234,
    statusCode: 400,
    message: 'Wrong data supplied'
  });

  var err = new BasicError();

  var expected = {
    success: false,
    message: 'Wrong data supplied',
    statusCode: 400,
    code: 1234
  };

  t.equal(err.toJSON(), JSON.stringify(expected));
  t.end();

});

test('should not include stack trace in JSON by default', function (t) {
 var BasicError = SimpleError.define('BasicError', {
    code: 1234,
    statusCode: 400,
    message: 'Wrong data supplied'
  });

  var err = new BasicError();
  var result = JSON.parse(err.toJSON());
  t.notOk(result.hasOwnProperty('stack'));

  t.end();
});

test('test include stack trace in JSON output when set to true', function (t) {
   var BasicError = SimpleError.define('BasicError', {
    code: 1234,
    statusCode: 400,
    message: 'Wrong data supplied',
    showStack: true
  });

  var err = new BasicError();
  var result = JSON.parse(err.toJSON());
  t.ok(result.hasOwnProperty('stack'));

  t.end();
});
