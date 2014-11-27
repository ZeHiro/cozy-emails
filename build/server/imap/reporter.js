// Generated by CoffeeScript 1.8.0
var ImapReporter, Logger, io, ioServer, log, uuid, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

_ = require('lodash');

uuid = require('uuid');

ioServer = require('socket.io');

Logger = require('../utils/logging');

log = Logger('imap:reporter');

io = null;

module.exports = ImapReporter = (function() {
  ImapReporter.userTasks = {};

  ImapReporter.addUserTask = function(options) {
    return new ImapReporter(options);
  };

  ImapReporter.summary = function() {
    var id, task, _ref, _results;
    _ref = ImapReporter.userTasks;
    _results = [];
    for (id in _ref) {
      task = _ref[id];
      _results.push(task.toObject());
    }
    return _results;
  };

  ImapReporter.initSocketIO = function(app, server) {
    app.io = io = ioServer(server);
    return io.on('connection', function(sock) {
      return sock.on('mark_ack', ImapReporter.acknowledge);
    });
  };

  ImapReporter.acknowledge = function(id) {
    var _ref;
    if (id && ((_ref = ImapReporter.userTasks[id]) != null ? _ref.finished : void 0)) {
      delete ImapReporter.userTasks[id];
      return io != null ? io.emit('refresh.delete', id) : void 0;
    }
  };

  function ImapReporter(options) {
    this.toObject = __bind(this.toObject, this);
    this.id = uuid.v4();
    this.done = 0;
    this.finished = false;
    this.errors = [];
    this.total = options.total;
    this.box = options.box;
    this.account = options.account;
    this.objectID = options.objectID;
    this.code = options.code;
    ImapReporter.userTasks[this.id] = this;
    if (io != null) {
      io.emit('refresh.create', this.toObject());
    }
  }

  ImapReporter.prototype.sendtoclient = function(nocooldown) {
    if (this.cooldown && !nocooldown) {
      return true;
    } else {
      if (io != null) {
        io.emit('refresh.update', this.toObject());
      }
      this.cooldown = true;
      return setTimeout(((function(_this) {
        return function() {
          return _this.cooldown = false;
        };
      })(this)), 500);
    }
  };

  ImapReporter.prototype.toObject = function() {
    return {
      id: this.id,
      finished: this.finished,
      done: this.done,
      total: this.total,
      errors: this.errors,
      box: this.box,
      account: this.account,
      code: this.code,
      objectID: this.objectID
    };
  };

  ImapReporter.prototype.onDone = function() {
    this.finished = true;
    this.done = this.total;
    this.sendtoclient(true);
    if (!this.errors.length) {
      return setTimeout((function(_this) {
        return function() {
          return ImapReporter.acknowledge(_this.id);
        };
      })(this), 3000);
    }
  };

  ImapReporter.prototype.onProgress = function(done) {
    this.done = done;
    return this.sendtoclient();
  };

  ImapReporter.prototype.addProgress = function(delta) {
    this.done += delta;
    return this.sendtoclient();
  };

  ImapReporter.prototype.onError = function(err) {
    this.errors.push(Logger.getLasts() + "\n" + err.stack);
    log.error(err.stack);
    return this.sendtoclient();
  };

  return ImapReporter;

})();

ImapReporter.accountFetch = function(account, boxesLength) {
  return new ImapReporter({
    total: boxesLength,
    account: account.label,
    objectID: account.id,
    code: 'account-fetch'
  });
};

ImapReporter.boxFetch = function(box, total) {
  return new ImapReporter({
    total: total,
    box: box.label,
    objectID: box.id,
    code: 'box-fetch'
  });
};

ImapReporter.recoverUIDValidty = function(box, total) {
  return new ImapReporter({
    total: total,
    box: box.label,
    code: 'recover-uidvalidity'
  });
};
