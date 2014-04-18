/**
* This module exports a hash of configuration options to be loaded at app startup in server.js.
*
* Database-specific configuration options should go in `config.json`, which is REQUIRED for Sequelize migrations to work.
* NEVER check a local `config.json` file into source control.
 */

dbConfig = require('./config.json')

module.exports = {
  development: {
    db: dbConfig.development,  
    HOST: '',
    PORT: 3000,
    LOG_DIR: './logs/'
  },
  test: {
    db: dbConfig.test,  // Remove this or set as empty string to have Node serve requests to any IP (useful for letting external machines connect to your local server instance)
    PORT: 3000,
    LOG_DIR: './logs/'
  },
  production: {
    db: dbConfig.production, 
    HOST: '127.0.0.1', // Remove this or set as empty string to have Node serve requests to any IP (useful for letting external machines connect to your local server instance)
    PORT: 3000,
    LOG_DIR: './logs/'
  }
};

