'use strict'
const response = require('../libs/response')
const codes = require('../configs/codes.json')

module.exports = (sequelize, DataTypes) => {
	const gasStation = sequelize.define('gasStation', {
		uid: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		gasStationName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		gasStationUid: {
			type:DataTypes.STRING
		},
		brandCode: {
			type: DataTypes.STRING
		},
		brandCodeName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('brandCode') !== null) {
					return codes.brandCodeOpts[this.getDataValue('brandCode')]
				}
			}
		},
		gasStationType: {
			type: DataTypes.STRING,
		},
		gasStationTypeName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('gasStationType') !== null) {
					return codes.gasStationTypeOpts[this.getDataValue('gasStationType')]
				}
			}
		},
		address: {
			type: DataTypes.STRING
		},
		sido: {
			type: DataTypes.STRING
		},
		sigungu:{
			type: DataTypes.STRING
		},
		tel: {
			type: DataTypes.STRING
		},
		lat: {
			type:DataTypes.DOUBLE
		},
		lon: {
			type:DataTypes.DOUBLE
		},
		picture: {
			type: DataTypes.JSON
		},
		rate: {
			type: DataTypes.DOUBLE
		},
		tag: {
			type: DataTypes.JSON
		},
		Gasoline:{
			type: DataTypes.INTEGER
		},
		Diesel:{
			type: DataTypes.INTEGER
		},
		PremiumGasoline:{
			type: DataTypes.INTEGER
		},
		HeatingOil:{
			type: DataTypes.INTEGER
		},
		lpg:{
			type: DataTypes.INTEGER
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
	})
	gasStation.associate = function (models) {
		//gasStation.hasMany(models.rating, {foreignKey: 'site_uid'})
		gasStation.hasMany(models.rating, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 1
			}
		})
		gasStation.hasMany(models.favorite, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 1
			}
		})
	}
	gasStation.getByUid = async function (ctx, uid) {
		let data = await gasStation.findByPk(uid)
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}

	gasStation.search = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]

		if (params.brandCode) {
			where.brandCode = params.brandCode
		}
		if (params.gasStationType) {
			where.gasStationType = params.gasStationType
		}
		if (params.isKpetro) {
			where.isKpetro = params.isKpetro
		}

		let result = await gasStation.findAll({
			order: order,
			where: where
		})
		return result
	}

	gasStation.userSearch = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]
		let longitude = params.lon ? parseFloat(params.lon) : null
		let latitude = params.lat ? parseFloat(params.lat) : null
		let radius = params.radius
		let distaceQuery = sequelize.where(sequelize.literal(`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`),'<=',radius)
		if(!radius){
			distaceQuery = null
		}
		if (params.brandCode) {
			where.site_type = params.brandCode
		}
		if (params.gasStationType) {
			where.gasStationType = params.gasStationType
		}
		if (params.isKpetro) {
			where.isKpetro = params.isKpetro
		}

		let result = await gasStation.findAll({
			attributes: {
				include: [
					[`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`, 'distance'],
					[`(SELECT count(*) FROM ratings WHERE site_uid = gasStation.uid)`, 'rate_count']]
			},
			order: order,
			where: [
				distaceQuery
				,where
			]
		})
		return result
	}

	return gasStation
}
