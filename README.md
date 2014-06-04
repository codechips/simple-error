# simple-error

Node.js module that lets you define and use errors consistently across your APIs and apps. Simple. HTTP friendly.

## Example usage

``` js
var assert = require('assert');
var SimpleError = require('.');

var MyError = SimpleError.define('MyError');
var myError = new MyError('boom');

assert.ok(myerror instanceof MyError); // true
assert.ok(myerror instanceof Error); // true
assert.equal(myError.message, 'boom'); // true

var ApiError = SimpleError.define('ApiError', {
  code: 100,
  statusCode: 500,
  methods: {
    badCall: function () {
      return 'Bad call: ' + this.message;
    }
  }
});

var err = new ApiError('NO!');

assert.equal(err.type, 'ApiError'); // true
assert.equal(err.name, 'ApiError'); // true
assert.equal(err.code, 100);        // true
assert.equal(err.statusCode, 500);  // true

console.log(err.toJSON());
// {"success":false,"message":"NO!","statusCode":400,"code":101}

console.log(err.badCall()); // Bad call: NO!

assert.ok(err instanceof Error); // true
assert.ok(err instanceof ApiError); // true

var util = require('util');

// Warning! Does not work with node.js util.isError method
util.isError(err); // false

// Sub errors
var BadRequestError = ApiError.define('BadRequestError', {
  code: 102,
  statusCode: 400,
  message: 'Bad request',
  methods: {
    hello: function () {
      return 'well, hello!';
    }
  }
});

var bad = new BadRequestError();

assert.ok(bad instanceof Error);           // true
assert.ok(bad instanceof ApiError);        // true
assert.ok(bad instanceof BadRequestError); // true

bad.hello(); // well, hello!

// inherited from ApiError
bad.badCall(); // Bad call: Bad request

// Wrapping unknown exceptions
var e = new Error('oops');
var wrappedError = BadRequestError.wrap(e);

assert.ok(wrappedError instanceof ApiError);        // true
assert.ok(wrappedError instanceof BadRequestError); // true
assert.equal(wrappedError.inner, e);                // true

console.log(wrappedError.toJSON());
// {"success":false,"message":"oops","statusCode":400,"code":102}

// Custom error consctructor if needed
var BasicError = SimpleError.define('BasicError', {
   code: 1234,
   statusCode: 400,
   message: 'Error with custom constructor',
   ctor: function (errorCode, links) {
     this.errorCode = errorCode;
     this.links = links;
   }
});

var links = ['http://www.npmjs.org', 'http://www.google.com'];
var err = new BasicError(101, links);

```

## Error definition defaults and options

There are some "sensible" defaults when it comes to defining your errors.

### code (any value)
Meant to be used as an internal code for other apps or APIs. Default is `0`.

### statusCode (integer)
HTTP error status code. Default is `500`.

### message (string)
Message format string. Called by node's util.format for interpolation if needed. Default is `Unknown`.

### exclude (array[string])
Properties to exclude when calling `friendly` method. For example: `exclude: ['code', 'foo', 'bar', 'baz']`.
Properties that are always excluded are `['isError', 'type', 'name']`

### showStack (boolean)
When set to true stacktrace is included in `toJSON` call. Default is `false`

### ctor (function)
If supplied will be used in new error construction as a constructor. See tests.

### methods (dict of functions)
If supplied all the methods will be copied to prototype and thus available on all instances of that
error type. See tests.

## Instance methods

### friendly()
Returns a frendly error object with properties excluded defined in exclude
option

## Class methods

### .wrap(err)
Takes an error and returns an new instance of error with passed in error set as
`.inner` property and all other properties copied over to new instance.


## License

MIT
