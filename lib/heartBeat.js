var http = require("http");
var log = require('./logHelper').helper;
var mail = require('./mailHelper').helper;
var conf = require('../conf/heartBeat_conf').config;

var heartbeat = {};
heartbeat.isErrorMailSended = false; //isRecoverSend 判断是否发送过恢复邮件 避免重复发送
heartbeat.heartErrorCount = 0;
//心跳监测 5分钟内没有发出请求就监督者就认为监控服务挂了
heartbeat.check = function () {
    var url = conf.url;
    if (url === undefined || url === null || url === '') {
        throw new Error('url is not undefined   ' + url);
        return;
    }
    http.get(url, function (res) {
        log.writeInfo(' get response Code : ' + res.statusCode);
        heartbeat.heartErrorCount = 0;
        if (heartbeat.isErrorMailSended) {
            mail.send('湖北监控', '监控服务的监督者已修复，服务正常！', 'supervisor');
            heartbeat.isErrorMailSended = false;
        }
    }).on('error', function (e) {
        heartbeat.heartErrorCount++;
        log.writeErr('心跳请求失败！ ', e);
        if (!heartbeat.isErrorMailSended && heartbeat.heartErrorCount > 3) {
            mail.send('湖北监控', '监控服务的监督者挂了，请及时修复监督服务！', 'supervisor');
            heartbeat.isErrorMailSended = true;
            heartbeat.heartErrorCount = 0;
        }
    });
};

heartbeat.run = function () {
    if (conf.isStop != true)
        heartbeat.interval = setInterval(heartbeat.check, parseInt(conf.check_time) * 1000)
};
heartbeat.stop = function () {
    if (heartbeat.interval)
        clearInterval(heartbeat.interval);
};
exports.heartbeat = heartbeat;