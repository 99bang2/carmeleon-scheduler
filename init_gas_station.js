const scheduleJob = require('./libs/scheduleJob')
let areaCode = ['01','02','03','04','05','06','07','08','09','10','11','14','15','16','17','18','19']
for(let i=0; i<areaCode.length; i++){
    (function (x) {
        setTimeout(function () {
            scheduleJob.insertGasStation(areaCode[i])
            console.log(areaCode[i])
        }, 3000 * x);
    })(i)
}

