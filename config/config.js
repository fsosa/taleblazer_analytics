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
    PORT: 3000,
  },
  test: {
    db: dbConfig.test, 
    PORT: 3000,
  },
  production: {
    db: dbConfig.production, 
    PORT: 3000
  }
};

