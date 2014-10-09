'use strict';
var assert = require('assert');
var util = require('util');
var NON_JSON_PROPS = ['isError'];

var copyMethodsToPrototype = function (ctor, methods) {
  if (methods) {
    Object.keys(methods).forEach(function (m) {
      ctor.prototype[m] = methods[m];
    });
  }
};

var setExclude = function (exclude) {
  return exclude
    .concat(NON_JSON_PROPS)
    .reduce(function (excludes, ex) {
      if (excludes.indexOf(ex) === -1) excludes.push(ex);
        return excludes;
    }, []);

}
var setDefaults = function (opts) {
  var defaults = {
    code: 0,
    statusCode: 500,
    showStack: false,
    exclude: [].concat(NON_JSON_PROPS)
  };

  Object.keys(defaults).forEach(function (prop) {
    opts[prop] = opts[prop] || defaults[prop];
  });
  opts.exclude = setExclude(opts.exclude);

  return opts;
};

var extractArgs = function (name, opts) {
  assert.ok(name, 'Error name is required');
  assert.ok(typeof(name) === 'string', 'Error name must be a string');
  return { name: name.trim(), opts: opts || {} };
};

var attachFriendly = function (name, opts) {
  opts = opts || {};
  opts.exclude = opts.exclude || NON_JSON_PROPS;

  return function friendly() {
    var result = { success: false };

    Object.keys(this)
      .filter(function (prop) {
        return opts.exclude.indexOf(prop) === -1;
      })
      .forEach(function (prop) {
        result[prop] = this[prop];
      }.bind(this));

    if (opts.showStack) {
      result.stack = this.stack;
    }

    return result;
  };
};

var define = function (name, opts) {
  var args = extractArgs(name, opts);
  var messageFormatString, showStack, exclude, ctor;

  name = args.name;
  opts = setDefaults(args.opts);

  if (opts) {
    messageFormatString = opts.message;
    showStack = opts.showStack || showStack;
    exclude = opts.exclude;
    if (opts.ctor && typeof opts.ctor === 'function') {
      ctor = opts.ctor;
    }
  }

  function BaseError() {
    var args = [].slice.call(arguments);

    Error.captureStackTrace(this, this.constructor);

    this.name = this.type = name;
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.isError = true;

    if (ctor) {
      this.message = messageFormatString || 'Unknown';
      ctor.apply(this, args);
    } else {
      if (messageFormatString) {
        args.unshift(messageFormatString);
      }
      this.message = args.length ? util.format.apply(null, args) : 'Unknown';
    }
  }

  BaseError.prototype = Object.create(Error.prototype);
  BaseError._opts = opts;
  BaseError.prototype.friendly = attachFriendly(name, opts);
  BaseError.prototype.toJSON = function toJSON() {
    return JSON.stringify(this.friendly());
  };


  BaseError.wrap = function (error) {
    var err = new BaseError();

    Object.keys(error).forEach(function (prop) {
      if (prop !== 'name' && prop !== 'type') {
        err[prop] = error[prop];
      }
    });

    if (error.message) {
      err.message = error.message;
    }
    err.inner = error;

    return err;
  };

  BaseError.define = function (name, opts) {
    var args = extractArgs(name, opts);
    name = args.name;

    var cloned = Object.keys(BaseError._opts).reduce(function (acc, key) {
      acc[key] = BaseError._opts[key];
      return acc;
    }, {});

    for (var prop in opts) {
      var value = opts[prop];
      if (value) {
        cloned[prop] = Array.isArray(value) ?
          [].concat(NON_JSON_PROPS, value, (cloned[prop] || [])) : value;
      }
    }

    var ChildError = SimpleError.define(name, cloned);
    util.inherits(ChildError, BaseError);
    copyMethodsToPrototype(ChildError, args.opts.methods);
    ChildError.prototype.friendly = attachFriendly(name, cloned);

    return ChildError;
  };

  copyMethodsToPrototype(BaseError, (opts || {}).methods);

  return BaseError;
};

var SimpleError = module.exports = {};
SimpleError.define = define;

SimpleError.isError = function (error) {
  return (error instanceof Error);
};
