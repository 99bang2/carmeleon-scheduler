'use strict'
const response = require('../libs/response')
const Sequelize = require('sequelize')
const codes = require('../configs/codes.json')

module.exports = (sequelize, DataTypes) => {
	const evCharger = sequelize.define('evCharger', {
		uid: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		statId: {
			type:DataTypes.STRING
		},
		stat: {
			type: DataTypes.INTEGER
		},
		chgerId: {
			type: DataTypes.STRING
		},
		chgerType: {
			type: DataTypes.STRING,
		},
		statUpdDt: {
			type: DataTypes.STRING
		},
		lastChargeStartDate : {
			type : DataTypes.STRING,
			comment: '마지막 충전시작일시'
		},
		lastChargeEndDate: {
			type : DataTypes.STRING,
			comment: '마지막 충전종료일시'
		},
		powerType: {
			type: DataTypes.STRING
		},
		output: {
			type: DataTypes.INTEGER,
			comment: '충전용량 (3,7,50,100,200)kW'
		},
		method: {
			type: DataTypes.STRING,
			comment: '충전방식 (동시/ 단독)'
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
	})
	evCharger.associate = function (models) {
		evCharger.belongsTo(models.evChargeStation,{foreignKey: 'statId', targetKey: 'statId'})
	}
	evCharger.getByUid = async function (ctx, uid) {
		let data = await evCharger.findByPk(uid)
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}

	evCharger.search = async (params, models) => {
		let where = {}

		let result = await evCharger.findAll({
			where: where
		})

		return result
	}

	return evCharger
}
