var test = require('tape');
var SimpleError = require('..');

var ApiError = SimpleError.define('ApiError', {
  code: 5005,
  statusCode: 500,
  message: 'api error',
  methods: {
    hello: function () {
      return 'elo: ' + this.message;
    }
  }
});

var NotFoundError = ApiError.define('NotFoundError', {
  code: 4004,
  statusCode: 404,
  message: 'not found',
  methods: {
    notFound: function () {
      return 'nowhere to be found';
    }
  }
});

test('api error', function (t) {
  var err = new ApiError();

  t.equal(err.code, 5005);
  t.equal(err.statusCode, 500);
  t.equal(err.message, 'api error');

  t.ok(err instanceof Error);
  t.ok(err instanceof ApiError);

  t.equal(err.hello(), 'elo: api error');

  t.end();
});

test('not found error', function (t) {
  var err = new NotFoundError();

  t.equal(err.code, 4004);
  t.equal(err.statusCode, 404);
  t.equal(err.message, 'not found');

  t.ok(err instanceof Error);
  t.ok(err instanceof ApiError);
  t.ok(err instanceof NotFoundError);

  t.equal(err.hello(), 'elo: not found');
  t.equal(err.notFound(), 'nowhere to be found');

  t.end();
});

test('should throw if no error name given', function (t) {
  t.throws(function () {
    ApiError.define({});
  }, Error);
  t.end();
});

test('should throw if given name is empty', function (t) {
  t.throws(function () {
    ApiError.define('', {});
  }, Error);
  t.end();
});
