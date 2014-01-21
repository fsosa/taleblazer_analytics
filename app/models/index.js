/**
* This module configures the database connection and collects all model definitions.
 */

module.exports = function(config, env) {
  if (!global.hasOwnProperty('db')) {
    var Sequelize = require('sequelize');

    // Configure the options hash
    var options = {
      host: config.db.host,
      dialect: 'mysql',
      dialectOptions: {
        socketPath: config.db.socketPath
      }
    };

    if (env == 'production') {
      options.logging = false;
    }


    var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, options);

    global.db = {
      Sequelize: Sequelize,
      sequelize: sequelize,
      Event:              sequelize.import(__dirname + '/event'),
      EventType:          sequelize.import(__dirname + '/eventType'),
      EventAttrValueChar: sequelize.import(__dirname + '/eventAttrValueChar'),
      EventAttrValueInt:  sequelize.import(__dirname + '/eventAttrValueInt')
    };

    /*
      Associations can be defined here. e.g. like this:
      global.db.User.hasMany(global.db.OtherTable)
    */
    global.db.Event
                .hasMany(global.db.EventAttrValueInt)
                .hasMany(global.db.EventAttrValueChar);

    global.db.EventType
                .hasMany(global.db.Event);

  }

  return global.db;
};
