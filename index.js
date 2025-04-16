const consola = require('consola')
const schedule = require('node-schedule')
const scheduleJob = require('./libs/scheduleJobV2')

schedule.scheduleJob('15 4 * * *', async function () {
    await scheduleJob.updateGasStation()
})

// 가격 업데이트 매일 1,2,9,12,16,19시 30분 //
schedule.scheduleJob('30 1,2,9,12,16,19 * * * ', async function () {
    await scheduleJob.updateGasPrice()
})

// 좌표 업데이트 매일 24시 (좌표가 없는 주유소만) //
schedule.scheduleJob('10 2 * * * ', function () {
    consola.info('updateGasGeo start!')
    scheduleJob.updateGasGeo()
})

// 전기차 충전소 데이터
schedule.scheduleJob('33 3 * * * ', async function () {
    await scheduleJob.insertEvStation()
})
// 전기차 충전소 태그 업데이트
schedule.scheduleJob('53 3 * * * ', async function () {
   await scheduleJob.updateTagEv()
})
// 전기차 충전소 충전 상태 업데이트 매 1 > 10분 //22-09-29 mschoi
schedule.scheduleJob('*/10 * * * * ', async function () {
    await scheduleJob.updateEvStatus()
})

// 전기차 충전소 데이터(KEPCO) //21-04-08 JG
schedule.scheduleJob('43 3 * * * ', async function () {
    await scheduleJob.insertKepcoToEvCharge()
})
// 전기차 충전소 충전 상태 업데이트 매 1시간 //21-04-08 JG
schedule.scheduleJob('30 * * * * ', async function () {
    await scheduleJob.updateKepcoToEvCharge()
})

schedule.scheduleJob('33 4 * * *', async function() {
    await scheduleJob.insertParking()
})

schedule.scheduleJob('53 4 * * *', async function() {
    await scheduleJob.parkingToEv()
})

// 전기차 충전소 테슬라 갱신 //
// 리스트 : 매일 0시 한번씩//
// 리스트 정보 : 매일 0시 30분 한번씩//
schedule.scheduleJob('0 3 * * * ', function () {
    consola.info('teslaStationList start!')
    //테슬라 충전소 리스트 (크롤링)
    scheduleJob.teslaStationList()
})
schedule.scheduleJob('0 4 * * * ', function () {
    consola.info('teslaStationListInfo start!')
    //테슬라 충전소 리스트 정보(크롤링)
    scheduleJob.teslaStationListInfo()
})
