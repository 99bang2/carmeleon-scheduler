'use strict'
const XLSX = require('xlsx')
const models = require('../models')
const convert = require('xml-js')
const request = require('request-promise-native')
const env = require('../configs/env.json')
const PARKINGHOST = env.PARKINGHOST
const HOST = env.HOST
const UPDATEHOST = env.UPDATEHOST
const SERVICE_KEY = env.SERVICE_KEY
const KEPCO = env.KEPCOHOST
const faker = require('faker')
const {Op} = require("sequelize")
const _ = require('lodash')
const GasHost = env.GasHost
const GasKey = env.GasKey
faker.locale = 'ko'
const NaverMap = env.NaverMap
const KakaoMap = env.KakaoMap
const superCharger = require('../tesla_super.json')
const desCharger = require('../tesla_des.json')
const axios = require("axios")
const cheerio = require("cheerio")
const consola = require('consola')
const moment = require('moment')
const areaCode = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '14', '15', '16', '17', '18', '19']
const gasMap = {
    "B027": "Gasoline",
    "D047": "Diesel",
    "B034": "PremiumGasoline",
    "C004": "HeatingOil",
    "K015": "lpg"
}
const evStatus = {
    "1": "통신이상",
    "2": "충전대기",
    "3": "충전중",
    "4": "운영중지",
    "5": "점검중",
    "9": "상태미확인"
}

// exports.test = async ()=> {
//
//     let geoData = await getNaverGeo('경기도 과천시 갈현동 산 31-1')
//         if (!geoData) {
//             geoData = await getKakaoGeo('경기도 과천시 갈현동 산 31-1')
//         }
//     console.log(geoData)
// }

const RemoveJsonTextAttribute = (value, parentElement) => {
    try {
        const keyNo = Object.keys(parentElement._parent).length
        const keyName = Object.keys(parentElement._parent)[keyNo - 1]
        parentElement._parent[keyName] = value
    } catch (e) {
        console.log(e)
    }
}
const options = {
    compact: true,
    textFn: RemoveJsonTextAttribute
}
const bulkOptions = {
    ignoreDuplicates: true
}

