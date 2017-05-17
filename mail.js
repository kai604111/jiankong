var http = require('http');
var nodemailer = require('nodemailer'); //nodemailer模块，用于发送邮件
var checkServerJSONfile = "http://116.210.254.248/moniter.json"; //请求服务器状态文件，用于服务器是否挂掉
//请求工程的静态文件，用于判断工程是否挂掉
//isVPN由于VPN连接可能会出现断了重连现象，导致误发邮件。所以请求5次都请求不到的话，才判断为工程出错或者VPN断了不连了。
//restart 判断程序是否已启动
var webServer = {
    "sport": {
        "static_url": "http://116.210.254.227/app/static/js/keyCode.js",
        "isVPN": 0,
        "restart": true
    },
    "labei": {
        "static_url": "http://116.210.254.227/app/static/js/keyCode.js",
        "isVPN": 0,
        "restart": true
    }
};
//服务器状态阈值
var warnFlag = {
    "disk": 80,
    "nginx": 0,
    "mysql_status": 0,
    "mysql_slave": 2
};
// 记录服务器状态参数发生的错误
var serverErrorFlag = {
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
// 邮件发送配置
var mails = {
    form: 'liwenyang@joyutech.com',
    to: 'liwenyang@joyutech.com',
    cc: 'yuanfanglin@joyutech.com,yangzheng@joyutech.com,chenhongyu@joyutech.com,lengweiping@joyutech.com,guoziao@joyutech.com,wangzhenkai@joyutech.com'
};
//邮件配置：from发送方，to接收方，cc配置邮件抄送对象。subject邮件主题，text邮件的内容。
var erroroption = {
    from: mails.form,
    to: mails.to,
    cc: mails.cc,
    subject: "工程出错",
    text: "服务器挂掉了，请尽快处理。"
};
var restartoption = {
    from: mails.form,
    to: mails.to,
    cc: mails.cc,
    subject: "工程恢复",
    text: "服务器已恢复。"
};
//配置邮件的服务商与协议
var mail = nodemailer.createTransport({
    host: "smtp.exmail.qq.com",
    server: 'qq',
    port: 465,//配置SMTP端口
    secureConnection: true, //SSL加密通道，防止邮件被截获
    //auth设置使用SMTP协议的邮箱以及授权码
    auth: {
        user: 'liwenyang@joyutech.com',
        pass: 'Joyu1201'
    }
});

var mailErrorFlag = false; // 只有服务器参数超出范围时才需要发送邮件；
var monitJSONFlag = true; // 服务器状态文件访问失败时发送邮件
var oneHour = true; // 发生错误时，一小时发送一次邮件
// 根据请求文件内容判断是否发送邮件
function checkServer() {
    http.get(checkServerJSONfile, function (res) {
        console.log('server file get response Code :' + res.statusCode);
        if (res.statusCode == 200) {
            var json = '';
            res.on('data', function (d) {
                json += d;
            });
            res.on('end', function () {
                //获取到的数据
                monitJSONFlag = true;
                json = JSON.parse(json);
                console.log(json);
                var revover = function (ipDesc, type) {
                    var _text = restartoption.text;
                    if (!serverErrorFlag[ipDesc][type]) {
                        restartoption.text = ipDesc + '->' + type + ":状态已恢复";
                        mail.sendMail(restartoption, function (error, info) {
                            console.log('mail_error: ' + error);
                            var date = new Date();
                            console.log(date + ipDesc + '状态已恢复 ');
                            serverErrorFlag[ipDesc][type] = true;
                            oneHour = true;
                        });
                        serverErrorFlag[ipDesc][type] = true;
                    }
                    restartoption.text = _text;
                };
                var sendStr = "";
                var judeJSON = function (ip, json, erroroption) {
                    var str = {};
                    str['ip'] = ip;
                    if (json['disk'] > warnFlag['disk']) {
                        str['disk'] = "服务器硬盘报警！当前硬盘占用率：" + json['disk'];
                        serverErrorFlag[ip]['disk'] = false;
                        mailErrorFlag = true;
                    } else {
                        revover(ip, 'disk');
                    }
                    if (json['nginx'] != warnFlag['nginx']) {
                        str['nginx'] = "nginx报警！当前nginx状态：" + json['nginx'];
                        serverErrorFlag[ip]['nginx'] = false;
                        mailErrorFlag = true;
                    } else {
                        revover(ip, 'nginx');
                    }
                    if (json['mysql_status'] != warnFlag['mysql_status']) {
                        str['mysql_status'] = "数据库报警！当前数据库状态：" + json['mysql_status'];
                        serverErrorFlag[ip]['mysql_status'] = false;
                        mailErrorFlag = true;
                    } else {
                        revover(ip, 'mysql_status');
                    }
                    if (json['mysql_slave'] != warnFlag['mysql_slave']) {
                        str['mysql_slave'] = "数据库同步报警！当前数据库同步状态：" + json['mysql_slave'];
                        serverErrorFlag[ip]['mysql_slave'] = false;
                        mailErrorFlag = true;
                    } else {
                        revover(ip, 'mysql_slave');
                    }
                    sendStr += JSON.stringify(str);
                };
                judeJSON("hubei_172", json["hubei_172"], erroroption);
                judeJSON("hubei_173", json["hubei_173"], erroroption);

                var erroroption_text = erroroption.text;
                if (sendStr != "" && sendStr.length > 36 && mailErrorFlag && oneHour) {
                    console.log(sendStr);
                    erroroption.text = sendStr;
                    mail.sendMail(erroroption, function (error, info) {
                        console.log('mail_error: ' + error);
                        var date = new Date();
                        console.log(date + '服务器状态出现问题');
                        oneHour = false;
                    });
                    erroroption.text = erroroption_text;
                }
            });
        }
        if (res.statusCode == 404) {
            var erroroption_text = erroroption.text;
            erroroption.text = "服务器状态文件访问失败，请检查文件。";
            if (monitJSONFlag) {
                mail.sendMail(erroroption, function (error, info) {
                    console.log('mail_error: ' + error);
                    var date = new Date();
                    console.log(date + '服务器状态文件访问失败，请检查文件。');
                    monitJSONFlag = false;
                });
            }
            erroroption.text = erroroption_text;
        }
    }).on('error', function (e) {
        console.log("server error :" + e.message);
        var erroroption_text = erroroption.text;
        erroroption.text = "服务器状态文件访问失败，请检查文件。";
        if (monitJSONFlag) {
            mail.sendMail(erroroption, function (error, info) {
                console.log('mail_error: ' + error);
                var date = new Date();
                console.log(date + '服务器状态文件访问失败，请检查文件。');
                monitJSONFlag = false;
            });
        }
        erroroption.text = erroroption_text;
    });
}
// 请求web项目中的静态文件判断项目是不是在服务
function checkWeb(opt, ser) {
    this.accessUrl = (opt[ser]['static_url']);
    http.get(this.accessUrl, function (res) {
        console.log('web file get response Code :' + res.statusCode);
        opt[ser]["isVPN"] = 0;
        if (!opt[ser]["restart"]) {
            var erroroption_text = erroroption.text;
            erroroption.text = ser +  '->' + "web项目已恢复。";
            mail.sendMail(restartoption, function (error, info) {
                console.log('mail_error: ' + error);
                var date = new Date();
                console.log(date + ser  + '->'+ '工程已恢复');
                opt[ser]["restart"] = true;
            });
            erroroption.text = erroroption_text;
        }
    }).on('error', function (e) {
        console.log("web error :" + e.message);
        if (e.message != 'read ECONNRESET') {
            opt[ser]["isVPN"]+=1;
        }
        if (opt[ser]["restart"] && e.message != 'read ECONNRESET' && opt[ser]["isVPN"] == 5) {
            var erroroption_text = erroroption.text;
            erroroption.text = ser +  '->' + "web项目挂掉了，请检查项目！";
            mail.sendMail(erroroption, function (error, info) {
                console.log('mail_error: ' + error);
                var date = new Date();
                console.log(date + ser  + '->'+ '工程挂掉了');
                opt[ser]["restart"] = false;
            });
            erroroption.text = erroroption_text;
        }
    });
}

setInterval(function () {
    var date = new Date();
    console.log('----------------------------------------------------------------------');
    console.log(date + "");
    console.log("start heartbeat");
    checkWeb(webServer, "sport");
    checkWeb(webServer, "labei");
    checkServer();
}, 60 * 1000);//检测频率 60S一次
