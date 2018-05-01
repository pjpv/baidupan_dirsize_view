// ==UserScript==
// @name         百度网盘获取文件详情
// @namespace    https://github.com/pjpv/baidupan_dirsize_view
// @version      0.1
// @description  在百度网盘管理显示文件夹的详细信息（占用空间、子目录数量，文件数量），并文件夹和文件在当前目录所占空间的百分比。
// @author       pjpv
// @match        https://pan.baidu.com/disk/home
// @grant        none
// ==/UserScript==


(function() {



    function conver(limit){
        var size = "";
        if( limit < 0.1 * 1024 ){ //如果小于0.1KB转化成B
            size = limit.toFixed(2) + "B";
        }else if(limit < 0.1 * 1024 * 1024 ){//如果小于0.1MB转化成KB
            size = (limit / 1024).toFixed(2) + "KB";
        }else if(limit < 0.1 * 1024 * 1024 * 1024){ //如果小于0.1GB转化成MB
            size = (limit / (1024 * 1024)).toFixed(2) + "MB";
        }else{ //其他转化成GB
            size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB";
        }

        var sizestr = size + "";
        var len = sizestr.indexOf("\.");
        var dec = sizestr.substr(len + 1, 2);
        if(dec == "00"){//当小数点后为00时 去掉小数部分
            return sizestr.substring(0,len) + sizestr.substr(len + 3,2);
        }
        return sizestr;
    }

    function conver_size_str2int(sizestr){
        var size = 0;
        if(sizestr.substring(sizestr.length-2) === 'KB'){
            size = parseInt(sizestr.substring(0,sizestr.length-2)) * 1024;
        } else if(sizestr.substring(sizestr.length-1) === 'M'){
            size = parseInt(sizestr.substring(0,sizestr.length-1)) * 1024 * 1024;
        } else if(sizestr.substring(sizestr.length-1) === 'G'){
            size = parseInt(sizestr.substring(0,sizestr.length-1)) * 1024 * 1024 * 1024;
        } else if(sizestr.substring(sizestr.length-1) === 'T'){
            size = parseInt(sizestr.substring(0,sizestr.length-1)) * 1024 * 1024 * 1024 * 1024;
        } else{

        }
        return size;
    }

    /**
    * 设置文件所占空间显示
    */
    function setFileSize(total){
        // 当前用户已使用容量  yunData.QUOTAINFOS.used

        var $items = $('.zJMtAEb .NHcGw .vdAfKMb dd:not(:has(div[class*="dir-"])) div.sgefbv1R:not(.converted)'); // 获取存放文件大小信息的元素

        for(var i=0; i<$items.length; i++)
        {
            var size_str = $items[i].textContent;
            var size = conver_size_str2int(size_str); // 转换文件大小
            var percentage = parseInt (size / total * 100); // 百分比取整
            percentage = percentage<1 ? 1 : percentage;// 不小于1
            //var html = '大小:' + size + '； 目录数:' + res.list[i].dirnum  + '； 文件数:' + res.list[i].filenum;
            var html = '<span class="progress-bar" style="width:'+ percentage + '%;">'+
                //'%;height:30%;float:left;display:flex;text-shadow: 0 -1px 0 rgba(0,0,0,0.25);background-color:#0e90d2;background-image:linear-g radient(to bottom,#149bdf,#0480be);background-repeat:repeat-x;box-shadow:inset 0 -1px 0 rgba(0,0,0,0.15);box-sizing:border-box;transition:width 0.6s ease;border-radius:inherit;"></span><span style="float:left;position:absolute;display:block;text-shadow:0-1px0rgba(0,0,0,0.25);text-shadow: 0 1px 0 rgba(0, 0, 0, 1);line-height: 100%;font-size: 12px;left: 0;color: #f3f3f3;font-weight: 900;">' +
                //</span><span class="file-info" style="float:left;position:absolute;display:block;text-shadow:0-1px0rgba(0,0,0,0.25);">' +
                percentage + '%' +
                '</span><span class="file-info" style="">' +
                size_str +
                '</span>';

            $($items[i]).html(html)
                .css({
                "width": "16%",
                "overflow": "hidden",
                "box-shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                //                "border-radius": "4px",
                //                "margin-right": "12px"
            }) // 添加css
                .addClass('converted'); //标记已处理 //标记已处理
        }
    }



    function getDirPath(){
        // .JDeHdxb 文件列表顶顶部
        // .JDeHdxb .FuIxtL  面包屑
        // .JDeHdxb .FuIxtL li[node-type="tbAudfb"]  路径
        // .JDeHdxb .FuIxtL li[node-type="tbAudfb"] :last  追后一个为当前的完整路径
        // 注：首页没有路径
        var current_path = '';
        var $path = $('.JDeHdxb .FuIxtL li[node-type="tbAudfb"] :last');
        if ($path.length > 0 && !$path.is(':hidden')){
            current_path = $path.attr('title').replace('全部文件','');
        }

        // .zJMtAEb 文件详情列表视图
        // .dir-apps-small 我的应用程序图标
        // dd.anW01r 选中的行
        // 所有文件夹
        // $('.zJMtAEb .NHcGw .vdAfKMb dd .uesW9O7+.file-name .text a');
        // var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd:not(:has(.gxvMIQ)) .uesW9O7+.file-name .text a');// 获取全部文件夹信息 - 没有区分文件和文件夹
        // var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd.anW01r:not(:has(.gxvMIQ)) .uesW9O7+.file-name:not(.converted) .text a');// 获取选中的文件夹信息
        //var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd.anW01r:not(:has(.gxvMIQ)) div[class*="dir-"]+.file-name:not(.converted) .text a');// 获取选中的文件夹信息

        var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd:not(:has(.gxvMIQ,.dir-apps-small)) div[class*="dir-"]+.file-name:not(.converted) .text a');// 获取选中的文件夹信息

        var paths = [{obj:null,path:current_path}];
        for(var i=0;i<dirs.length;i++){

            var dir = dirs[i].text;
            var s_path = current_path + '/' + dir;

            paths.push({
                obj:dirs[i],
                path:s_path
            });

        }
        return paths;
    }

    function getSize(paths,callback){
        $.ajax({
            url: "/api/dirsize",
            method: "POST",
            data: {
                list: JSON.stringify(paths)
            }
        }).done(function(e) {
            var i = function() {
                $.ajax({
                    url: "/api/taskquery",
                    method: "GET",
                    data: {
                        taskid: e.taskid
                    }
                }).done(function(res) {
                    if ("running" === res.status || "pending" === res.status){
                        setTimeout(function() {
                            console.log('等待');
                            i();
                        }, 1e3);
                    }
                    else {
                        callback(res);

                    }
                });
            };
            i();


        });
    }


    function getDirSize(e){
        var $btn = $(e.currentTarget);
        var $text = $btn.find('.text');
        //var $icon = $btn.find('em');  //e.childNodes[0].childNodes[0].childNodes[0])
        // 设置按钮状态

        $btn.addClass('g-disabled');
        $text.text('正在获取...');
        //$icon.removeClass("icon-history").addClass('icon-circle');



        // 获取当前路径下的文件夹
        var paths = getDirPath();

        // 是否在首页
        var is_home = (paths[0].path === '' || paths[0].path === '/');

        if (paths.length > 0){
            // 获取到了文件夹
            var postData = [];
            for(var i=is_home?1:0; i<paths.length; i++){
                postData.push({path: paths[i].path});
            }

            // 获取文件大小
            getSize(postData,function(res){
                // 获取完成回调
                if (res && res.errno === 0 && res.status === 'success'){
                    var total = parseInt( is_home? yunData.QUOTAINFOS.used : res.list[0].size); // 当前目录总文件大小 ，在首页直接取当前使用已使用容量

                    for(var i=0; i<res.list.length; i++){
                        var item =res.list[i];

                        //var percentage = parseInt (item.size / total *100); // 百分比取整
                        var percentage = (item.size / total *100).toFixed(2); // 保留两位小数
                        var size = conver(item.size);
                        percentage = percentage<1 ? 1 : percentage;// 不小于1
                        var html = '<span class="progress-bar" style="width:'+
                            percentage + '%;">'+
                            //'%;height:30%;float:left;display:flex;text-shadow: 0 -1px 0 rgba(0,0,0,0.25);background-color:#0e90d2;background-image:linear-g radient(to bottom,#149bdf,#0480be);background-repeat:repeat-x;box-shadow:inset 0 -1px 0 rgba(0,0,0,0.15);box-sizing:border-box;transition:width 0.6s ease;border-radius:inherit;text-shadow: 0 1px 0 rgba(0, 0, 0, 1);line-height: 100%;font-size: 12px;left: 0;color: #f3f3f3;font-weight: 900;">' +
                            percentage + '%' +
                            //</span><span class="file-info" style="float:left;position:absolute;display:block;text-shadow:0-1px0rgba(0,0,0,0.25);">' +
                            '</span><span class="file-info" style="">' +
                            '大小：' + size + ' | 目录数：' + item.dirnum  + ' | 文件数：' + item.filenum +
                            '</span>';

                        $(paths[ is_home ? i+1 : i].obj).parent().parent().next().html(
                            html
                        ).css({
                            "width": "16%",
                            "overflow": "hidden",
                            "box-shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                            //                                "border-radius": "4px",
                            //                                "margin-right": "12px"
                        }); // 添加css

                        $(paths[ is_home ? i+1 : i].obj).parent().parent().addClass('converted'); //在文件路径，标记已处理
                    }
                    // 设置文件大小视图
                    setFileSize(total);
                }
                // 还原按钮状态
                $text.text('获取文件夹信息');
                $btn.removeClass('g-disabled');
                //  $icon.removeClass('icon-circle').addClass("icon-history");

            });

            // 处理文件

        }else{
            if (is_home){
                // 在首页的话，设置文件大小视图
                setFileSize(yunData.QUOTAINFOS.used);
            }

            // 还原按钮状态
            $text.text('获取文件详情');
            $btn.removeClass('g-disabled');
            //  $icon.removeClass('icon-circle').addClass("icon-history");}
        }
    }
    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css.replace(/;/g, ' !important;');
        head.appendChild(style);
    }
    addGlobalStyle('.progress-bar{height: 40%;float: left;display: flex;text-shadow: 0 -1px 0 rgba(0,0,0,0.25);background-color: #3b8cff;background-image: linear-gradient(to bottom,#149bdf,#0480be);background-repeat: repeat-x;box-shadow: inset 0 -1px 0 rgba(0,0,0,0.15);box-sizing: border-box;transition: width 0.6s ease;border-radius: inherit;text-shadow: 0 1px 0 rgba(0, 0, 0, 1);line-height: 170%;font-size: 12px;left: 0;color: #f3f3f3;font-weight: 900;}'+
                   '.file-info{float:left;position:inherit;display:block;text-shadow:0-1px0rgba(0,0,0,0.25);width: 100%; line-height: 170%;}');


    function addButton(){
        var $get_dir_size_button = $('<a class="g-button"href="javascript:;" title="获取文件详情" style="display: inline-block;"><span class="g-button-right"><em class="icon icon-disk" title="获取文件详情"></em><span class="text" style="width: auto;">获取文件详情</span></span></a>');
        $get_dir_size_button.click (getDirSize);
        // 按钮放在在新建文件夹后面
        $('.tcuLAu a[title="新建文件夹"]').after($get_dir_size_button);
    }

    // 添加按钮
    addButton();




})();