exports.insertGasStation = async (areaCode) => {
    let requestUrl = `${GasHost}/osList.do?code=${GasKey}&out=json&area=` + areaCode
    let gasStationItemArr = []
    request.get(requestUrl, (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {
            if (res.statusCode === 200) {
                let data = JSON.parse(body)
                let dataArr = data.RESULT.OIL
                let gasArr = []
                for (let i = 0; i < dataArr.length; i++) {
                    let TagArr = []
                    if (dataArr[i].MAINT_YN === "Y") {
                        TagArr.push("maint")
                    }
                    if (dataArr[i].CVS_YN === "Y") {
                        TagArr.push("cvs")
                    }
                    if (dataArr[i].CAR_WASH_YN === "Y") {
                        TagArr.push("carWash")
                    }
                    if (dataArr[i].KPETRO_YN === "Y") {
                        TagArr.push("kpetro")
                    }
                    if (dataArr[i].KPETRO_DP_YN === "Y") {
                        TagArr.push("kpetroDp")
                    }
                    if (dataArr[i].SELF_YN === "Y") {
                        TagArr.push("self")
                    }
                    let tmpAddr = dataArr[i].VAN_ADR.split(" ")
                    let params = {
                        gasStationUid: dataArr[i].UNI_ID,
                        gasStationName: dataArr[i].OS_NM,
                        brandCode: dataArr[i].POLL_DIV_CO || dataArr[i].GPOLL_DIV_CO,
                        gasStationType: dataArr[i].LPG_YN,
                        address: dataArr[i].VAN_ADR,
                        tel: dataArr[i].TEL,
                        sido: tmpAddr[0],
                        sigungu: tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ? tmpAddr[0] : tmpAddr[1],
                        tag: TagArr
                    }
                    gasArr.push(params)
                    /*models.gasStation.update({Tag: TagArr}, {
                        where: {
                            gasStationUid: dataArr[i].UNI_ID
                        }
                    })*/
                }
                //console.log(gasArr.length)
                models.gasStation.bulkCreate(gasArr, bulkOptions)
                    .then(data => {
                        //console.log(result)
                    })
                    .catch(err => {
                        //console.log(err)
                    })
            }
        }
    })
}
exports.updateGasStation = async () => {
    consola.info('updateGasStation start!')
    let created = 0
    let updated = 0
    let response = await axios.get(`${GasHost}/osModList.do?code=${GasKey}&out=json&day=3`)
    let items = response.data.RESULT.OIL
    for (let item of items) {
        let TagArr = []
        if (item.MAINT_YN === "Y") {
            TagArr.push("maint")
        }
        if (item.CVS_YN === "Y") {
            TagArr.push("cvs")
        }
        if (item.CAR_WASH_YN === "Y") {
            TagArr.push("carWash")
        }
        if (item.KPETRO_YN === "Y") {
            TagArr.push("kpetro")
        }
        if (item.KPETRO_DP_YN === "Y") {
            TagArr.push("kpetroDp")
        }
        if (item.SELF_YN === "Y") {
            TagArr.push("self")
        }
        let tmpAddr = item.VAN_ADR.split(" ")
        let params = {
            gasStationUid: item.UNI_ID,
            gasStationName: item.OS_NM,
            brandCode: item.POLL_DIV_CO || item.GPOLL_DIV_CO,
            gasStationType: item.LPG_YN,
            address: item.VAN_ADR,
            tel: item.TEL,
            sido: tmpAddr[0],
            sigungu: tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ? tmpAddr[0] : tmpAddr[1],
            tag: TagArr
        }
        let gasStation = await models.gasStation.findOne({
            where: {
                gasStationUid: item.UNI_ID
            }
        })
        if (gasStation) {
            await gasStation.update(params)
            updated++
        } else {
            await models.gasStation.create(params)
            created++
        }
    }
    consola.info('updateGasStation end!', {
        created, updated
    })
}
exports.updateGasPrice = async () => {
    consola.info('updateGasPrice start!')
    let count = 0
    for (let i = 0; i < areaCode.length; i++) {
        let response = await axios.get(`${GasHost}/oilPriceList.do?code=${GasKey}&out=json&area=` + areaCode[i])
        consola.info(`${GasHost}/oilPriceList.do?code=${GasKey}&out=json&area=` + areaCode[i])
        let items = response.data.RESULT.OIL
        for (let item of items) {
            let priceField = gasMap[item.PRODCD]
            if (priceField) {
                await models.gasStation.update({
                    [priceField]: item.PRICE
                }, {
                    where: {
                        gasStationUid: item.UNI_ID
                    }
                })
                count++
            }
        }
    }
    consola.info('updateGasPrice end!', count)
}
exports.updateGasGeo = async () => {
    //getGeo('서울특별시 강서구 마곡동 754')
    let data = await models.gasStation.findAll({
        where: {
            lat: null,
            lon: null
        },
        raw: true
    })
    for (let i in data) {
        let naverData = await getNaverGeo(data[i].address)
        let kakaoData = await getKakaoGeo(data[i].address)
        let geoData
        if (naverData) {
            geoData = naverData
        } else {
            geoData = kakaoData
        }
        if (geoData) {
            delete geoData.addr;
            await models.gasStation.update(geoData, {
                where: {
                    gasStationUid: data[i].gasStationUid
                }
            })
        }
    }
}
// exports.getGasStation = async () => {
//
//     // 2. api 사용 고유번호를 통해 opinet 정보를 가져온다.
//     models.gasStation.findAll(
//         {
//             where:{
//                 Gasoline:null,
//                 Diesel:null,
//                 PremiumGasoline:null,
//                 HeatingOil:null,
//                 lpg:null
//             }
//         }
//         ).then(async res => {
//             for (let data of res) {
//                 console.log(data.gasStationUid)
//                 // let response = await axios.get(`http://www.opinet.co.kr/api/detailById.do?code=F815200716&id=${data.gasStationUid}&out=json`)
//                 // let tmpData = response.data.RESULT.OIL[0]
//                 // let tmpAddr = tmpData.VAN_ADR.split(" ")
//                 // let params = {
//                 //     brandCode: tmpData.POLL_DIV_CO || tmpData.GPOLL_DIV_CO,
//                 //     gasStationType: tmpData.LPG_YN,
//                 //     address: tmpData.VAN_ADR,
//                 //     tel: tmpData.TEL,
//                 //     isCarWash: tmpData.CAR_WASH_YN === 'Y',
//                 //     isConvenience: tmpData.CVS_YN === 'Y',
//                 //     isKpetro: tmpData.KPETRO_YN === 'Y',
//                 //     oilPrice: tmpData.OIL_PRICE,
//                 //     sido: tmpAddr[0],
//                 //     sigungu: tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ? tmpAddr[0] : tmpAddr[1],
//                 //     lat: proj4(firstProjection, secondProjection, [tmpData.GIS_X_COOR, tmpData.GIS_Y_COOR])[0] + 6.2799831,
//                 //     lon: proj4(firstProjection, secondProjection, [tmpData.GIS_X_COOR, tmpData.GIS_Y_COOR])[1] + 12.7866837,
//                 // }
//                 // Object.assign(data, params)
//                 // data.save()
//             }
//     })
//
// }

async function updateGas(dataArr) {
    for (let i = 0; i < dataArr.length; i++) {
        switch (dataArr[i].PRODCD) {
            //휘발유
            case "B027":
                await models.gasStation.update({Gasoline: dataArr[i].PRICE}, {
                    where: {
                        gasStationUid: dataArr[i].UNI_ID
                    }
                })
                break
            //경유
            case "D047":
                await models.gasStation.update({Diesel: dataArr[i].PRICE}, {
                    where: {
                        gasStationUid: dataArr[i].UNI_ID
                    }
                })
                break
            //고급휘발유
            case "B034":
                await models.gasStation.update({PremiumGasoline: dataArr[i].PRICE}, {
                    where: {
                        gasStationUid: dataArr[i].UNI_ID
                    }
                })
                break
            //실내등유
            case "C004":
                await models.gasStation.update({HeatingOil: dataArr[i].PRICE}, {
                    where: {
                        gasStationUid: dataArr[i].UNI_ID
                    }
                })
                break
            //자동차 부탄
            case "K015":
                await models.gasStation.update({lpg: dataArr[i].PRICE}, {
                    where: {
                        gasStationUid: dataArr[i].UNI_ID
                    }
                })
                break
        }
    }
}

