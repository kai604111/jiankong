﻿/**
 * mail监控服务
 * 1. 对生成的服务器状态文件进行分析判断发出警告邮件
 * 2. 对web项目的静态资源进行访问，判断服务状态发出警告邮件
 * ps：
 *     对web项目不要请求图片、css。如果被nginx代理会导致判断不准确
 *     修复bug： 邮件不要频繁发送，易被邮件服务器拉黑导致功能失效
 */
var http = require('http');
var nodemailer = require('nodemailer'); //nodemailer模块，用于发送邮件
var conf = require('../conf/mail_conf').config;
var mailConf = require('../conf/send_conf').config;
var checkServerJSONfile = "http://116.210.254.248/moniter.json"; //请求服务器状态文件，用于服务器是否挂掉

// 邮件发送配置
var mails = mailConf["mails"];
//邮件配置：from发送方，to接收方，cc配置邮件抄送对象。subject邮件主题，text邮件的内容。
var erroroption = mailConf["erroroption"];
var restartoption = mailConf["restartoption"];
//配置邮件的服务商与协议
var mail = nodemailer.createTransport(mailConf["createMailerConf"]);

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
                    if (!conf["serverErrorFlag"][ipDesc][type]) {
                        restartoption.text = ipDesc + '->' + type + ":状态已恢复";
                        mail.sendMail(restartoption, function (error, info) {
                            console.log('mail_error: ' + error);
                            var date = new Date();
                            console.log(date + ipDesc + '状态已恢复 ');
                            conf["serverErrorFlag"][ipDesc][type] = true;
                            oneHour = true;
                        });
                        conf["serverErrorFlag"][ipDesc][type] = true;
                    }
                    restartoption.text = _text;
                };
                var sendStr = "";
                var judeJSON = function (ip, json, erroroption) {
                    var str = {};
                    str['ip'] = ip;
                    if (json['disk'] > conf['warnFlag']['disk']) {
                        str['disk'] = "服务器硬盘报警！当前硬盘占用率：" + json['disk'];
                        conf["serverErrorFlag"][ip]['disk'] = false;
                        mailErrorFlag = true;
                    } else {
                        revover(ip, 'disk');
                    }
                    if (json['nginx'] != conf['warnFlag']['nginx']) {
                        str['nginx'] = "nginx报警！当前nginx状态：" + json['nginx'];
                        conf["serverErrorFlag"][ip]['nginx'] = false;
                        mailErrorFlag = true;
                    } else {
                        revover(ip, 'nginx');
                    }
                    if (json['mysql_status'] != conf['warnFlag']['mysql_status']) {
                        str['mysql_status'] = "数据库报警！当前数据库状态：" + json['mysql_status'];
                        conf["serverErrorFlag"][ip]['mysql_status'] = false;
                        mailErrorFlag = true;
                    } else {
                        revover(ip, 'mysql_status');
                    }
                    if (json['mysql_slave'] != conf['warnFlag']['mysql_slave']) {
                        str['mysql_slave'] = "数据库同步报警！当前数据库同步状态：" + json['mysql_slave'];
                        conf["serverErrorFlag"][ip]['mysql_slave'] = false;
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

var isErrorMailSended = false; //isRecoverSend 判断是否发送过恢复邮件 避免重复发送
var heartErrorCount = 0;
//心跳监测 5分钟内没有发出请求就监督者就认为监控服务挂了
function heartbeat() {
    this.accessUrl = "http://115.231.111.183/hubei_jiankong_heartbeat";
    http.get(this.accessUrl, function (res) {
        console.log('监控心跳 get response Code :' + res.statusCode);
        heartErrorCount = 0 ;
        if(isErrorMailSended) {
            var erroroption_text = erroroption.text;
            var erroroption_sub = erroroption.subject;
            erroroption.text = "监控服务的监督者已修复，服务正常！";
            erroroption.subject = "湖北监控";
            mail.sendMail(erroroption, function (error, info) {
                console.log('mail_error: ' + error);
                var date = new Date();
                console.log(date + '->'+ '监控服务的监督者挂了');
                isErrorMailSended = false;
            });
            erroroption.text = erroroption_text;
            erroroption.subject = erroroption_sub;
        }
    }).on('error', function (e) {
        heartErrorCount++;
        console.log("accessUrl : " + this.accessUrl);
        console.log("error :" + e.message);
        if ( !isErrorMailSended && heartErrorCount>3) {
            var erroroption_text = erroroption.text;
            var erroroption_sub = erroroption.subject;
            erroroption.text = "监控服务的监督者挂了，请及时修复监督服务！";
            erroroption.subject = "湖北监控";
            mail.sendMail(erroroption, function (error, info) {
                console.log('mail_error: ' + error);
                var date = new Date();
                console.log(date + '->'+ '监控服务的监督者挂了');
                isErrorMailSended = true;
            });
            erroroption.text = erroroption_text;
            erroroption.subject = erroroption_sub;
            heartErrorCount = 0;
        }
    });
}

setInterval(function () {
    var date = new Date();
    console.log('----------------------------------------------------------------------');
    console.log(date + "");
    console.log("start heartbeat");
    checkWeb(conf["webServer"], "sport");
    checkWeb(conf["webServer"], "labei");
    checkServer();
    heartbeat();
}, 60 * 1000);//检测频率 60S一次
