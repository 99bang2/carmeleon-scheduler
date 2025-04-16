'use strict'
const response = require('../libs/response')
const codes = require('../configs/codes.json')

module.exports = (sequelize, DataTypes) => {
	const parkingSite = sequelize.define('parkingSite', {
		uid: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		siteType: {
			type: DataTypes.INTEGER
		},
		siteTypeName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('siteType') !== null) {
					return codes.site[this.getDataValue('siteType')]
				}
			}
		},
		lat: {
			type: DataTypes.DOUBLE
		},
		lon: {
			type: DataTypes.DOUBLE
		},
		parkingLot: {
			type: DataTypes.INTEGER
		},
		tel: {
			type: DataTypes.STRING
		},
		phone: {
			type: DataTypes.STRING
		},
		email: {
			type: DataTypes.STRING
		},
		manager: {
			type: DataTypes.STRING
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
		},
		paymentTag: {
			type: DataTypes.JSON
		},
		paymentTagName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('paymentTag') !== null) {
					return this.getDataValue('paymentTag').map(function (obj) {
						return codes.paymentTag[obj]
					})
				}
			}
		},
		brandTag: {
			type: DataTypes.JSON
		},
		brandTagName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('brandTag') !== null) {
					return this.getDataValue('brandTag').map(function (obj) {
						return codes.brandTag[obj]
					})
				}
			}
		},
		productTag: {
			type: DataTypes.JSON
		},
		productTagName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('productTag') !== null) {
					return this.getDataValue('productTag').map(function (obj) {
						return codes.productTag[obj]
					})
				}
			}
		},
		optionTag: {
			type: DataTypes.JSON
		},
		optionTagName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('optionTag') !== null) {
					return this.getDataValue('optionTag').map(function (obj) {
						return codes.optionTag[obj]
					})
				}
			}
		},
		carTag: {
			type: DataTypes.JSON
		},
		carTagName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('carTag') !== null) {
					return this.getDataValue('carTag').map(function (obj) {
						return codes.carTag[obj]
					})
				}
			}
		},
		price: {
			type: DataTypes.INTEGER
		},
		rate: {
			type: DataTypes.DOUBLE
		},
		address: {
			type: DataTypes.STRING
		},
		info: {
			type: DataTypes.TEXT
		},
		priceInfo: {
			type: DataTypes.TEXT
		},
		timeInfo: {
			type: DataTypes.TEXT
		},
		picture: {
			type: DataTypes.JSON
		},
		operationTime: {
			type: DataTypes.STRING
		},
		metaData: {
			type:DataTypes.JSON
		},
		parkingPlaceNo: {
			type:DataTypes.STRING
		},
		lastUpdateDate: {
			type:DataTypes.STRING
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
	})
	parkingSite.associate = function (models) {
		//parkingSite.hasMany(models.rating, {foreignKey: 'site_uid'})
		parkingSite.hasMany(models.rating, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 0
			}
		})
		parkingSite.hasMany(models.favorite, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 0
			}
		})
		// parkingSite.hasMany(models.evChargeStation, {
		// 	foreignKey: 'parkingUid',
		// 	constraints: false
		// })
	}
	parkingSite.getByUid = async function (ctx, uid) {
		let data = await parkingSite.findByPk(uid)
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}

	parkingSite.search = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]

		if (params.siteType) {
			where.siteType = params.siteType
		}

		let result = await parkingSite.findAll({
			order: order,
			where: where
		})
		return result
	}

	parkingSite.userSearch = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]
		let longitude = params.lon ? parseFloat(params.lon) : null
		let latitude = params.lat ? parseFloat(params.lat) : null
		let radius = params.radius
		let distaceQuery = sequelize.where(sequelize.literal(`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`),'<=',radius)
		let rate_where = 'target_type = 0 AND target_uid = parkingSite.uid)'
		if(!radius){
			distaceQuery = null
		}
		if (params.siteType) {
			where.site_type = params.siteType
		}
		where.is_active = 1
		let result = await parkingSite.findAll({
			attributes: {
				include: [
					[`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`, 'distance'],
					[`(SELECT count(uid) FROM ratings WHERE `+rate_where, 'rate_count'],
					[`(SELECT COUNT(CASE WHEN rate = 1 OR rate = 2 THEN 0 END) FROM ratings WHERE `+rate_where, 'rate_1'],
					[`(SELECT COUNT(CASE WHEN rate = 3 OR rate = 4 THEN 0 END) FROM ratings WHERE `+rate_where, 'rate_2'],
					[`(SELECT COUNT(CASE WHEN rate = 5 OR rate = 6 THEN 0 END) FROM ratings WHERE `+rate_where, 'rate_3'],
					[`(SELECT COUNT(CASE WHEN rate = 7 OR rate = 8 THEN 0 END) FROM ratings WHERE `+rate_where, 'rate_4'],
					[`(SELECT COUNT(CASE WHEN rate = 9 OR rate = 10 THEN 0 END) FROM ratings WHERE `+rate_where, 'rate_5']]
			},
			order: order,
			where: [
				distaceQuery
				,where
			]
		})
		return result
	}

	return parkingSite
}
