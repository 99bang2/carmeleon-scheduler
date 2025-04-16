'use strict'
const response = require('../libs/response')
const consola = require('consola')
const jwt = require('jsonwebtoken')
const env = process.env.NODE_ENV || 'development'
const config = require('../configs/config.json')[env]
const secret = config.secretKey

exports.getAccount = async (ctx) => {
	if (ctx.request.headers.authorization && ctx.request.headers.authorization.split(' ')[0] === 'Bearer') {
		try{
			let accessToken = ctx.request.headers.authorization.split(' ')[1]
			let accuontData = await jwt.verify(accessToken, secret)
			return accuontData
		}catch (e) {
			consola.error(e)
			response.unauthorized(ctx)
		}
	} else {
		return null
	}
}

exports.getUser = async (ctx) => {
	if (ctx.request.headers.authorization && ctx.request.headers.authorization.split(' ')[0] === 'Bearer') {
		try{
			let accessToken = ctx.request.headers.authorization.split(' ')[1]
			let userData = await jwt.verify(accessToken, secret)
			return userData
		}catch (e) {
			consola.error(e)
			response.unauthorized(ctx)
		}
	} else {
		return null
	}
}

exports.isAdminLoggedIn = async (ctx, next) => {
	if(!ctx.account){
		response.unauthorized(ctx)
	}
	await next()
}

exports.isUserLoggedIn = async (ctx, next) => {
	if(!ctx.user){
		response.unauthorized(ctx)
	}
	await next()
}

//관리자 or 유저 로그인 체크
exports.isEitherLoggedIn = async (ctx, next) => {
	if(ctx.account || ctx.user){
		await next()
		return false
	}
	response.unauthorized(ctx)
}