async function getNaverGeo(addr) {
    let requestUrl = `${NaverMap}` + encodeURI(addr)
    let header = {
        'X-NCP-APIGW-API-KEY-ID': env.NaverKey,
        'X-NCP-APIGW-API-KEY': env.NaverSecretKey
    }
    let option = {
        url: requestUrl,
        headers: header
    }
    let geo = {}
    await request.get(option, (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {

        }
    }).then(async function (body) {
        //console.log(body)
        let data = JSON.parse(body)
        if (data.status === 'OK') {
            if (data.meta.count > 0) {
                geo = {
                    lat: data.addresses[0].y,
                    lon: data.addresses[0].x,
                    addr: data.addresses[0].roadAddress
                }
            } else {
                geo = null
            }
        }
    })
    return geo
}

async function getKakaoGeo(addr) {
    let requestUrl = `${KakaoMap}` + encodeURI(addr)
    let header = {
        'Authorization': 'KakaoAK ' + env.KakaoKey
    }
    let option = {
        url: requestUrl,
        headers: header
    }
    let geo = {}
    await request.get(option, (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {
        }
    }).then(async function (body) {
        //console.log(body)
        let data = JSON.parse(body)
        if (data.meta.total_count > 0) {
            geo = {
                lat: data.documents[0].y,
                lon: data.documents[0].x,
                addr: data.documents[0].address_name
            }
        } else {
            geo = null
        }
    })
    return geo
}

async function getLatLon(address) {
    let geoData;
    if (address && address !== 'null') {
        geoData = await getNaverGeo(address)
    } else {
        geoData = await getKakaoGeo(address)
    }
    return geoData
}

// 전기차 충전소 정보 입력 scheduler
exports.insertEvStation = async () => {
    consola.info('insertEvStation start!')
    let evStations = await models.evChargeStation.findAll({
        attributes: ['statId']
    })
    let statIds = evStations.map(({statId}) => statId)
    let continueFlag = true
    let page = 1
    while (continueFlag) {
        let response = await axios.get(`${HOST}?serviceKey=${SERVICE_KEY}&numOfRows=1000&pageNo=` + page)
        console.log(`${HOST}?serviceKey=${SERVICE_KEY}&pageNo=` + page)
        let resultCount = Number(response.data.header[0].numOfRows)
        if (resultCount > 0) {
            let items = response.data.items[0].item
            for (let item of items) {
                //새로운 statId station 생성
                if (item.statId !== 'CV000983') {
                    if (statIds.indexOf(item.statId) < 0) {
                        let geoData = await getLatLon(item.addr)
                        let tmpAddr = item.addr.split(" ")
                        item.sido = tmpAddr[0]
                        item.sigungu = tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ? tmpAddr[0] : tmpAddr[1]
                        item.lat = geoData && geoData.lat
                        item.lon = geoData && geoData.lon
                        item.busiCall = 'null' === item.busiCall ? '' : item.busiCall
                        item.location = item.location === 'null' ? null : item.location
                        item.isParkingFree = item.parkingFree === 'N' ? false : true
                        item.isLimit = item.limitYn === 'N' ? false : true
                        item.limitDetail = item.limitDetail
                        item.isChargerDelete = item.delYn === 'N' ? false : true
                        item.chargerDeleteDetail = item.delDetail
                        consola.info('create newStations', item.statId)
                        await models.evChargeStation.create(item)
                        statIds.push(item.statId)
                    } else {
                        //기존 evStation update
                        let evStation = await models.evChargeStation.findOne({
                            where: {
                                statId: item.statId,
                            }
                        })
                        evStation.location = item.location === 'null' ? null : item.location
                        evStation.isParkingFree = item.parkingFree === 'N' ? false : true
                        evStation.isLimit = item.limitYn === 'N' ? false : true
                        evStation.limitDetail = item.limitDetail
                        evStation.isChargerDelete = item.delYn === 'N' ? false : true
                        evStation.chargerDeleteDetail = item.delDetail
                        await evStation.save()

                        let evCharger = await models.evCharger.findOne({
                            where: {
                                statId: item.statId,
                                chgerId: item.chgerId
                            }
                        })
                        if (evCharger) {
                            item.lastChargeStartDate = item.lastTsdt
                            item.lastChargeEndDate = item.lastTedt
                            item.output = item.output || 0
                            item.method = item.method
                            Object.assign(evCharger, item)
                            await evCharger.save()
                        }
                    }
                }
                // 새로운 충전기 생성
                await models.evCharger.findOrCreate({
                    where: {
                        statId: item.statId,
                        chgerId: item.chgerId
                    },
                    defaults: {
                        statId: item.statId,
                        chgerId: item.chgerId,
                        stat: item.stat,
                        chgerType: item.chgerType,
                        statUpdDt: item.statUpdDt,
                        powerType: item.powerType,
                        lastChargeStartDate: item.lastTsdt,
                        lastChargeEndDate: item.lastTedt,
                        output: item.output || 0,
                        method: item.method,
                    }
                }).spread((ev, created) => {
                    if (created) {
                        consola.info('create new charger', ev.statId + ':' + ev.chgerId)
                    }
                })
            }
        } else {
            continueFlag = false
        }
        page++
    }
    consola.info('insertEvStation end!')
}

