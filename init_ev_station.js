const scheduleJob = require('./libs/scheduleJob')
start()
async function start() {
    let flag = true
    let i = 1
    while(flag) {
        let data = await scheduleJob.insertEvStation(i)
        console.log('insertEvStation', i)
        if(parseInt(data) === 0){
           flag = false
            console.log('insertEvStation done', i)
        }
        i++
    }
    await scheduleJob.teslaStationList()
    console.log('teslaStationList')
    await scheduleJob.teslaStationListInfo()
    console.log('teslaStationListInfo')
    await scheduleJob.updateTagEv()
    console.log('updateTagEv')
}