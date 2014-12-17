// Generated by CoffeeScript 1.8.0
var americano, config, errorHandler, log, path;

path = require('path');

americano = require('americano');

log = require('./utils/logging')({
  prefix: 'config'
});

errorHandler = require('./utils/errors').errorHandler;

config = {
  common: {
    set: {
      'view engine': 'jade',
      'views': path.resolve(__dirname, 'views')
    },
    use: [
      americano.bodyParser(), americano.methodOverride(), americano["static"](__dirname + '/../client/public', {
        maxAge: 86400000
      })
    ],
    afterStart: function(app, server) {
      var Account, SocketHandler;
      app.use(errorHandler);
      SocketHandler = require('./utils/socket_handler');
      SocketHandler.setup(app, server);
      Account = require('./models/account');
      return Account.removeOrphansAndRefresh(null, false, function() {
        return log.info("initial refresh completed");
      });
    }
  },
  development: [americano.logger('dev')],
  production: [americano.logger('short')],
  plugins: [MODEL_MODULE]
};

module.exports = config;