exports.updateEvStatus = async () => {
    consola.info('updateEvStatus start!')
    //change getEvInfo -> getEvStatus
    //TODO: change chgerId unique & bulkUpdate Test
    let page = 1
    let continueFlag = true
    while (continueFlag) {
        let response = await axios.get(`${UPDATEHOST}?serviceKey=${SERVICE_KEY}&numOfRows=1000&pageNo=` + page)
        console.log(`${UPDATEHOST}?serviceKey=${SERVICE_KEY}&numOfRows=1000&pageNo=` + page)
        let resultCount = Number(response.data.items[0].item.length)
        let items = response.data.items[0].item
        if (resultCount > 0) {
            for (let item of items) {
                await models.evCharger.update({
                    stat: item.stat,
                    statUpdDt: item.statUpdDt,
                    lastChargeStartDate: item.lastTsdt,
                    lastChargeEndDate: item.lastTedt,
                }, {
                    where: {
                        statId: item.statId,
                        chgerId: item.chgerId
                    }
                })
                consola.info(`EV Station ID : ${item.statId} EV Charger ID : ${item.chgerId} Status : ${evStatus[item.stat]} (${item.stat})`)
            }
        } else {
            continueFlag = false
        }
        page++;
    }
    consola.info('updateEvStatus end!')
}

exports.updateTagEv = async () => {
    consola.info('updateTagEv start!')
    let evStationArr = await models.evChargeStation.findAll(
        {
            attributes: ['statId', 'useTime', 'info', 'evType'],
            raw: true
        }
    )
    for (let i in evStationArr) {
        let evChargerArr = await models.evCharger.findAll(
            {
                attributes: ['chgerType'],
                where: {statId: evStationArr[i].statId},
                raw: true
            }
        )
        let typeTag = []
        let data = {
            statId: evStationArr[i].statId,
            tag: []
        }
        if (evStationArr[i].useTime) {
            if (evStationArr[i].useTime.indexOf('24') !== -1) {
                typeTag.push('24h')
            }
        }
        if (evStationArr[i].info) {
            if (evStationArr[i].info.indexOf('24') !== -1) {
                typeTag.push('24h')
            }
        }
        if (evStationArr[i].evType) {
            if (evStationArr[i].evType === 1) {
                typeTag.push("superCharger")
            }
            if (evStationArr[i].evType === 2) {
                typeTag.push("destination")
            }
        }
        for (let j in evChargerArr) {
            switch (evChargerArr[j].chgerType) {
                case '01':
                    typeTag.push("rapidity")
                    typeTag.push("DCChademo")
                    break
                case '02':
                    typeTag.push("slow")
                    typeTag.push("AC_SLOW")
                    break
                case '03':
                    typeTag.push("rapidity")
                    typeTag.push("AC")
                    typeTag.push("DCChademo")
                    break
                case '04':
                    typeTag.push("rapidity")
                    typeTag.push("DCCombo")
                    break
                case '05':
                    typeTag.push("rapidity")
                    typeTag.push("DCCombo")
                    typeTag.push("DCChademo")
                    break
                case '06':
                    typeTag.push("rapidity")
                    typeTag.push("DCCombo")
                    typeTag.push("DCChademo")
                    typeTag.push("AC")
                    break
                case '07':
                    typeTag.push("rapidity")
                    typeTag.push("AC")
                    break
            }
        }
        let setTag = Array.from(new Set(typeTag))
        data.tag = setTag
        await models.evChargeStation.update({tag: data.tag}, {
            where: {
                stat_id: data.statId
            }
        })
    }
    consola.info('updateTagEv end!')
}

// 전기차 충전소 정보 입력 (KEPCO) schduler
exports.insertKepcoToEvCharge = async () => {
    consola.info('insertEvStation start!')
    let evStations = await models.evChargeStation.findAll({
        attributes: ['statId']
    })
    let statIds = evStations.map(({statId}) => statId)
    let requestUrl = `${KEPCO}?pageNo=1&numOfRows=2000&ServiceKey=${SERVICE_KEY}`
    let kepcoArr = []
    request.get(requestUrl, async (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {
            if (res.statusCode === 200) {
                let xmlToJson = convert.xml2json(body, options)
                kepcoArr = JSON.parse(xmlToJson).response.body.items.item
                for (let i of kepcoArr) {
                    let item = {}
                    item.addr = i.addr
                    item.powerType = i.cpNm
                    item.chgerId = i.cpId
                    // 충전기 상태
                    switch (i.cpStat) {
                        case "1":
                            item.stat = 2
                            break;
                        case "2":
                            item.stat = 3
                            break;
                        case "3":
                            item.stat = 5
                            break;
                        case "4":
                            item.stat = 1
                            break;
                        case "5":
                            item.stat = 9
                            break;
                    }
                    // 충전기 타입
                    switch (i.cpTp) {
                        case "1":
                        case "2":
                        case "3":
                        case "4":
                            item.chgerType = "02"
                            break;
                        case "5":
                            item.chgerType = "01"
                            break;
                        case "6":
                            item.chgerType = "07"
                            break;
                        case "7":
                            item.chgerType = "04"
                            break;
                        case "8":
                            item.chgerType = "05"
                            break;
                        case "9":
                            item.chgerType = "03"
                            break;
                        case "10":
                            item.chgerType = "06"
                            break;
                    }
                    let tmpAddr = i.addr.split(" ")
                    item.sido = tmpAddr[0]
                    tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ? item.sigungu = tmpAddr[0] : item.sigungu = tmpAddr[1]
                    item.statId = 'KP' + i.csId.padStart(6, '0')
                    item.busiId = 'KP'
                    item.busiNm = '한국전력'
                    item.busiCall = '1899-2100'
                    item.statNm = i.csNm
                    item.statUpdDt = moment(i.statUpdateDatetime).format("YYYYMMDDhhmmss")
                    if (item.chgerType !== null && item.chgerType !== undefined) {
                        //새로운 statId station 생성
                        if (statIds.indexOf(item.statId) < 0) {
                            let geoData = await getLatLon(i.addr)
                            item.lat = geoData.lat
                            item.lon = geoData.lon
                            await models.evChargeStation.create(item)
                            statIds.push(item.statId)
                        }
                        // 새로운 충전기 생성
                        await models.evCharger.findOrCreate({
                            where: {
                                statId: item.statId,
                                chgerId: item.chgerId
                            },
                            defaults: {
                                statId: item.statId,
                                chgerId: item.chgerId,
                                stat: item.stat,
                                chgerType: item.chgerType,
                                statUpdDt: item.statUpdDt,
                                powerType: item.powerType
                            }
                        }).spread((ev, created) => {
                            if (created) {
                                consola.info('create new charger', ev.statId + ':' + ev.chgerId)
                            }
                        })
                    }
                }
            }
        }
    })
}

