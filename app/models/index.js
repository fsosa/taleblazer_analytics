/**
* This module configures the database connection and collects all model definitions.
 */

module.exports = function(config, env) {
  if (!GLOBAL.hasOwnProperty('db')) {
    var Sequelize = require('sequelize');

    // Configure the options hash
    var options = {
      host: config.db.host,
      dialect: 'mysql',
      dialectOptions: config.db.dialectOptions
    };
    
    options.logging = (env == 'production') ? false : console.log;


    var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, options);

    GLOBAL.db = {
      Sequelize: Sequelize,
      sequelize: sequelize,
      Event:              sequelize.import(__dirname + '/event'),
      EventType:          sequelize.import(__dirname + '/eventType'),
      EventAttrValueChar: sequelize.import(__dirname + '/eventAttrValueChar'),
      EventAttrValueInt:  sequelize.import(__dirname + '/eventAttrValueInt')
    };

    /*
      Associations can be defined here. e.g. like this:
      GLOBAL.db.User.hasMany(GLOBAL.db.OtherTable)
    */
    GLOBAL.db.Event
                .hasMany(GLOBAL.db.EventAttrValueInt)
                .hasMany(GLOBAL.db.EventAttrValueChar);

    GLOBAL.db.EventType
                .hasMany(GLOBAL.db.Event);

  }

  return GLOBAL.db;
};
