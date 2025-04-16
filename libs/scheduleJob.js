'use strict'
const XLSX = require('xlsx')
const models = require('../models')
const convert = require('xml-js')
const request = require('request-promise-native')
const env = require('../configs/env.json')
const HOST = env.HOST
const UPDATEHOST = env.UPDATEHOST
const SERVICE_KEY = env.SERVICE_KEY
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
exports.updateGasStation = async (areaCode) => {
    let requestUrl = `${GasHost}/osModList.do?code=${GasKey}&out=json&area=` + areaCode
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
                    models.gasStation.findOne(
                        {
                            where: {
                                gasStationUid: dataArr[i].UNI_ID
                            }
                        }).then(async function (obj) {
                        if (obj) {
                            await obj.update(params)
                        } else {
                            await models.gasStation.create(params)
                        }
                    })
                }
            }
        }
    })
}
exports.updateGasPrice = async (areaCode) => {
    let requestUrl = `${GasHost}/oilPriceList.do?code=${GasKey}&out=json&area=` + areaCode
    request.get(requestUrl, (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {
            if (res.statusCode === 200) {
                let data = JSON.parse(body)
                let dataArr = data.RESULT.OIL
                updateGas(dataArr)
            }
        }
    })
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
        if(geoData) {
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

// 전기차 중전소 정보 입력 scheduler
exports.insertEvStation = async (pageNo) => {
    let requestUrl = `${HOST}?serviceKey=${SERVICE_KEY}&pageNo=` + pageNo
    let evChargeItemArr = []
    let requestData = request.get(requestUrl, (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {
            if (res.statusCode === 200) {
                let xmlToJson = convert.xml2json(body, options)
                evChargeItemArr = JSON.parse(xmlToJson).response.body.items.item
                try {
                    for (let i of evChargeItemArr) {
                        i.useTime = typeof i.useTime === 'object' ? '' : i.useTime
                        i.statUpdDt = typeof i.statUpdDt === 'object' ? '' : i.statUpdDt
                        i.powerType = typeof i.powerType === 'object' ? '' : i.powerType
                        i.lng = i.lng.replace(/(?:\\[rn]|[\r\n]+)+/g, "")
                        i.lon = i.lng
                        let tmpAddr = i.addr.split(" ")
                        i.sido = tmpAddr[0]
                        tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ? i.sigungu = tmpAddr[0] : i.sigungu = tmpAddr[1]
                    }
                    models.evChargeStation.bulkCreate(evChargeItemArr, bulkOptions)
                        .then(data => {
                            //console.log(result)
                        })
                        .catch(err => {
                            //console.log(err)
                        })
                    models.evCharger.bulkCreate(evChargeItemArr, bulkOptions)
                        .then(data => {
                            //console.log(result)
                        })
                        .catch(err => {
                            //console.log(err)
                        })
                }catch (e){
                    return 0
                }
            }
        }
    }).then(function (data){
        let result = convert.xml2json(data, options)
        return JSON.parse(result).response.header.resultCount
    }).catch(function (){
        return 0
    })
    return requestData
    //return requestData
}
exports.updateEvStatus = async (pageNo) => {
    let requestUrl = `${HOST}?serviceKey=${SERVICE_KEY}&pageNo=` + pageNo
    let requestData = request.get(requestUrl, (err, res, body) => {
        if (err) {
            console.log(`err => ${err}`)
        } else {
            if (res.statusCode === 200) {
                let xmlToJson = convert.xml2json(body, options)
                let updateData = JSON.parse(xmlToJson).response.body.items.item
                try {
                    for (let i of updateData) {
                        i.statUpdDt = typeof i.statUpdDt === 'object' ? '' : i.statUpdDt
                        models.evCharger.update({stat: i.stat, statUpdDt: i.statUpdDt}, {
                            where: {
                                statId: i.statId,
                                chgerId: i.chgerId
                            }
                        })
                    }
                }catch{
                    return 0
                }
            }
        }
    }).then(function (data){
        let result = convert.xml2json(data, options)
        return JSON.parse(result).response.header.resultCount
    }).catch(function (){
        return 0
    })
    return requestData
}
exports.updateTagEv = async () => {
    let evStationArr = await models.evChargeStation.findAll(
        {
            attributes: ['statId', 'useTime', 'info'],
            //where: {statId: 'ME000001'},
            raw: true
        }
    )
    for (let i in evStationArr) {
        let tempArr = []
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
        for (let j in evChargerArr) {
            //console.log(evChargerArr[j].chgerType)
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
        models.evChargeStation.update({tag: data.tag}, {
            where: {
                stat_id: data.statId
            }
        })
    }
    //console.log(evStationArr.length)
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
                if(text.indexOf("Tesla") !== -1){
                    start = text.indexOf("기 ")
                    _start = text.indexOf("Tesla")
                }else{
                    start = text.indexOf("저 ")
                    _start = text.indexOf("수퍼")
                }
                let end = text.indexOf("개", start + 1)
                let charger = text.substring(start + 1, end)
                //let _end = text.indexOf("kW", _start+1)
                let info = text.substring(_start, 500)
                let infoText
                if(text.indexOf("Tesla") !== -1){
                    infoText = info.replace("W", "W\n")
                }else{
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
        console.log(link)
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
                let statId = (statIdArr[statIdArr.length-1]);
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
                if(trimName.indexOf('-') !== -1){
                    replaceName = trimName.replace('-','')
                }
                //긴 하이픈
                if(trimName.indexOf('–') !== -1){
                    replaceName = trimName.replace('–','')
                }
                data.compareName = replaceName
                tmpAddr[0] === '세종특별자치시' || tmpAddr[0] === '세종특별시' ?
                data.sigungu = typeof tmpAddr[0]  === 'object' ? '' : tmpAddr[0] : data.sigungu = typeof tmpAddr[1]  === 'object' ? '' : tmpAddr[1]
                data.phone = typeof res[i].phone === 'object' ? '' : res[i].phone.replace(/\s/gi, "");
                let geoData = await getNaverGeo(res[i].addr)
                if (!geoData) {
                    geoData = await getKakaoGeo(res[i].addr)
                }
                //data.addr = desCharger[i].addr
                Object.assign(data, geoData)
                params.push(data)
                compareParams.push(res[i].name)
                //compareParams.push(replaceName)
            }
            //console.log(params)
            //console.log(compareParams)
            await models.evChargeStation.destroy({
                where: {
                    evType: type,
                    statNm: {[Op.notIn]: compareParams}
                }
            })
            models.evChargeStation.bulkCreate(params, bulkOptions)
        })
    } catch (error) {
        console.error(error)
    }
}
