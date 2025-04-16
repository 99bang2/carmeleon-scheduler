'use strict'
const response = require('../libs/response')
const Sequelize = require('sequelize')

module.exports = (sequelize, DataTypes) => {
	const evChargeStation = sequelize.define('evChargeStation', {
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
			type:DataTypes.STRING,
			unique: true
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
		rate: {
			type: DataTypes.DOUBLE
		},
		lat: {
			type:DataTypes.DOUBLE
		},
		lon: {
			type:DataTypes.DOUBLE
		},
		location: {
			type: DataTypes.STRING,
			comment: '주차장 상세위치'
		},
		sido: {
			type: DataTypes.STRING
		},
		sigungu:{
			type: DataTypes.STRING
		},
		picture:{
			type: DataTypes.STRING
		},
		isRecommend: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		tag: {
			type: DataTypes.JSON
		},
		phone: {
			type: DataTypes.STRING
		},
		evType: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		isParkingFree: {
			type: DataTypes.BOOLEAN,
			comment: '주차료무료'
		},
		isLimit: {
			type: DataTypes.BOOLEAN,
			comment: '이용자 제한'
		},
		limitDetail: {
			type: DataTypes.STRING,
			comment: '이용제한 사유'
		},
		isChargerDelete: {
			type : DataTypes.BOOLEAN,
			comment: '충전기 삭제 여부'
		},
		chargerDeleteDetail: {
			type: DataTypes.STRING,
			comment: '충전기 삭제 사유'
		},
		// Todo: 테슬라 슈퍼차저 충전기 상태 일단 보류
		stall: {
			type: DataTypes.INTEGER
		},
		availableStall: {
			type: DataTypes.INTEGER
		},
		info: {
			type: DataTypes.TEXT
		},
		updateTime: {
			type: DataTypes.DATE
		},
		compareName: {
			type: DataTypes.STRING
		},
		parkingUid: {
			type: DataTypes.INTEGER
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
	})
	evChargeStation.associate = function (models) {
		//gasStation.hasMany(models.rating, {foreignKey: 'site_uid'})
		evChargeStation.hasMany(models.rating, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 1
			}
		})
		evChargeStation.hasMany(models.favorite, {
			foreignKey: 'targetUid',
			constraints: false,
			scope: {
				targetType: 1
			}
		})
		evChargeStation.hasMany(models.evCharger, {
			foreignKey: 'statId',
			sourceKey: 'statId'
		})
		// evChargeStation.belongsTo(models.parkingSite, {
		// 	foreignKey: 'parkingUid',
		// 	targetKey: 'uid'
		// })
	}
	evChargeStation.getByUid = async function (ctx, uid, params, models) {
		let userUid = null
		if(params !== null) {
			if (params.userUid) {
				userUid = params.userUid
			}
		}
		let favoriteCheck = 'target_type = 1 AND target_uid = ' + uid + ' AND user_uid = ' + userUid + ' AND deleted_at IS NULL)'
		let data = await evChargeStation.findByPk(uid, {
			include: [{
				model: models.evCharger
			}],
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

	evChargeStation.search = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]
		let longitude = params.lon ? parseFloat(params.lon) : null
		let latitude = params.lat ? parseFloat(params.lat) : null
		let radius = params.radius
		let distaceQuery = sequelize.where(sequelize.literal(`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`), '<=', radius)
		if (!radius) {
			distaceQuery = null
		}
		let rateWhere = 'target_type = 1 AND target_uid = evChargeStation.uid)'
		if (params.searchKeyword) {
			where = {
				[Sequelize.Op.or]: [
					{
						statNm: {
							[Sequelize.Op.like]: '%' + params.searchKeyword + '%'
						}
					}
				]
			}
		}

		let result = await evChargeStation.findAll({
			include: [{
				model: models.evCharger
			}],
			attributes: {
				include: [
					[`(6371 * acos(cos(radians(${latitude})) * cos(radians(lat)) * cos(radians(lon) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(lat))))`, 'distance'],
					[`(SELECT count(uid) FROM ratings WHERE ` + rateWhere, 'rate_count']
				]
			},
			offset: params.offset ? Number(params.offset) : null,
			limit: params.limit ? Number(params.limit) : null,
			order: order,
			where: [
				distaceQuery
				, where
			]
		})
		let count = await evChargeStation.scope(null).count({
			where: where
		})
		return {
			rows: result,
			count: count
		}
	}

	evChargeStation.searchAdmin = async (params, models) => {
		let where = {}
		let order = [['createdAt', 'DESC']]
		let rateWhere = 'target_type = 1 AND target_uid = evChargeStation.uid)'
		if (params.searchKeyword) {
			where = {
				[Sequelize.Op.or]: [
					{
						statNm: {
							[Sequelize.Op.like]: '%' + params.searchKeyword + '%'
						}
					}
				]
			}
		}

		let result = await evChargeStation.findAll({
			include: [{
				model: models.evCharger
			}],
			attributes: {
				include: [
					[`(SELECT count(uid) FROM ratings WHERE ` + rateWhere, 'rate_count']
				]
			},
			offset: params.offset ? Number(params.offset) : null,
			limit: params.limit ? Number(params.limit) : null,
			order: order,
			where: where
		})
		let count = await evChargeStation.scope(null).count({
			where: where
		})
		return {
			rows: result,
			count: count
		}
	}
	return evChargeStation
}
