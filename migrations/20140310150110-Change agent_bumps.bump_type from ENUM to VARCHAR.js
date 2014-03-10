module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.changeColumn(
    	'agent_bumps',
    	'bump_type',
    	{
    		type: DataTypes.STRING,
    		allowNull: false
    	}
    	);
    done();
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.changeColumn(
    	'agent_bumps',
    	'bump_type',
    	{
    		type: DataTypes.ENUM,
    		values: ['INV', 'GPS', 'TAP', 'HUD'],
    		allowNull: false
    	}
    	);
    done();
  }
};