exports.updateKepcoToEvCharge = async () => {
    consola.info('updateEvStatus start!')
    let requestUrl = `${KEPCO}?pageNo=1&numOfRows=2000&ServiceKey=${SERVICE_KEY}`
    let kepcoArr = []
    request.get(requestUrl, async (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {
            if (res.statusCode === 200) {
                let xmlToJson = convert.xml2json(body, options)
                kepcoArr = JSON.parse(xmlToJson).response.body.items.item
                for (let i of kepcoArr) {
                    let item = {}
                    item.statId = 'KP' + i.csId.padStart(6, '0')
                    item.statUpdDt = moment(i.statUpdateDatetime).format("YYYYMMDDhhmmss")
                    item.chgerId = i.cpId
                    // 충전기 상태
                    switch (i.cpStat) {
                        case "1":
                            item.stat = 2
                            break;
                        case "2":
                            item.stat = 3
                            break;
                        case "3":
                            item.stat = 5
                            break;
                        case "4":
                            item.stat = 1
                            break;
                        case "5":
                            item.stat = 9
                            break;
                    }
                    await models.evCharger.update({
                        stat: item.stat,
                        statUpdDt: item.statUpdDt
                    }, {
                        where: {
                            statId: item.statId,
                            chgerId: item.chgerId
                        }
                    })
                    consola.info(`EV Station ID : ${item.statId} EV Charger ID : ${item.chgerId} Status : ${evStatus[item.stat]} (${item.stat})`)
                }
            }
            consola.info('updateEvStatus end!')
        }
    })
}
// 주차장 정보입력(NIA 한국지능정보진흥원) scheduler
exports.insertParking = async () => {
    consola.info('insertParking start!!')
    let continueFlag = true
    let page = 1
    let params = []; //bulkCreate를 위한 Array
    while (continueFlag) {
        let response = await axios.get(`${PARKINGHOST}?type=json&serviceKey=${SERVICE_KEY}&numOfRows=100&pageNo=` + page)
        let resultCount = response.data.response.body && response.data.response.body.items.length
        if (resultCount > 0) {
            let items = response.data.response.body.items
            for (let item of items) {
                let address = item.rdnmadr || item.lnmadr
                let geoData = await getLatLon(address)
                if (geoData && geoData.lat && geoData.lon) {
                    let isParkingSite = await models.parkingSite.findOne({
                        where: {
                            [Op.or]: [
                                {
                                    address: {
                                        [Op.like]: item.rdnmadr
                                    },
                                    name: {
                                        [Op.like]: item.prkplceNm
                                    }
                                }, {
                                    address: {
                                        [Op.like]: item.lnmadr
                                    },
                                    name: {
                                        [Op.like]: item.prkplceNm
                                    }
                                }, {
                                    parkingPlaceNo: {
                                        [Op.like]: item.prkplceNo
                                    }
                                }
                            ]
                        }
                    })
                    if (isParkingSite) {
                        // parking Site migration(Update) 진행
                        isParkingSite.metaData = item
                        isParkingSite.parkingPlaceNo = item.prkplceNo
                        isParkingSite.timeInfo = `평일: ${item.weekdayOperOpenHhmm || '--:--'} ~ ${item.weekdayOperColseHhmm || '--:--'} \n토요일: ${item.satOperOperOpenHhmm || '--:--'} ~ ${item.satOperCloseHhmm || '--:--'} \n공휴일:  ${item.holidayOperOpenHhmm || '--:--'} ~ ${item.holidayCloseOpenHhmm || '--:--'}`
                        isParkingSite.price = item.basicCharge
                        isParkingSite.priceInfo = `1주차기본시간: ${item.basicTime || '--'}분 \n주차기본요금: ${item.basicCharge || '--'}원 \n추가단위시간: ${item.addUnitTime || '--'}분 \n추가단위요금: ${item.addUnitCharge || '--'}원`
                        isParkingSite.parkingLot = item.prkcmprt
                        isParkingSite.manager = item.institutionNm
                        isParkingSite.tel = item.phoneNumber
                        isParkingSite.lastUpdateDate = item.referenceDate
                        isParkingSite.lat = geoData.lat || item.latitude
                        isParkingSite.lon = geoData.lon || item.longitude
                        await isParkingSite.save()
                        consola.log(`UPDATE ParkingSite Info:${isParkingSite.parkingPlaceNo}`)
                    } else {
                        // parking Site create 진행
                        let obj = {
                            name: item.prkplceNm,
                            siteType: 2,
                            lat: geoData.lat || item.latitude,
                            lon: geoData.lon || item.longitude,
                            parkingLot: item.prkcmprt,
                            tel: item.phoneNumber,
                            manager: item.institutionNm,
                            price: item.basicCharge,
                            address: item.rdnmadr || item.lnmadr,
                            priceInfo: `주차기본시간: ${item.basicTime || '--'}분 \n주차기본요금: ${item.basicCharge || '--'}원 \n추가단위시간: ${item.addUnitTime || '--'}분 \n추가단위요금: ${item.addUnitCharge || '--'}원`,
                            timeInfo: `평일: ${item.weekdayOperOpenHhmm || '--:--'} ~ ${item.weekdayOperColseHhmm || '--:--'} \n토요일: ${item.satOperOperOpenHhmm || '--:--'} ~ ${item.satOperCloseHhmm || '--:--'} \n공휴일:  ${item.holidayOperOpenHhmm || '--:--'} ~ ${item.holidayCloseOpenHhmm || '--:--'}`,
                            metaData: item,
                            parkingPlaceNo: item.prkplceNo,
                            lastUpdateDate: item.referenceDate
                        }
                        params.push(obj)
                    }
                }
            }
        } else {
            continueFlag = false
        }
        page++
        await models.parkingSite.bulkCreate(params, {ignoreDuplicates: true})
        console.log(`COMPLETE BULK CREATE : ${params.length}`)
        params = []
    }
    consola.info('insertParking end!')
}

