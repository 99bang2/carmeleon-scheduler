'use strict'
const response = require('../libs/response')
const codes = require('../configs/codes.json')
const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
	const carWash = sequelize.define('carWash', {
		uid: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		carWashName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		carWashIndustry: {
			type: DataTypes.STRING
		},
		carWashType: {
			type: DataTypes.STRING
		},
		carWashTypeName: {
			type: DataTypes.VIRTUAL,
			get: function () {
				if (this.getDataValue('carWashType') !== null) {
					return codes.carWashTypeOpts[this.getDataValue('carWashType')]
				}
			}
		},
		address: {
			type: DataTypes.STRING
		},
		sido: {
			type: DataTypes.STRING
		},
		sigungu: {
			type: DataTypes.STRING
		},
		closedDay: {
			type: DataTypes.STRING,
		},
		weekdayOperOpenHhmm: {
			type: DataTypes.STRING
		},
		weekdayOperCloseHhmm: {
			type: DataTypes.STRING
		},
		holidayOperOpenHhmm: {
			type: DataTypes.STRING
		},
		holidayOperCloseHhmm: {
			type: DataTypes.STRING
		},
		carWashChargeInfo: {
			type: DataTypes.STRING
		},
		phoneNumber: {
			type: DataTypes.STRING
		},
		lat: {
			type: DataTypes.DOUBLE
		},
		lon: {
			type: DataTypes.DOUBLE
		},
		picture: {
			type: DataTypes.JSON
		},
		rate: {
			type: DataTypes.DOUBLE
		},
		isRecommend: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		typeTag: {
			type: DataTypes.JSON
		},
		timeTag: {
			type: DataTypes.JSON
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
	})
	carWash.associate = function (models) {
		//carWash.hasMany(models.rating, {foreignKey: 'site_uid'})
		carWash.hasMany(models.rating, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 2
			}
		})
		carWash.hasMany(models.favorite, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 2
			}
		})
	}
	carWash.getByUid = async function (ctx, uid, params) {
		let userUid = null
		if(params !== null) {
			if (params.userUid) {
				userUid = params.userUid
			}
		}
		let favoriteCheck = 'target_type = 3 AND target_uid = ' + uid + ' AND user_uid = ' + userUid + ' AND deleted_at IS NULL)'
		let data = await carWash.findByPk(uid, {
			attributes: {
				include: [
					[Sequelize.literal(`(SELECT count(uid) FROM favorites WHERE ` + favoriteCheck), 'favoriteFlag']
				]
			},
		})
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}

	carWash.search = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]

		if (params.searchKeyword) {
			where = {
				[Sequelize.Op.or]: [
					{
						carWashName: {
							[Sequelize.Op.like]: '%' + params.searchKeyword + '%'
						}
					},
					// {
					// 	carWashIndustry: {
					// 		[Sequelize.Op.like]: '%' + params.searchKeyword + '%'
					// 	}
					// },
					// {
					// 	address: {
					// 		[Sequelize.Op.like]: '%' + params.searchKeyword + '%'
					// 	}
					// },
					// {
					// 	carWashChargeInfo: {
					// 		[Sequelize.Op.like]: '%' + params.searchKeyword + '%'
					// 	}
					// },
					// {
					// 	phoneNumber: {
					// 		[Sequelize.Op.like]: '%' + params.searchKeyword + '%'
					// 	}
					// }
				]
			}
		}

		if (params.searchType) {
			where.carWashIndustry = {
				[Sequelize.Op.like]: '%' + params.searchType + '%'
			}
		}

		let result = await carWash.findAll({
			offset: params.offset ? Number(params.offset) : null,
			limit: params.limit ? Number(params.limit) : null,
			order: order,
			where: where
		})
		let count = await carWash.scope(null).count({
			where: where
		})
		return {
			rows: result,
			count: count
		}
	}

	carWash.userSearch = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]
		let longitude = params.lon ? parseFloat(params.lon) : null
		let latitude = params.lat ? parseFloat(params.lat) : null
		let radius = params.radius
		let distaceQuery = sequelize.where(sequelize.literal(`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`), '<=', radius)
		if (!radius) {
			distaceQuery = null
		}
		let rateWhere = 'target_type = 3 AND target_uid = carWash.uid)'
		if (params.carWashType) {
			where.carWashType = params.carWashType
		}
		let result = await carWash.findAll({
			attributes: {
				include: [
					[`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`, 'distance'],
					[`(SELECT count(uid) FROM ratings WHERE ` + rateWhere, 'rate_count']
				]
			},
			order: order,
			where: [
				distaceQuery
				, where
			]
		})
		return result
	}

	return carWash
}
