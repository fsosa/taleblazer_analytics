/**
* This module exports a hash of configuration options to be loaded at app startup in server.js.
*
* Copy and paste this file as `config.js` in the same folder and fill it in with the appropriate information.
* Never check a local `config.js` file into source control.
 */

module.exports = {
  development: {
    db: {
      username: 'USERNAME',
      password: 'PASSWORD',
      database: 'DATABASE',
      host: 'localhost',
      socketPath: 'If using XAMPP, update with path to mysql socket (in XAMPP_DIR/etc/my.conf) - Leave empty otherwise'
    }
  },
  test: {
    db: {
      username: 'USERNAME',
      password: 'PASSWORD',
      database: 'DATABASE',
      host: 'localhost',
      socketPath: 'If using XAMPP, update with path to mysql socket (in XAMPP_DIR/etc/my.conf) - Leave empty otherwise'
    }
  },
  production: {
    db: {
      username: 'USERNAME',
      password: 'PASSWORD',
      database: 'DATABASE',
      host: 'localhost',
      socketPath: 'If using XAMPP, update with path to mysql socket (in XAMPP_DIR/etc/my.conf) - Leave empty otherwise'
    }
  }
};

