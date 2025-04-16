'use strict'
const Promise = require('bluebird')
const bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'))
const response = require('../libs/response')

module.exports = (sequelize, DataTypes) => {
    const user = sequelize.define('user', {
        uid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
		snsType: {
			type: DataTypes.STRING,
		},
        name: {
            type: DataTypes.STRING,
        },
		nickname: {
			type: DataTypes.STRING,
		},
        email: {
            type: DataTypes.STRING
        },
        phone: {
            type: DataTypes.STRING
        },
		profileImage: {
			type: DataTypes.STRING
		},
        point: {
            type: DataTypes.INTEGER
        },
		token: {
			type: DataTypes.STRING
		},
		push: {
        	type: DataTypes.BOOLEAN
		},
		marketing: {
			type: DataTypes.BOOLEAN
		},
        memo: {
            type: DataTypes.TEXT
        }
        /* 토큰 관련 컬럼 추가 예정*/
    }, {
        indexes: [
            {
                fields: ['created_at']
            }
        ],
        timestamps: true,
        paranoid: true,
        underscored: true,
    })

	user.applyScope = function (models) {
		user.addScope('defaultScope', {
			attributes: { exclude: [] },
		})
		user.addScope('login', {
			attributes: ['uid', 'id'],
		})
	}

	user.getByUid = async function (ctx, uid) {
		let data = await user.findByPk(uid)
		if (!data) {
			response.badRequest(ctx)
		}
		return data
	}

	user.getById = async function (ctx, id) {
		let data = await user.scope('login').findOne({
			where: {
				id: id
			}
		})
		return data
	}

    user.search = async (params) => {
		let where = {}
		let order = [['createdAt', 'DESC']]
		if(params.grade) {
			where.grade = params.grade
		}
		let result = await user.findAll({
			order: order,
			where: where
		})
		return result
    }

    return user
}
