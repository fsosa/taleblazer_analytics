module.exports = function(sequelize, DataTypes) {
	return sequelize.define("EventAttrValueChar", {
		attrName	: DataTypes.STRING, 
		value		: DataTypes.STRING,  
	})
}