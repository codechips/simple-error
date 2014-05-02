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

var ErrorWithCtor = ApiError.define('ErrorWithCtor', {
  code: 0,
	message: '',
  ctor: function(message, opts) {
		if (message) {
			this.message = message;
		}
    if (opts) {
      if (opts.code) {
        this.code = opts.code;
      }
      if (opts.statusCode) {
        this.statusCode = opts.statusCode;
      }
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

test('should allow to define suberror with only name given', function (t) {
  var EmptyError = ApiError.define('EmptyError');
  var err = new EmptyError();
  t.equal(err.name, 'EmptyError');
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

test('should override constructor args', function(t) {
	var error = new ErrorWithCtor(null, {statusCode: 200, code: 2014});
	t.equal(error.code, 2014);
	t.equal(error.statusCode, 200);
	t.end();
});

test('should be possible to set message in conjunction with ctor', function(t) {
	var error = new ErrorWithCtor('my_message', {statusCode: 200, code: 2014});
	t.equal(error.message, 'my_message');
	t.end();
});