// 주차장 충전소 매핑 scheduler
exports.parkingToEv = async () => {
    consola.info('parkingToEv start!!')
    let evStations = await models.evChargeStation.findAll()
    for (let evStation of evStations) {
        let parkingSites = await models.parkingSite.findAll({
            where: {
                address: {
                    [Op.like]: evStation.addr
                }
            }
        })
        if (parkingSites && parkingSites.length === 1) {
            if (!evStation.parkingUid) {
                evStation.parkingUid = parkingSites[0].uid
                consola.log(`Parking To EvStation Complete: ${evStation.parkingUid}`)
                evStation.save()
            }
        }
    }
    consola.info('parkingToEv end!!')
}


// 세차장 정보 입력 scheduler
exports.getCarWash = async () => {
    let sampleData_car_wash = XLSX.readFile('carWashV2.xls')
    let carWashSampleData = sampleData_car_wash.Sheets["carWash"]
    //console.log(carWashSampleData.length)
    let params = []
    for (let i = 3; i < 14579; i++) {
        let obj = {
            carWashName: carWashSampleData["A" + i].v,
            carWashIndustry: carWashSampleData["AD" + i].v,
            carWashType: carWashSampleData["E" + i].v,
            address: carWashSampleData["F" + i].v,
            sido: carWashSampleData["B" + i].v,
            sigungu: carWashSampleData["C" + i].v,
            closedDay: carWashSampleData["G" + i].v,
            weekdayOperOpenHhmm: carWashSampleData["H" + i].v ? carWashSampleData["H" + i].v : '',
            weekdayOperCloseHhmm: carWashSampleData["I" + i].v,
            holidayOperOpenHhmm: carWashSampleData["J" + i].v,
            holidayOperCloseHhmm: carWashSampleData["K" + i].v,
            carWashChargeInfo: carWashSampleData["L" + i].v,
            phoneNumber: carWashSampleData["N" + i].v,
            lat: carWashSampleData["P" + i].v,
            lon: carWashSampleData["Q" + i].v,
            typeTag: JSON.parse(carWashSampleData["AI" + i].v),
            timeTag: JSON.parse(carWashSampleData["AJ" + i].v),
        }
        params.push(obj)
    }
    models.carWash.bulkCreate(params, bulkOptions)
}
exports.parkingSites = async () => {
// 주유소 정보 입력 scheduler
// 1. XlSX 파일을 DB에 넣는다. gasStation 고유번호만
// 1-1. gasStation 정보
    let hiparkingList = XLSX.readFile('hiparkingList.xlsx')
    let parkingSampleData = hiparkingList.Sheets["Sheet1"]
    let params = []
    let tempImage = [
        'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAxOTA5MDNfMjM1%2FMDAxNTY3NDc1MTAwMzY5.6a9aN-03rYbCzGEKiaBu5tg2-LUsfhRelIYnQYARHx0g.5JMXPBlC8T3FAO4W0Z8B7nIQx6BXL6BWX2_WR6WHdlog.JPEG.icarus3737%2F20190819_174018.jpg&type=b400',
        'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAxNzA5MTlfMTk5%2FMDAxNTA1ODA5NjcxNzA5.miimXLTKF6MIjJ121MdZfqOzlyYNT8gFDdS3B5oDDWIg.3lWMYdvzS3jEhAIkWJ96OmJJvkGtCKEJJUDFsRBL2LIg.JPEG.buricollie%2F20170429_125017.jpg&type=b400',
        'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAxODA3MDZfMjIx%2FMDAxNTMwODcyODk1NTU1.IN4eeDlMSOXR3GItIS49kz9ZO02EJDYed3_wTt_TzQIg.O00Y_bXu0ZeXmleF2Np_-Fxj3nBxM6qS-3XdDkyHiKMg.JPEG.jayonce1004%2FIMG_3217.JPG&type=b400',
        'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAxOTA5MjJfMTgy%2FMDAxNTY5MTUwODQ5ODYx.JSbVPP4hOh1CRG976kjIaTRxZkbTCfPxnKqfVo5Y3yog.uAX6eDX2WI8m75hxO0Ykfo9TwGAImqj2S2Uq1GARJtkg.JPEG.jayrynn%2FIMG_5978.JPG&type=b400',
        'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAxODAzMTZfNiAg%2FMDAxNTIxMTg0OTcxOTY5.1M2-L4cSk3qaPCNX8GOch7u7AJ2qQnzjiej1RVGxKQcg._EhHBgkQS-PPLQaE6vkw0tnFJJkw0Zpj98Ago-_SNqcg.JPEG.762501%2F8.jpg&type=b400',
        'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAxODA1MjRfMSAg%2FMDAxNTI3MTQzMjY0MDA0.ZR-IWlDmrH_Z5wmJ5KNumoZv62KcD5eqySY2e62R4rYg.P9P0EVm0Fxap4zUzy-ha-edeUyw_NdZ3-z2HvP3Vvk8g.JPEG.way2field%2F5.jpg&type=b400',
        'https://lh3.googleusercontent.com/proxy/9EZ0e3vhvV37fxHqaCFu8XG1NQQrhqXSIVIcro74VB9cRG0W7cIjLNjDIw2MUv2fj7mTif_ZjetlTfObYEyeP8fV3Aq3lkrGufCzn-MiEhzxzqVeaV0',
        'https://blog.hmgjournal.com/images_n/contents/parking-zone-story%20(1).jpg',
        'https://lh3.googleusercontent.com/proxy/qytjybM5LCj1h1H7ovPPcySiGS8u70-UmJrYJDmEqs9Z3C5F0T09se35vBwOQ8GXtqxyuUUTcbu9E0KNLIUgRBjUFpzUoSMZE2Fmoy3xWmJQ-3tupV2VoxtHPGEi1UgC_kEfC6QXyL4y11fSwjDE-jq7IjRfxvVMsvHcVXihHA',
        'https://cdn.clien.net/web/api/file/F01/8374778/f2f41d01f2cab.jpg',
        'https://newsimg.hankookilbo.com/cms/articlerelease/2019/11/15/201911152046747858_4.jpg',
        'https://lh3.googleusercontent.com/proxy/m34zDiWF5h-wp15a9x3SzelJ3CWIDntto1ekFUyeNnVS57v_2P91Xw2hteSNZt4wlOi-bhx9ijkXCDiJ95aSRMu67HoobLf73r2SHvaMrMngMdPbDSYoayxhwML_FQhRliHWMTPKfbKbeoRX7gHcEXCgRn_l20WOK4SG9ol1lg'
    ]

    function randomArray(arr) {
        let randomVal = arr[Math.floor(Math.random() * arr.length)]
        return randomVal
    }

    function imageList() {
        let imageArr = []
        imageArr.push(randomArray(tempImage))
        imageArr.push(randomArray(tempImage))
        imageArr.push(randomArray(tempImage))
        return imageArr
    }

    for (let i = 2; i < 168; i++) {
        let obj = {
            name: parkingSampleData["A" + i].v,
            address: parkingSampleData["B" + i].v,
            siteType: 0,
            isActive: 1,
            parkingLot: parkingSampleData["C" + i].v,
            priceInfo: parkingSampleData["E" + i].v,
            lat: parkingSampleData["G" + i].v,
            lon: parkingSampleData["F" + i].v,
            paymentTag: [],
            brandTag: [],
            productTag: [],
            optionTag: [],
            carTag: [],
            picture: [],
            price: [],
            operationTime: parkingSampleData["D" + i].v,
        }
        params.push(obj)
    }
    models.parkingSite.bulkCreate(params)
}
exports.teslaStationListInfo = async () => {
    let teslaArr = await models.evChargeStation.findAll({
        attributes: ['statId'],
        where: {
            evType: {
                [Op.or]: [1, 2]
            }
        },
        //limit: 1
    })
    for (let i in teslaArr) {
        await getHtml(teslaArr[i].statId)
    }
}
exports.teslaStationList = async () => {
    getHtmlStation("https://www.tesla.com/ko_KR/findus/list/superchargers/South+Korea", 1)
    getHtmlStation("https://www.tesla.com/ko_KR/findus/list/chargers/South+Korea", 2)
}

