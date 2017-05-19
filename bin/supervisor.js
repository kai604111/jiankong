var http = require('http');
var mail = require('../lib/mailHelper').helper;
var log = require('../lib/logHelper').helper;
var conf = require('../conf/supervisor_conf').config;

var supervisor = {};
supervisor.lastNotifyTime = null; //最后请求时间
supervisor.restart = true; //restart 判断程序是否已启动
supervisor.isErrorSend = true; //isErrorSend 判断是否发送过故障邮件 避免重复发送
supervisor.isRecoverSend = true; //isRecoverSend 判断是否发送过恢复邮件 避免重复发送

var server = http.createServer(function (req, res) {
    log.writeInfo('URL:' + req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('我还活着\n');
    supervisor.lastNotifyTime = new Date().getTime();
    log.writeInfo("lastNotifyTime : " + new Date(supervisor.lastNotifyTime));
    if (!supervisor.restart && supervisor.isRecoverSend) {
        mail.send('监督服务', '湖北监控服务异常已恢复', 'supervisor');
        supervisor.restart = true;
        supervisor.isErrorSend = true;
        supervisor.isRecoverSend = true;
    }
});
server.listen(conf.port, function () {
    console.log('Server running at http://127.0.0.1:30000/');
});
supervisor.check = function () {
    var currentTime = new Date().getTime();
    if (currentTime - supervisor.lastNotifyTime > 5 * 60 * 1000) {
        //5分钟内，没收到消息，就认为监控工具死了，我要发邮件
        if (supervisor.restart && supervisor.isErrorSend) {
            mail.send('监督服务', '湖北监控服务异常，请及时修复！', 'supervisor');
                supervisor.restart = false;
                supervisor.isErrorSend = false;
        }
    }
};

supervisor.run = function () {
    if (conf.isStop != true)
        supervisor.interval = setInterval(supervisor.check, parseInt(conf.check_time) * 1000)
};
supervisor.stop = function () {
    if (supervisor.interval)
        clearInterval(supervisor.interval);
};
exports.supervisor = supervisor;