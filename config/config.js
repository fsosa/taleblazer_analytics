/**
* This module exports a hash of configuration options to be loaded at app startup in server.js.
*
* Database-specific configuration options should go in `config.json`, which is REQUIRED for Sequelize migrations to work.
* NEVER check a local `config.json` file into source control.
 */

dbConfig = require('./config.json')

module.exports = {
  development: {
    db: dbConfig.development
  },
  test: {
    db: dbConfig.test
  },
  production: {
    db: dbConfig.production
  }
};

