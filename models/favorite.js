'use strict'
const response = require('../libs/response')
module.exports = (sequelize, DataTypes) => {
	const favorite = sequelize.define('favorite', {
		uid: {
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
		},
		targetType:{
			type: DataTypes.INTEGER,
			allowNull: false
		},
		targetUid: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		userUid: {
			type: DataTypes.INTEGER
		},
		nickname: {
			type: DataTypes.STRING
		}
	}, {
		timestamps: true,
		underscored: true,
		paranoid: true
	})
	favorite.associate = function (models) {
		favorite.belongsTo(models.user)
		//favorite.belongsTo(models.parkingSite, {foreignKey: 'site_uid', targetKey: 'uid'})
		favorite.belongsTo(models.parkingSite, {
			foreignKey: 'targetUid',
			constraints: false,
			as: 'parkingSite'
		})
		favorite.belongsTo(models.gasStation, {
			foreignKey: 'targetUid',
			constraints: false,
			as: 'gasStation'
		})
		favorite.belongsTo(models.carWash, {
			foreignKey: 'targetUid',
			constraints: false,
			as: 'carWash'
		})
	}
	favorite.getByUid = async function (ctx, uid) {
		let data = await favorite.findByPk(uid)
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}
	favorite.getByUserUid = async function (ctx, uid, models) {
		let data = await favorite.findAll({
			include: [{
				as: 'parkingSite',
				model: models.parkingSite
			},{
				as: 'gasStation',
				model: models.gasStation
			},{
				as: 'carWash',
				model: models.carWash
			},],
			where: {userUid:uid}
		})
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}
	favorite.search = async (params) => {
		let where = {}
		let result = await favorite.findAll({
			where: where
		})
		return result
	}
	return favorite
}