async function getHtml(code) {
    let link = "https://www.tesla.com/ko_KR/findus/location/charger/" + code
    try {
        console.log(link)
        await axios.get(link).then(html => {
            let ulList = []
            const $ = cheerio.load(html.data)
            const $bodyList = $("div.container")
            $bodyList.each(function (i, elem) {
                ulList[i] = {
                    text: $(this).find('p').text(),
                }
            })

            const data = ulList.filter(n => n.text)
            return data
        }).then(async function (res) {
            let text = res[0].text
            let start
            let _start
            text = text.replace("자처", "차저")
            if (text.indexOf("Tesla") !== -1) {
                start = text.indexOf("기 ")
                _start = text.indexOf("Tesla")
            } else {
                start = text.indexOf("저 ")
                _start = text.indexOf("수퍼")
            }
            let end = text.indexOf("개", start + 1)
            let charger = text.substring(start + 1, end)
            //let _end = text.indexOf("kW", _start+1)
            let info = text.substring(_start, 500)
            let infoText
            if (text.indexOf("Tesla") !== -1) {
                infoText = info.replace("W", "W\n")
            } else {
                infoText = info.replace("시간 이용", "시간 이용\n")
            }
            let chargerCount = parseInt(charger)
            await models.evChargeStation.update({stall: chargerCount, info: infoText}, {
                where: {
                    statId: code
                }
            })
            //console.log(text.replace(/[0-9]/g))
        })
    } catch (error) {
        console.error(error)
    }
}

