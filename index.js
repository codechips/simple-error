'use strict';
var assert = require('assert');
var util = require('util');
var NON_JSON_PROPS = ['isError', 'exclude', 'showStack', 'ctor', 'methods'];

var copyMethodsToPrototype = function (ctor, methods) {
  if (methods) {
    Object.keys(methods).forEach(function (m) {
      ctor.prototype[m] = methods[m];
    });
  }
};

var setDefaults = function (opts) {
  var defaults = {
    code: 0,
    statusCode: 500,
    showStack: false
  };

  Object.keys(defaults).forEach(function (prop) {
    opts[prop] = opts[prop] || defaults[prop];
  });

  return opts;
};

var ErrorConstructor = function ErrorConstructor(parent, name, opts, args) {
  this.name = this.type = name;

  Object.keys(opts).forEach(function (prop) {
    this[prop] = opts[prop];
  }.bind(this));

  if (opts.ctor) {
    opts.ctor.apply(this, args);
  } else {
    if (opts.message) {
      args.unshift(opts.message);
    }
    this.message = args.length ? util.format.apply(null, args) : 'Unknown';
  }
  if (this.ctor) this.ctor.apply(this, args);

  Error.captureStackTrace(this, this.parent);
};

var extractArgs = function (name, opts) {
  assert.ok(name, 'Error name is required');
  assert.ok(typeof(name) === 'string', 'Error name must be a string');
  return { name: name.trim(), opts: opts || {} };
};

var SimpleError = module.exports = {};

SimpleError.isError = function (error) {
  return (error instanceof Error);
};

SimpleError.define = function (name, opts) {
  var args = extractArgs(name, opts);
  name = args.name;
  opts = setDefaults(args.opts);

  function BaseError() {
    ErrorConstructor.call(this, BaseError, name, opts, [].slice.call(arguments));
    this.exclude = NON_JSON_PROPS.concat(opts.exclude || []);
    this.message = this.message || 'Unknown';
  }

  BaseError.prototype = Object.create(Error.prototype);
  BaseError.prototype.constructor = BaseError;
  copyMethodsToPrototype(BaseError, opts.methods);

  BaseError.prototype.toJSON = function toJSON() {
    return JSON.stringify(this.friendly());
  };

  BaseError.prototype.friendly = function friendly() {
    var result = { success: false };
    var self = this;

    Object.keys(self)
      .filter(function (prop) {
        return self.exclude.indexOf(prop) === -1;
      })
      .forEach(function (prop) {
        result[prop] = self[prop];
      });

    if (self.showStack) {
      result.stack = self.stack;
    }

    return result;
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
    opts = args.opts;
    var parent = this;

    function ChildError(){
      var args = [].slice.call(arguments);
      parent.apply(this, arguments);

      var parentExclude = this.exclude || [];
      ErrorConstructor.call(this, parent, name, opts, args);

      this.exclude = this.exclude
                        .concat(parentExclude)
                        .reduce(function (excludes, ex) {
                          if (excludes.indexOf(ex) === -1) excludes.push(ex);
                          return excludes;
                        }, []);
    }

    ChildError.prototype = Object.create(parent.prototype);
    ChildError.prototype.constructor = ChildError;
    ChildError.define = BaseError.define;
    copyMethodsToPrototype(ChildError, opts.methods);

    return ChildError;
  };

  return BaseError;
};
