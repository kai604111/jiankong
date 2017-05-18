exports.config = {
    /*
     * 请求工程的静态文件，用于判断工程是否挂掉
     * isVPN由于VPN连接可能会出现断了重连现象，导致误发邮件。所以请求5次都请求不到的话，才判断为工程出错或者VPN断了不连了。
     * restart 判断程序是否已启动
     */
    webServer: {
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
    },
    //服务器状态阈值
    warnFlag: {
        "disk": 80,
        "nginx": 0,
        "mysql_status": 0,
        "mysql_slave": 2
    },
    // 记录服务器状态参数发生的错误
    serverErrorFlag: {
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
    }
}
;
