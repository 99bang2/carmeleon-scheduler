'use strict'
const consola = require('consola')
const resCode = require('../configs/response-code.json')
const auth = require('../libs/auth')
/**
 * 로그 및 에러 캐치
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
exports.res = async (ctx, next) => {
    try {
    	let params = JSON.parse(JSON.stringify(ctx.request.body))
    	consola.info('REQUEST', {
    		method: ctx.request.method,
			url: ctx.request.url,
			ip: ctx.request.ip,
			referer: ctx.request.header.referer,
			params: params
		})
		//ctx.admin = await auth.getAdmin(ctx)
		ctx.account = await auth.getAccount(ctx)
		ctx.user = await auth.getUser(ctx)
		await next()
    } catch (err) {
		consola.error(err)
        if (err.name === 'SequelizeValidationError') {
            ctx.status = resCode.validationError.code
            ctx.body = {
                result: {
                    code: resCode.validationError.code,
                    message: err.errors[0].message
                }
            }
        } else if(err.name === 'SequelizeUniqueConstraintError'){
            ctx.status = resCode.validationUniqueError.code
            ctx.body = {
                result: resCode.validationUniqueError
            }
        }else {
            if(err.code) {
                ctx.status = err.code
                ctx.body = {result: err}
            }else {
                ctx.status = resCode.severError.code
                ctx.body = {
                    result: resCode.severError
                }
            }
        }

    } finally {
    	let resLog = {
			method: ctx.request.method,
			url: ctx.request.url,
			ip: ctx.request.ip,
			referer: ctx.request.header.referer,
			status: ctx.status,
			result: ctx.body.result,
			message: ctx.message
		}
        if(ctx.status === 200) {
			consola.success('RESPONSE', resLog)
        } else {
			consola.error('RESPONSE', resLog)
        }
    }
}

/**
 * 성공시 Response
 * @param ctx
 * @param data
 */
exports.send = (ctx, data) => {
    ctx.status = resCode.success.code
    ctx.body = {
        result: resCode.success,
        data: data
    }
}

exports.badRequest = (ctx) => {
    ctx.throw(resCode.badRequest)
}

exports.unauthorized = (ctx) => {
    ctx.throw(resCode.unauthorized)
}

exports.forbidden = (ctx) => {
    ctx.throw(resCode.forbidden)
}

exports.tooManyRequest = (ctx) => {
    ctx.throw(resCode.tooManyRequest)
}

exports.severError = (ctx) => {
    ctx.throw(resCode.severError)
}

exports.notImplemented = (ctx) => {
    ctx.throw(resCode.notImplemented)
}

exports.validationError = (ctx) => {
    ctx.throw(resCode.validationError)
}

exports.customError = (ctx, message) => {
	ctx.throw({
		code: resCode.customError.code,
		message: message
	})
}
