
var http = require('http');
var mail = require('../lib/mailHelper').helper;
var log = require('../lib/logHelper').helper;
var conf = require('../conf/monitor_conf').config;
var heartbeat = require('../lib/heartBeat').heartbeat;
heartbeat.run(); // 运行心跳

var monitor = {};
monitor.serverErrorFlag = {
    "hubei_172": {
        "disk": true,
        "nginx": true,
        "mysql_status": true,
        "mysql_slave": true
    },
    "hubei_173": {
        "disk": true,
        "nginx": true,
        "mysql_status": true,
        "mysql_slave": true
    }
};

var judeJSON = function (ip, json) {
    var sendStr = '';
    var str = {};
    str['ip'] = ip;
    if (json['disk'] > conf['warnFlag']['disk']) {
        str['disk'] = "服务器硬盘报警！当前硬盘占用率：" + json['disk'];
        monitor["serverErrorFlag"][ip]['disk'] = false;
        monitor.mailErrorFlag = true;
    } else {
        revover(ip, 'disk');
    }
    if (json['nginx'] != conf['warnFlag']['nginx']) {
        str['nginx'] = "nginx报警！当前nginx状态：" + json['nginx'];
        monitor["serverErrorFlag"][ip]['nginx'] = false;
        monitor.mailErrorFlag = true;
    } else {
        revover(ip, 'nginx');
    }
    if (json['mysql_status'] != conf['warnFlag']['mysql_status']) {
        str['mysql_status'] = "数据库报警！当前数据库状态：" + json['mysql_status'];
        monitor["serverErrorFlag"][ip]['mysql_status'] = false;
        monitor.mailErrorFlag = true;
    } else {
        revover(ip, 'mysql_status');
    }
    if (json['mysql_slave'] != conf['warnFlag']['mysql_slave']) {
        str['mysql_slave'] = "数据库同步报警！当前数据库同步状态：" + json['mysql_slave'];
        monitor["serverErrorFlag"][ip]['mysql_slave'] = false;
        monitor.mailErrorFlag = true;
    } else {
        revover(ip, 'mysql_slave');
    }
    sendStr += JSON.stringify(str);
    return sendStr;
};
var revover = function (ipDesc, type) {
    mail.send('监控服务', ipDesc + '->' + type + ':状态已恢复', 'monitor');
    if (!monitor["serverErrorFlag"][ipDesc][type]) {
        mail.send('监控服务', ipDesc + '->' + type + ":状态已恢复", 'monitor');
        monitor["serverErrorFlag"][ipDesc][type] = true;
        monitor.oneHour = true;
    }
    monitor["serverErrorFlag"][ipDesc][type] = true;
};

monitor.mailErrorFlag = false; // 只有服务器参数超出范围时才需要发送邮件；
monitor.monitJSONFlag = true; // 服务器状态文件访问失败时发送邮件
monitor.oneHour = true; // 发生错误时，一小时发送一次邮件
// 根据请求文件内容判断是否发送邮件
monitor.checkServer = function () {
    if (conf.statusFile.length == 0) {
        throw new Error("服务器状态文件路径为空");
        return;
    }
    http.get(conf.statusFile, function (res) {
        log.writeInfo('server file get response Code :' + res.statusCode);
        if (res.statusCode == 200) {
            var json = '';
            res.on('data', function (d) {
                json += d;
            });
            res.on('end', function () {
                //获取到的数据
                monitor.monitJSONFlag = true;
                json = JSON.parse(json);
                var str_172 = judeJSON("hubei_172", json["hubei_172"]);
                var str_173 = judeJSON("hubei_173", json["hubei_173"]);
                var sendStr = str_172 + str_173;
                if (sendStr != "" && sendStr.length > 36 && mailErrorFlag && oneHour) {
                    mail.send('监控服务', '服务器状态出现问题', 'monitor');
                    monitor.oneHour = false;
                }
            });
        } else if (res.statusCode == 404) {
            if (monitor.monitJSONFlag) {
                mail.send('监控服务', '服务器状态文件访问失败，请检查文件。', 'monitor');
                monitor.monitJSONFlag = false;
            }
        }
    }).on('error', function (e) {
        log.writeErr("请求文件失败", e);
        if (monitor.monitJSONFlag) {
            mail.send('监控服务', '服务器状态文件访问失败，请检查文件。', 'monitor');
            monitor.monitJSONFlag = false;
        }
    });
};

// 请求web项目中的静态文件判断项目是不是在服务
monitor.checkWeb = function(opt, ser) {
    this.accessUrl = (opt[ser]['static_url']);
    http.get(this.accessUrl, function (res) {
        log.writeInfo('web file get response Code :' + res.statusCode);
        opt[ser]["isVPN"] = 0;
        if (!opt[ser]["restart"]) {
            mail.send('监控服务', ser +  '->' + 'web项目已恢复。', 'monitor');
            opt[ser]["restart"] = true;
        }
    }).on('error', function (e) {
        console.log();
        log.writeErr("web error",e);
        if (e.message != 'read ECONNRESET') {
            opt[ser]["isVPN"] += 1;
        }
        if (opt[ser]["restart"] && e.message != 'read ECONNRESET' && opt[ser]["isVPN"] == 5) {
            mail.send('监控服务', ser + '->' + "web项目挂掉了，请检查项目！", 'monitor');
                opt[ser]["restart"] = false;
        }
    });
};

monitor.check = function () {
    monitor.checkWeb(conf["webServer"], "sport");
    monitor.checkWeb(conf["webServer"], "labei");
    monitor.checkServer();
};

monitor.run = function () {
    if (conf.isStop != true)
        monitor.interval = setInterval(monitor.check, parseInt(conf.check_time) * 1000)
};
monitor.stop = function () {
    if (monitor.interval)
        clearInterval(monitor.interval);
};
exports.monitor = monitor;