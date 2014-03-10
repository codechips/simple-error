'use strict';
var Util = require('util');
var slice = Array.prototype.slice;

var SimpleError = module.exports = {};

var copyMethodsToPrototype = function (ctor, methods) {
  if (methods) {
    Object.keys(methods).forEach(function (m) {
      ctor.prototype[m] = methods[m];
    });
  }
};

SimpleError.isError = function (error) {
  return (error instanceof Error);
};

SimpleError.define = function (name, opts) {
  if (!name) {
    throw new Error('Error name must be given');
  }

  var code = 6001, statusCode = 500, showStack = false, messageFormatString;

  if (opts) {
    code = opts.code || code;
    statusCode = opts.statusCode || statusCode;
    messageFormatString = opts.message || undefined;
    showStack = opts.showStack || showStack;
  }

  function Constructor() {
    var args = slice.call(arguments);
    Error.captureStackTrace(this, this.constructor);

    if (messageFormatString) {
      args.unshift(messageFormatString);
    }
    this.message = args.length ? Util.format.apply(null, args) : 'Unknown';
    this.name = this.type = name;
    this.code = code;
    this.statusCode = statusCode;
    this.isError = true;
  }

  Util.inherits(Constructor, Error);

  Constructor.prototype.toJSON = function toJson() {
    var result = {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
    };
    if (showStack) {
      result.stack = this.stack;
    }
    return JSON.stringify(result);
  };

  Constructor.wrap = function (error) {
    var err = new Constructor();
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

  Constructor.define = function (name, opts) {
    var Child = SimpleError.define(name, opts);
    Util.inherits(Child, Constructor);
    copyMethodsToPrototype(Child, opts.methods);
    return Child;
  };

  copyMethodsToPrototype(Constructor, (opts || {}).methods);

  return Constructor;
};

