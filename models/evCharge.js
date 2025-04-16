'use strict'
const response = require('../libs/response')

module.exports = (sequelize, DataTypes) => {
	const evCharge = sequelize.define('evCharge', {
		uid: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		statNm: {
			type: DataTypes.STRING,
		},
		statId: {
			type:DataTypes.STRING
		},
		stat: {
			type:DataTypes.INTEGER
		},
		chgerId: {
			type: DataTypes.STRING
		},
		chgerType: {
			type: DataTypes.STRING,
		},
		addr: {
			type: DataTypes.STRING
		},
		useTime: {
			type: DataTypes.STRING
		},
		busiId: {
			type: DataTypes.STRING,
		},
		busiNm: {
			type: DataTypes.STRING,
		},
		busiCall: {
			type: DataTypes.STRING,
		},
		statUpdDt: {
			type: DataTypes.STRING
		},
		powerType: {
			type: DataTypes.STRING
		},
		rate: {
			type: DataTypes.DOUBLE
		},
		lat: {
			type:DataTypes.DOUBLE
		},
		lon: {
			type:DataTypes.DOUBLE
		},
		sido: {
			type: DataTypes.STRING
		},
		sigungu:{
			type: DataTypes.STRING
		},
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
	})
	evCharge.associate = function (models) {
		//gasStation.hasMany(models.rating, {foreignKey: 'site_uid'})
		evCharge.hasMany(models.rating, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 1
			}
		})
		evCharge.hasMany(models.favorite, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 1
			}
		})
	}
	evCharge.getByUid = async function (ctx, uid) {
		let data = await evCharge.findByPk(uid)
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}

	evCharge.search = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]

		let result = await evCharge.findAll({
			order: order,
			where: where
		})
		return result
	}

	evCharge.userSearch = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]

		let result = await evCharge.findAll({
			order: order,
			where: [
				where
			]
		})
		return result
	}
	return evCharge
}

