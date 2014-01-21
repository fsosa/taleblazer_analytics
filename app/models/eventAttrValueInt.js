module.exports = function(sequelize, DataTypes) {
	return sequelize.define("EventAttrValueInt", {
		attrName	: DataTypes.STRING, 
		value		: DataTypes.INTEGER,  
	})
}