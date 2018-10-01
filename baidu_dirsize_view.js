// ==UserScript==
// @name         百度网盘获取文件夹信息
// @namespace    https://github.com/pjpv/baidupan_dirsize_view
// @version      0.2
// @description  在百度网盘管理显示文件夹的详细信息（占用空间、子目录数量，文件数量），并文件夹和文件在当前目录所占空间的百分比。
// @author       pjpv
// @match        https://pan.baidu.com/disk/home
// @grant        none
// ==/UserScript==


(function() {


    // 缓存前缀
    var key_prefix = 'bdsize_';

    /**
    * 中文转Base64
    */
    function utf8_to_b64( str ) {
        return window.btoa(unescape(encodeURIComponent( str )));
    }

    /**
    * Base64 转中文
    */
    function b64_to_utf8( str ) {
        return decodeURIComponent(escape(window.atob( str )));
    }


    /**
    * 数字 转 文件大小文本
    */
    function conver(limit){
        var size = "";
        if( limit < 0.1 * 1024 ){ //如果小于0.1KB转化成B
            size = limit.toFixed(2) + "B";
        }else if(limit < 0.1 * 1024 * 1024 ){//如果小于0.1MB转化成KB
            size = (limit / 1024).toFixed(2) + "K";
        }else if(limit < 0.1 * 1024 * 1024 * 1024){ //如果小于0.1GB转化成MB
            size = (limit / (1024 * 1024)).toFixed(2) + "M";
        }else{ //其他转化成GB
            size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "G";
        }

        var sizestr = size + "";
        var len = sizestr.indexOf("\.");
        var dec = sizestr.substr(len + 1, 2);
        if(dec == "00"){//当小数点后为00时 去掉小数部分
            return sizestr.substring(0,len) + sizestr.substr(len + 3,2);
        }
        return sizestr;
    }

    /**
    * 文件大小文本 转 数字
    */

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
    * 清空缓存
    */
    function clear_cache(){

        for(var key in localStorage)
        {
            if(key.substring(0,7)=='bdsize_')
                localStorage.removeItem(key);
        }
    }



    /**
    * 获取当前路径
    */
    function get_current_path(){
        var current_path = '';

        /*
        * 获取面包屑
        */
        function byBreadCrumbs(){
            // .JDeHdxb 文件列表顶顶部
            // .JDeHdxb .FuIxtL  面包屑
            // .JDeHdxb .FuIxtL li[node-type="tbAudfb"]  路径
            // .JDeHdxb .FuIxtL li[node-type="tbAudfb"] :last  追后一个为当前的完整路径
            // 注：首页没有路径
            var p = '';
            var $path = $('.JDeHdxb .FuIxtL li[node-type="tbAudfb"] :last');
            if ($path.length > 0 && !$path.is(':hidden')){
                current_path = $path.attr('title').replace('全部文件','');
            }
            return p;
        }

        /**
        * 获取 location hash
        */
        function byHash(){
            var reg_rewrite = new RegExp(".*(\\?|\\&)path=([^\&]*).*", "i");
            var q = window.location.hash.match(reg_rewrite);
            if(q != null){
                return decodeURIComponent(q[2]);
            }else{
                return '';
            }
        }
        current_path = byHash();

        return current_path;
    }

/**
* ——————————————————————————————————————————————————————————————————————————————————————————————————
*/


    /**
    * 添加css
    */
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


    // 监控路径变化
    var current_path = '';
    function init_current_path(){
        // 获取当前路径
        var tmp_path = get_current_path();
        current_path = tmp_path;
    }

    //监听触发操作
    function hashChangeFire(){
        init_current_path();
        if (current_path == null || current_path =='')
        {
            $('.g-button-file-detail').hide();
        }else{
            if (window.location.hash.substr(0,10) == '#/sharedir'){
                $('.g-button-file-detail').hide();
            }else{
                $('.g-button-file-detail').show();
            }


        }

    }
    window.onhashchange = hashChangeFire;

    /**
    * 当前路径变更
    * 无法监视回到首页的事件（所以好像没什么用）
    */
    //$('.JDeHdxb .FuIxtL').bind('DOMNodeInserted', function(e) {
    //    init_current_path();
    //});


    /**
    * 监控文件列表变化（插入）
    * 每一行都是独立事件
    */
    $('.zJMtAEb .NHcGw').bind('DOMNodeInserted', function(e) {
        if(e.target.nodeName==='DD'){
            init_current_path();
            var item_path = current_path + (current_path =='/'?'':'/') + e.target.childNodes[2].childNodes[0].childNodes[0].text;
            //console.log('DOMNodeInserted',item_path);


            var html = localStorage.getItem(key_prefix + utf8_to_b64(item_path));

            if(html){
                //$(e.target).find('.sgefbv1R').html(
                $(e.target).find('.file-name').next().html(
                    html
                ).css({
                    "width": "16%",
                    "overflow": "hidden",
                    "box-shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                    //                                "border-radius": "4px",
                    //                                "margin-right": "12px"
                }); // 添加css

            }

        }
    });
    /**
    * 文档就绪，好像不需要了
    */
    $(document).ready(function(e){
return;
        var $all_dd = $('.zJMtAEb .NHcGw .vdAfKMb dd');
        for(var i=0; i<$all_dd.length;i++){

            var item_path = current_path +  $all_dd[i].childNodes[2].childNodes[0].childNodes[0].text;
            var html = localStorage.getItem(key_prefix + utf8_to_b64(item_path));

            if(html){

                //$($all_dd[i].target).find('.sgefbv1R').html(
                $($all_dd[i].target).find('.file-name').next().html(
                    html
                ).css({
                    "width": "16%",
                    "overflow": "hidden",
                    "box-shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                    //                                "border-radius": "4px",
                    //                                "margin-right": "12px"
                }); // 添加css

            }
        }


    });

/**
* ——————————————————————————————————————————————————————————————————————————————————————————————————
*/




    /**
    * 设置文件所占空间显示
    */
    function setFileSize(total){
        // 当前用户已使用容量  yunData.QUOTAINFOS.used
        init_current_path();
        //var $items = $('.zJMtAEb .NHcGw .vdAfKMb dd:not(:has(div[class*="dir-"])) div.sgefbv1R:not(.converted)'); // 获取存放文件大小信息的元素
        var $items = $('.zJMtAEb .NHcGw .vdAfKMb dd:not(:has(div[class*="dir-"])) div.file-name + div:not(.converted)');

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


            var setFileSize = current_path + '/' +  $items[i].previousSibling.childNodes[0].childNodes[0].text;
            //console.log('getDirPath',setFileSize);
            localStorage.setItem(key_prefix + utf8_to_b64(setFileSize),html);
        }
    }


    function getDirPath(){
        // 获取当前路径
        var current_path = get_current_path();

        // .zJMtAEb 文件详情列表视图
        // .dir-apps-small 我的应用程序图标
        // dd.anW01r 选中的行
        // 所有文件夹
        // $('.zJMtAEb .NHcGw .vdAfKMb dd .uesW9O7+.file-name .text a');
        // var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd:not(:has(.gxvMIQ)) .uesW9O7+.file-name .text a');// 获取全部文件夹信息 - 没有区分文件和文件夹
        // var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd.anW01r:not(:has(.gxvMIQ)) .uesW9O7+.file-name:not(.converted) .text a');// 获取选中的文件夹信息
        //var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd.anW01r:not(:has(.gxvMIQ)) div[class*="dir-"]+.file-name:not(.converted) .text a');// 获取选中的文件夹信息

        var dirs = $('.zJMtAEb .NHcGw .vdAfKMb dd:not(:has(.gxvMIQ,.dir-apps-small)) div[class*="dir-"]+.file-name:not(.converted) .text a');// 获取文件夹

        var paths = [{obj:null,path:current_path}];
        for(var i=0;i<dirs.length;i++){

            var dir = dirs[i].text;
            var s_path = current_path +  (current_path =='/'?'':'/')  + dir;
            //console.log('getDirPath',s_path);

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
                        var item_result = res.list[i];
                        var item_obj = paths[ is_home ? i+1 : i];


                        var percentage = (item_result.size / total *100).toFixed(2); // 保留两位小数
                        var size = conver(item_result.size);
                        percentage = percentage<1 ? 1 : percentage;// 不小于1
                        var html = '<span class="progress-bar" style="width:'+
                            percentage + '%;">'+
                            //'%;height:30%;float:left;display:flex;text-shadow: 0 -1px 0 rgba(0,0,0,0.25);background-color:#0e90d2;background-image:linear-g radient(to bottom,#149bdf,#0480be);background-repeat:repeat-x;box-shadow:inset 0 -1px 0 rgba(0,0,0,0.15);box-sizing:border-box;transition:width 0.6s ease;border-radius:inherit;text-shadow: 0 1px 0 rgba(0, 0, 0, 1);line-height: 100%;font-size: 12px;left: 0;color: #f3f3f3;font-weight: 900;">' +
                            percentage + '%' +
                            //</span><span class="file-info" style="float:left;position:absolute;display:block;text-shadow:0-1px0rgba(0,0,0,0.25);">' +
                            '</span><span class="file-info" style="">' +
                            '大小：' + size + ' | 目录数：' + item_result.dirnum  + ' | 文件数：' + item_result.filenum +
                            '</span>';

                        $(item_obj.obj).parent().parent().next().html(
                            html
                        ).css({
                            "width": "16%",
                            "overflow": "hidden",
                            "box-shadow": "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
                            //                                "border-radius": "4px",
                            //                                "margin-right": "12px"
                        }); // 添加css

                        $(item_obj.obj).parent().parent().addClass('converted'); //在文件路径，标记已处理

                        if(i > 0 || is_home)
                            localStorage.setItem(key_prefix + utf8_to_b64(item_obj.path),html);
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

    /**
    * 获取文件详细信息按钮 - 添加
    */
    function addButton(){
        var $get_dir_size_button = $('<a class="g-button g-button-file-detail"href="javascript:;" title="获取文件详情" style="display: inline-block;"><span class="g-button-right"><em class="icon icon-disk" title="获取文件详情"></em><span class="text" style="width: auto;">获取文件详情</span></span></a>');
        $get_dir_size_button.click (getDirSize);
        // 按钮放在在新建文件夹后面
        $('.tcuLAu a[title="新建文件夹"]').after($get_dir_size_button);

        $('.OFaPaO').css({'z-index':'999'});// 别挡到搜索框了
    }


    /**
    * 搜索栏添加及时文件筛选功能
    */
    function filterFile(){
        // NEW selector
        jQuery.expr[':'].Contains = function(a, i, m){
            return jQuery(a).text().toUpperCase()
                .indexOf(m[3].toUpperCase()) >= 0;
            //return jQuery(a).textContent.toUpperCase()
            //    .indexOf(m[3].toUpperCase()) >= 0;
        };

        var select_dd = false;

        function filter(text){
            if(text.replace('/ /')===''){
                var all_ccount = $('.zJMtAEb .NHcGw .vdAfKMb dd').show().length;
                $('#layoutMain div.JDeHdxb > span.FcucHsb').text("已全部加载，共" + all_ccount + "个");
                select_dd = false;
            }else{
                $('.zJMtAEb .NHcGw .vdAfKMb dd').hide();
                //var $dd_checked= $('.zJMtAEb .NHcGw .vdAfKMb dd:Contains("'+text+'")').show();
                var filter_count = $('.zJMtAEb .NHcGw .vdAfKMb dd:has(.file-name > .text:Contains("'+text+'"))').show().length;
                $('#layoutMain div.JDeHdxb > span.FcucHsb').text("已筛选，共" + filter_count + "个");
                select_dd = true;
            }
        }

        var t = new Date();
        $('.DxdbeCb form[method="get"] input').bind('input propertychange blur', function(e) {
            var text = e.target.value;
            var tmp_t = new Date();
            t = tmp_t;
            setTimeout(function(){
                if(t == tmp_t){
                    console.log('搜索',text);
                    filter(text);
                }
            },500);

        }).bind('change', function(e) {
            /**
            * 确认输入值后（离开搜索框），判断是否选择行
            */
            var text = e.target.value;
            if(select_dd){
                // 选择 有bug
                $('.zJMtAEb .NHcGw .vdAfKMb dd:has(.file-name > .text:Contains("'+text+'"))').find('.EOGexf').click();

            }
        });

    }



/**
* ——————————————————————————————————————————————————————————————————————————————————————————————————
*/



    // 添加按钮
    addButton();

    // 添加筛选功能
    filterFile();




})();