async function getHtmlStation(link, type) {
    try {
        await axios.get(link).then(html => {
            let ulList = []
            const $ = cheerio.load(html.data)
            const $bodyList = $("div.state").children('.row-state').children('.vcard')
            $bodyList.each(function (i, elem) {
                ulList[i] = {
                    stat_id: $(this).find('a').attr('href'),
                    name: $(this).find('a').text(),
                    addr: $(this).find('.street-address').text(),
                    phone: $(this).find('.value').first().text(),
                    busi_call: $(this).find('.value').last().text()
                }
            })
            const data = ulList.filter(n => n.name)
            return data
        }).then(async function (res) {
            let params = []
            let compareParams = []
            for (let i in res) {
                let statIdArr = res[i].stat_id.split('/');
                let statId = (statIdArr[statIdArr.length - 1]);
                let data = {}
                data.statNm = res[i].name
                data.statId = statId
                data.phone = typeof res[i].phone === 'object' ? '' : res[i].phone
                data.busiCall = res[i].busi_call.replace(/\s/gi, "");
                data.evType = type
                let tmpAddr = res[i].addr.split(" ")
                data.sido = tmpAddr[0]
                //슈퍼 차저 만 비교용 이름 추가
                //이름 변경
                let trimName = res[i].name.replace(/\s/gi, "");
                let replaceName = trimName
                //짧은 하이픈
                if (trimName.indexOf('-') !== -1) {
                    replaceName = trimName.replace('-', '')
                }
                //긴 하이픈
                if (trimName.indexOf('–') !== -1) {
                    replaceName = trimName.replace('–', '')
                }
                data.compareName = replaceName
                tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ?
                    data.sigungu = typeof tmpAddr[0] === 'object' ? '' : tmpAddr[0] : data.sigungu = typeof tmpAddr[1] === 'object' ? '' : tmpAddr[1]
                data.phone = typeof res[i].phone === 'object' ? '' : res[i].phone.replace(/\s/gi, "");
                let geoData = await getNaverGeo(res[i].addr)
                if (!geoData) {
                    geoData = await getKakaoGeo(res[i].addr)
                }
                Object.assign(data, geoData)
                params.push(data)
                compareParams.push(replaceName)
            }
            // 충전소 table을 순회하면서, statNm과, compareName을 수정 destroy 진행 시, 삭제가 되는 부분을 방지
            for (let param of params) {
                await models.evChargeStation.update(
                    {
                        statNm: param.statNm,
                        compareName: param.compareName
                    },
                    {
                        where: {
                            statId: param.statId
                        }
                    })
            }
            // 존재하지 않는 충전소의 경우 삭제(soft-delete)
            await models.evChargeStation.destroy({
                where: {
                    evType: type,
                    compareName: {[Op.notIn]: compareParams}
                }
            })
            let evStations = await models.evChargeStation.findAll({
                attributes: ['statId']
            })
            let statIds = evStations.map(({statId}) => statId)
            for (let param of params) {
                //새로운 statId station 생성
                if (statIds.indexOf(param.statId) < 0) {
                    if (param.addr) {
                        let tmpAddr = param.addr.split(" ")
                        param.sido = tmpAddr[0]
                        param.sigungu = tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ? tmpAddr[0] : tmpAddr[1]
                        param.lat = parseFloat(param.lat)
                        param.lon = parseFloat(param.lon)
                    }
                    consola.info('create newStations', param.statId)
                    // 새로운 충전기 생성
                    let data = {
                        statNm: param.statNm,
                        statId: param.statId,
                        phone: param.phone,
                        busiCall: param.busiCall,
                        evType: type,
                        sido: param.sido,
                        compareName: param.compareName,
                        sigungu: param.sigungu,
                        lat: param.lat,
                        lon: param.lon,
                        addr: param.addr
                    }
                    await models.evChargeStation.create(data)
                }
            }
        })
    } catch (error) {
        console.error(error)
    }
}

