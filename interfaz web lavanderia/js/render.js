/** 
 * render js version: logo!8.3 
 * */
var _dataMap = new Map();
var isFirstTimeInit = true;
var STOP_SLIDER_REFERSH_ID = undefined;
var CONNECTED_BM_LOST = false;
var WEEKDAY = new Array("Sun.", "Mon.", "Tues.", "Wed.", "Thur.", "Fri.", "Sat.");
var IS_CLOUD_MODE = false;

/** bm connection info: sie=[logo],idec=[pdt] */
var LOCAL_STORAGE_PREFIX = "logo";

/** init page after document tree loaded */
$(document).ready(function () {
    renderJs.resetDivImgFromAttr();
    renderJs.initNavivator();
    if (isFirstTimeInit) {
        renderJs.initVM();
        isFirstTimeInit = false;
    }
    renderJs.initUserInfo();
    renderJs.initCloudMode();

    renderJs.initialAnalogSliderComp();
    renderJs.initialAnalogInputComp();
    // To assign a value for Rotation Css
    renderJs.initRotationCss();
    // To show the drawed by svg.
    renderJs.initSvgDrawShow();
    //init BM connection check 
    renderJs.initBmConnectionCheck();
    //init FW BM js 
    renderJs.initDB();
    //init CustomizeComponent, call components onload methods 
    renderJs.initCustomizeComponentOnload();

    //remove loadingDiv
    renderJs.removeLoadingDiv();
});

/**jquery touch support*/
(function ($) {
    // Detect touch support
    $.support.touch = 'ontouchend' in document;
    // Ignore browsers without touch support
    if (!$.support.touch) {
        return;
    }
    var mouseProto = $.ui.mouse.prototype,
            _mouseInit = mouseProto._mouseInit,
            touchHandled;
    function simulateMouseEvent(event, simulatedType) { //use this function to simulate mouse event
        // Ignore multi-touch events
        if (event.originalEvent.touches.length > 1) {
            return;
        }
        event.preventDefault(); //use this to prevent scrolling during ui use

        var touch = event.originalEvent.changedTouches[0],
                simulatedEvent = document.createEvent('MouseEvents');
        // Initialize the simulated mouse event using the touch event's coordinates
        simulatedEvent.initMouseEvent(
                simulatedType, // type
                true, // bubbles                    
                true, // cancelable                 
                window, // view                       
                1, // detail                     
                touch.screenX, // screenX                    
                touch.screenY, // screenY                    
                touch.clientX, // clientX                    
                touch.clientY, // clientY                    
                false, // ctrlKey                    
                false, // altKey                     
                false, // shiftKey                   
                false, // metaKey                    
                0, // button                     
                null              // relatedTarget              
                );
        // Dispatch the simulated event to the target element
        event.target.dispatchEvent(simulatedEvent);
    }
    mouseProto._touchStart = function (event) {
        var self = this;
        // Ignore the event if another widget is already being handled
        if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
            return;
        }
        // Set the flag to prevent other widgets from inheriting the touch event
        touchHandled = true;
        // Track movement to determine if interaction was a click
        self._touchMoved = false;
        // Simulate the mouseover event
        simulateMouseEvent(event, 'mouseover');
        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');
        // Simulate the mousedown event
        simulateMouseEvent(event, 'mousedown');
    };
    mouseProto._touchMove = function (event) {
        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }
        // Interaction was not a click
        this._touchMoved = true;
        // Simulate the mousemove event
        simulateMouseEvent(event, 'mousemove');
    };
    mouseProto._touchEnd = function (event) {
        // Ignore event if not handled
        if (!touchHandled) {
            return;
        }
        // Simulate the mouseup event
        simulateMouseEvent(event, 'mouseup');
        // Simulate the mouseout event
        simulateMouseEvent(event, 'mouseout');
        // If the touch interaction did not move, it should trigger a click
        if (!this._touchMoved) {
            // Simulate the click event
            simulateMouseEvent(event, 'click');
        }
        // Unset the flag to allow other widgets to inherit the touch event
        touchHandled = false;
    };
    mouseProto._mouseInit = function () {
        var self = this;
        // Delegate the touch handlers to the widget's element
        self.element
                .on('touchstart', $.proxy(self, '_touchStart'))
                .on('touchmove', $.proxy(self, '_touchMove'))
                .on('touchend', $.proxy(self, '_touchEnd'));
        // Call the original $.ui.mouse init method
        _mouseInit.call(self);
    };
})(jQuery);

/**
 * renderJs
 * */
var renderJs = (function () {
    function renderJs() {
    }
    /**
     * customiz component register array
     * */
    var _CUSTOMIZE_COMPONENT_ONLOAD_STACK = [];

    /**
     * Register Customize Component initial method into _COMPONENT_ONLOAD_STACK array.
     * these methods will be called after runtimePage loaded.
     *  
     * @param {String} fn
     * eg. renderJs.registerCustomizeComponentRuntimeInitMethod("xxx");
     */
    renderJs.registerCustomizeComponentRuntimeInitMethod = function (fn) {
        _CUSTOMIZE_COMPONENT_ONLOAD_STACK.push(fn);
    }

    /**
     * init CustomizeComponents
     */
    renderJs.initCustomizeComponentOnload = function () {
        _CUSTOMIZE_COMPONENT_ONLOAD_STACK.forEach(function (fn) {
            //console.log("initCustomizeComponent:"+fn);
            eval(fn);
        });
    }

    /**
     * update img's realPath to relativePath
     */
    renderJs.resetDivImgFromAttr = function () {
        $("div[bg_image]").each(function (index, element) {
            var image = element.getAttribute("bg_image");
            element.style.backgroundImage = "url(" + getImageByProtocol(image) + ")";
        });

        $("div[off_image]").each(function (index, element) {
            var image = element.getAttribute("off_image");
            element.style.backgroundImage = "url(" + getImageByProtocol(image) + ")";
        });
    }

    /**
     * FW js init
     */
    renderJs.initDB = function () {
        //ignore login page
        if ("login" === $("body").attr("page_tag")) {
            return;
        }
        DBInit();
    }

    /**
     * VM data
     */
    renderJs.initVM = function () {
        if (!isHttpsProtocol()) {
            // http get vm data by ajax
            initVmByHttp();
        } else {
            //https get vm data in body
            initVmByHttpsProtocol()
        }
    }

    function initVmByHttp() {
        var path = "/lfs/dev/sdcard/webroot/tagtable.vm"; //change to [absolute path], because http/https have defferent [relative path]
        $.ajax({
            url: path,
            type: 'GET',
            async: false,
            dataType: 'xml',
            success: function (data) {
                //parse xml file
                var array = parseVmTableXmlData(data);
                renderJs.initBindData(array);
            },
            error: function () {
                // alert("error! vm data missing! ");
            }
        });
    }
    function initVmByHttpsProtocol() {
        var data = $("#tag_table_content").html().trim();
        var array = parseVmTableXmlData(data);
        renderJs.initBindData(array);
    }

    function parseVmTableXmlData(data) {
        var array = new Array($(data).find('tVariableTable').children().length);
        $(data).find('variables').each(function (i) {
            var obj = new Object();
            obj.id = $(this).children('id').text().trim();
            obj.range = $(this).children('blockType').attr('realvalue').trim();
            obj.address = $(this).children('blockNum').attr('realvalue').trim();
            obj.type = $(this).children('type').attr('realvalue').trim();
            obj.length = $(this).children('length').attr('realvalue').trim();
            array[i] = obj;
        });
        return array;
    }

    renderJs.initBindData = function (vmArray) {
        $(".server_binding").each(function (index, div) {
            for (var j = 0; j < vmArray.length; j++) {
                if (div.getAttribute("tag_id") && vmArray[j].id === div.getAttribute("tag_id")) {
//                    console.log( div.getAttribute("tag_id")+": type:"+div.getAttribute("type") +"-"+vmArray[j].type);
//                    console.log( div.getAttribute("tag_id")+": length:"+div.getAttribute("length") +"-"+vmArray[j].length);
//                    console.log( div.getAttribute("tag_id")+": range:"+div.getAttribute("range") +"-"+vmArray[j].range);
//                    console.log( div.getAttribute("tag_id")+": address:"+div.getAttribute("address") +"-"+vmArray[j].address);
                    div.setAttribute("type", vmArray[j].type);
                    div.setAttribute("length", vmArray[j].length);
                    div.setAttribute("range", vmArray[j].range);
                    div.setAttribute("address", vmArray[j].address);
                    break;
                }
            }
        });
    }

    /**
     * Navigation
     */
    renderJs.initNavivator = function () {
        //ignore login page
        if ("login" === $("body").attr("page_tag")) {
            return;
        }

        //http: load nav_page by ajax
        if (!isHttpsProtocol()) {
            var nav = $("<div></div>");
            var rdm = new Date().getTime();
            nav.load("nav.htm?!App-Language=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_language") + "&Security-Hint=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_login_ref") + "&rdm=" + rdm, function (response, status, xhr) {
                $("#main").append(nav);
                initNavBounds();
            });
        }
        //https:insert nav_page when build https project
        else {
            $("#tag").css("display", "block");
            initNavBounds();
        }

        //regist nav button 
        $(window).resize(navButtonReposition);
        $(window).scroll(navButtonReposition);
    }

    function initNavBounds() {
        $("#tag").css("top", $("#main").height() / 2 - 55);
        $("#menu").css("height", $("#main").css("height"));
        $("#wrap").css('width', $("#main").css("width"));
        renderJs.initNavLeftRightStyle();
        navButtonReposition();
    }

    function navButtonReposition() {
        var windowHeight = document.body.clientHeight;
        var mainHeight = $("#main").height();
        var tagHeight = $("#tag").height();
        if (!tagHeight || tagHeight == null) {
            tagHeight = 0;
        }
        if (windowHeight < mainHeight) {
            var newTop = (windowHeight - tagHeight) / 2 + $(document).scrollTop() - 55;
            $("#tag").css('top', newTop);
        } else {
            $("#tag").css("top", mainHeight / 2 - 55);
        }
    }

    var tempSec;
    renderJs.hideMenu = function () {
        if (!tempSec || (new Date().getTime() - tempSec < 300)) {
            return;
        }
        $("#menu").css('width', "0px");
        $("#menu").css('opacity', 0);
        $(".item").css('display', "none");
        $(".menuTitle").css('display', 'none');
        $("#tag").css('width', "20px");
        $("#arrows").css('display', "block");
    }
    renderJs.showMenu = function () {
        $("#menu").css('width', "230px");
        $("#menu").css('opacity', 0.9);
        $("#menu").css('overflow-y', "auto");
        $(".item").css('display', "block");
        $(".menuTitle").css('display', 'block');
        $("#tag").css('width', 0);
        $("#arrows").css('display', 'none');
        tempSec = new Date().getTime();
    }
    renderJs.initNavLeftRightStyle = function () {
        if ($("#menu").attr("is_right") && $("#menu").attr("is_right") == "true") {
            $("#nav").attr("class", "navRight");
            $("#tag").attr("class", "tagRight");
            $("#arrows").attr("class", "arrowsRight");
            $("#menu").attr("class", "menuRight");
        }
        else {
            $("#nav").attr("class", "nav");
            $("#tag").attr("class", "tag");
            $("#arrows").attr("class", "arrows");
            $("#menu").attr("class", "menu");
        }
        $(".menu").css('top', "0px");
    }

    //click nav item to forward with login info
    renderJs.navGo = function (obj) {
        var link = $(obj).attr("nav_link");
        //https
        var loginString = "?!App-Language=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_language");
        if (!isHttpsProtocol()) {
            //http
            loginString = loginString + "&Security-Hint=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_login_ref");
        }
        if (link === "logo_system") {
            link = window.location.origin + "/logo_system_01.shtm";
            window.location.href = link + loginString;
        } else {
            link = $(obj).attr("nav_link") + ".htm";
            window.location.replace(link + loginString);
        }
        return false;
    }

    // for user defined API: jump to another page
    renderJs.jumpToLink = function (url) {
        //https
        var link = url + "?!App-Language=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_language");
        if (!isHttpsProtocol()) {
            //http
            link = link + "&Security-Hint=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_login_ref");
        }
        window.location.replace(link);
        return false;
    }

    function getLinkTarget(obj) {
        var linkType = $(obj).parent().attr("link_type");
        var url = $(obj).parent().attr("url");
        var fileName = "file/" + $(obj).parent().attr("unique_name");
        var target = (linkType === "0") ? url : fileName;
        return target;
    }

    renderJs.openLinkInNewPage = function (obj) {
        var target = getLinkTarget(obj);
        //target = target + "?!App-Language=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_language");
        window.open(target);
    }

    renderJs.openLinkInNewWindow = function (obj) {
        var target = getLinkTarget(obj);
        //target = target + "?!App-Language=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_language");
        window.open(target, 'newwindow', 'height=800,width=800,top=200,left=500,toolbar=no,menubar=no,scrollbars=yes, resizable=yes,location=yes, status=no');
    }

    /**
     * To assign a value for Rotation Css, according to the different browsers.
     */
    renderJs.initRotationCss = function () {
        $("div[degree]").each(function () {
            var degree = $(this).attr("degree");
            var cValue = "rotate(" + parseFloat(degree) + "deg)";
            // Other Browser, including IE > 9
            $(this).css("transform", cValue);
            $(this).css("-webkit-transform", cValue);
            $(this).css("-moz-transform", cValue);
            $(this).css("-o-transform", cValue);
            $(this).css("-ms-transform", cValue);
        });
    }

    /**
     * To show the drawed by svg.
     */
    renderJs.initSvgDrawShow = function () {
        $("svg").each(function () {
            $(this).css("display", "");
        });
    }
    /**
     * Fix slider bug and add float surport. 
     * @returns {undefined}
     */
    renderJs.initialAnalogSliderComp = function () {
        var sliders = $(".analog_slider_comp").rotateSlide({
            orientation: "vertical",
        });
        sliders.rotateSlide("disable");
        sliders.each(function (index) {
            var parent = $(this).parent().get(0);
            var slider_maxVal = parseFloat($(parent).attr("maxval"));
            var slider_minVal = parseFloat($(parent).attr("minval"));
            var hdl_img = $(parent).attr("hdl_img");
            if (hdl_img) {
                $(parent).children(".analog_slider_comp").children(".ui-slider-handle").css('background-image', 'url(' + getImageByProtocol(hdl_img) + ')');
            }
            var bar_img = $(parent).attr("bar_img");
            if (bar_img) {
                $(parent).children(".analog_slider_comp").css('background-image', 'url(' + getImageByProtocol(bar_img) + ')');
            }
            var orientation = parseInt($(parent).attr("degree"));
            var midVal = slider_minVal + (slider_maxVal - slider_minVal) * 0.5;
            var decimal = $(parent).attr("decimal");
            var step = getDecimalStep(decimal);
            $(this).rotateSlide({
                degree: orientation,
                max: slider_maxVal,
                min: slider_minVal,
                value: midVal,
                step: step
            });
            $(this).children(".ui-slider-handle").css('margin-bottom', 0);
            $(this).children(".ui-slider-handle").myTooltip({track: true, position: {}, myPosition: {type: "default"}, content: function () {
                    return midVal;
                }}).hover(function (event) {
                $(this).myTooltip("mouseOver", event);
            }, function (event) {
                $(this).myTooltip("mouseOut", event);
            }).mousemove(function (event) {
                $(this).myTooltip("mouseMove", event);
            }).click(function (event) {
                $(this).myTooltip("click", event);
            });
            $(this).children(".ui-slider-handle").removeAttr("title");
            if ($(parent).attr("mode") == "true") {
                $(this).rotateSlide("enable").rotateSlide({
                    change: function (event, ui) {
                        //var currentVal = $(this).children(".ui-slider-handle").attr("title");
                        if ($(parent).attr("event_mode") == "write") {
                            var newValue = renderJs.getIntValueFromAanlogInput($(parent), ui.value);
                            newValue = renderJs.getFormatValue($(parent), newValue);
                            renderJs.doSetAnalogValue(parent.id, newValue);
                        }
                        $(parent).attr("event_mode", "read");
                        $(this).children(".ui-slider-handle").removeAttr("title");
                        $(this).children(".ui-slider-handle").myTooltip({
                            content: function () {
                                //if( currentVal ){
                                //    return currentVal;
                                //}else{
                                return ui.value.toString();
                                //}
                            }
                        });
                        //$(this).children(".ui-slider-handle").myTooltip("close");
                        //$(this).children(".ui-slider-handle").attr("title", ui.value);
                    },
                    start: function (event, ui) {
                        STOP_SLIDER_REFERSH_ID = parent.id;
                        $(this).children(".ui-slider-handle").myTooltip("mouseDown", event);
                    },
                    stop: function (event, ui) {
                        STOP_SLIDER_REFERSH_ID = undefined;
                        $(parent).attr("event_mode", "write");
                        $(this).children(".ui-slider-handle").myTooltip("mouseUp", event);
                    },
                    slide: function (event, ui) {
                        $(this).children(".ui-slider-handle").myTooltip({
                            content: function () {
                                return ui.value.toString()
                            }
                        });
                    }
                }).children(".ui-slider-handle").css('margin-top', "0"); //.attr({title: midVal})
            } else {
                $(this).rotateSlide({
                    change: function (event, ui) {
                        //var currentVal = $(this).children(".ui-slider-handle").attr("title");
                        $(this).children(".ui-slider-handle").removeAttr("title");
                        $(this).children(".ui-slider-handle").myTooltip({
                            content: function () {
                                return ui.value.toString()
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Get slider step.
     * @param {type} decimal
     * @returns {Number}
     */
    function getDecimalStep(decimal) {
        if (decimal == 1000) {
            return 0.001;
        } else if (decimal == 100) {
            return 0.01;
        } else if (decimal == 10) {
            return 0.1;
        } else {
            return 1;
        }
    }

    renderJs.initialAnalogInputComp = function () {
        $(".analog_input").children(".valueText").children(".inputVal").attr("placeholder", "0");
        $(".analog_input").each(function (index) {
            var bindObj = this;
            var inputBox = $(this).children(".valueText").children(".inputVal");
            var placeHolder = 0;
            inputBox.attr("disabled", "disabled");
            if ($(this).attr("mode") == "true") {
                inputBox.removeAttr("disabled");
                inputBox.focusin(function () {
                    placeHolder = $(bindObj).attr("last_placeholder");
                    inputBox.attr("placeholder", "");
                }).focusout(function () {
                    inputBox.val("");
                    inputBox.attr("placeholder", $(bindObj).attr("last_placeholder"));
                }).keydown(function (event) {
                    if (event.keyCode == 13) {
                        var inputVal = inputBox.val().trim();
                        renderJs.submitAnalogInput(bindObj, inputVal, placeHolder);
                    }
                });
//                .keyup(function (event) {
//                    var inputVal = inputBox.val().trim();
//                    if ($(bindObj).attr("comp_type") == "AnalogValueComponent") {
//                        renderJs.checkInputValue(bindObj, inputVal, inputBox);
//                    }
//                });
                //.change(function () {
                //    var inputVal = inputBox.val().trim();
                //    onChangeFunForAnalogInput(bindObj, inputVal, placeHolder);
                //});
            }
        });
    }

    renderJs.checkInputValue = function (bindObj, inputVal, inputBox) {
        if (!inputVal || inputVal == "" || inputVal == "NAN" || inputVal == "-") {
            return;
        }
        //parse value:
        var blockFormat = $(bindObj).attr("block_format");
        var accessModeType = $(bindObj).attr("type");
        var sValue = inputVal;
        var iValue;
        switch (blockFormat) {
            case "Binary":
            {
                iValue = parseInt(sValue, 2);
                break;
            }
            case "Hex":
            {
                iValue = parseInt(sValue, 16);
                break;
            }
            case "Signed":
            {
                iValue = parseInt(sValue, 10);
                break;
            }
            case "Unsigned":
            {
                iValue = parseInt(sValue, 10);
                break;
            }
            default:
                break;
        }

        //parse type:
        var iMin;
        var iMax;
        switch (accessModeType) {
            case "1":
            {
                iMin = 0;
                iMax = 1;
                break;
            }
            case "2":
            {
                if (blockFormat == "Signed") {
                    iMin = -128;
                    iMax = 127;
                }
                else {
                    iMin = 0;
                    iMax = 255;
                }
                break;
            }
            case "4":
            {
                if (blockFormat == "Signed") {
                    iMin = -32768;
                    iMax = 32767;
                }
                else {
                    iMin = 0;
                    iMax = 65535;
                }
                break;
            }
            case "6":
            {
                if (blockFormat == "Signed") {
                    iMin = -2147483648;
                    iMax = 2147483647;
                }
                else {
                    iMin = 0;
                    iMax = 4294967295;
                }
                break;
            }
            default:
            {
                iMin = 0;
                iMax = 0;
                break;
            }
        }
        if (iValue > iMax)
            iValue = iMax;
        if (iValue < iMin)
            iValue = iMin;
        switch (blockFormat) {
            case "Binary":
            {
                sValue = iValue.toString(2);
                break;
            }
            case "Hex":
            {
                sValue = iValue.toString(16).toUpperCase();
                break;
            }
            case "Signed":
            {
                sValue = iValue.toString(10);
                break;
            }
            case "Unsigned":
            {
                sValue = iValue.toString(10);
                break;
            }
            default:
                sValue = iValue.toString(10);
                break;
        }

        //if(sValue!=inputVal){
        inputBox.val(sValue);
        //}
    }

    renderJs.submitAnalogInput = function (bindObj, inputVal, placeHolder) {
        var result = inputVal;
        if (inputVal != "") {
            if ($(bindObj).attr("comp_type") === "AnalogTimeComponent") {
                if (renderJs.isAnalogTimeValid($(bindObj), inputVal)) {
                    result = renderJs.getAtcValFromAnalogTime($(bindObj), inputVal);
                    if ($(bindObj).attr("time_format") === "md") {// [yearly]
                        var day = result.substring(2, 4);
                        if (day === "00") {
                            result = result.substring(0, 2) + day;
                        }
                        // [yearly] time_format==HEX
                        $(bindObj).attr("block_format", "Hex");
                    } else if ($(bindObj).attr("time_format") === "hm") {// [weekly]
                        if ($(bindObj).attr("last_placeholder") === "disabled") {
                            result = "FF";
                        }
                        // [weekly] time_format==HEX
                        $(bindObj).attr("block_format", "Hex");
                    } else {
                        //[normal format] 
                        result = renderJs.getFormatValue(bindObj, result);
                    }
                    //console.log("getAtcValFromAnalogTime:"+result);
                    renderJs.doSetAnalogValue(bindObj.id, result);
                    return inputVal;
                }
            }
            else {//AnalogValueComponent
                inputVal = renderJs.getIntValueFromAanlogInput(bindObj, inputVal);
                if (renderJs.isAnalogInputValid(inputVal, bindObj)) {
                    result = renderJs.getFormatValue(bindObj, inputVal);
                    //console.log("AnalogValueComponent:"+result);
                    renderJs.doSetAnalogValue(bindObj.id, result);
                    return result;
                }
            }
        }

        //not pass
        var noticeObj = $(bindObj).children(".notice");
        $(noticeObj).css("display", "inline").html("Invalid Value").fadeOut(1500, function () {
            var inputBox = $(bindObj).children(".valueText").children(".inputVal");
            inputBox.val("");
            inputBox.attr("placeholder", placeHolder);
        });
        return placeHolder
    }

    renderJs.getFormatValue = function (bindObj, inputVal) {
        var tValue = inputVal + "";
        var sType = $(bindObj).attr("type");
        var sRange = $(bindObj).attr("range");
        var sAddress = $(bindObj).attr("address");
        var sDispFormat = $(bindObj).attr("block_format");
        tValue = renderJs.getInputValueByDispFormat(sDispFormat, tValue, sType)
        if (sRange != "" && sAddress != "" && sType != "" && tValue != "") {
            if (sRange != "129" && sRange != "12" && sRange != "13" && sRange != "14" && sRange != "18") {
                //all input can not be edited(exclude the NetI and NetAI, they are considered as a marker):
                renderJs.getAddressByRange(sRange);
                var iDataLength = renderJs.getDataLengthByType(sType);
                if (iDataLength > 0) {
                    var iTempIndex;
                    var iPaddingLength = iDataLength - tValue.length;
                    var sPadding = "";
                    for (iTempIndex = 0; iTempIndex < iPaddingLength; ++iTempIndex) {
                        sPadding += "0";
                    }
                    tValue = sPadding + tValue;
                    tValue = tValue.substring(tValue.length - iDataLength);
                }
            }
        }
        return tValue;
    }

    renderJs.getDataLengthByType = function (sType) {
        var iDataLength;
        switch (sType) {
            case "1":
            {
                iDataLength = 1;
                break;
            }
            case "2":
            {
                iDataLength = 1;
                break;
            }
            case "4":
            {
                iDataLength = 2;
                break;
            }
            case "6":
            {
                iDataLength = 4;
                break;
            }
            default:
            {
                iDataLength = 0;
                break;
            }
        }
        iDataLength *= 2;
        return iDataLength;
    }

    renderJs.getInputValueByDispFormat = function (sDispFormat, input, sType) {
        var iValue;
        var newValue;
        switch (sDispFormat) {
            case "Bool":
            {
                iValue = parseInt(input, 2);
                newValue = iValue.toString(16);
                break;
            }
            case "Binary":
            {
                iValue = parseInt(input, 2);
                newValue = iValue.toString(16);
                break;
            }
            case "Hex":
            {
                iValue = parseInt(input, 16);
                newValue = iValue.toString(16);
                break;
            }
            case "Signed":
            {
                iValue = parseInt(input, 10);
                if (iValue < 0) {
                    iValue = Signed2Unsinged(iValue, sType);
                }
                newValue = iValue.toString(16);
                break;
            }
            case "Unsigned":
            {
                iValue = parseInt(input, 10);
                newValue = iValue.toString(16);
                break;
            }
            default:
            {
                newValue = "";
                break;
            }
        }
        return newValue;
    }

    renderJs.getAddressByRange = function (range) {
        var address;
        switch (range) {
            case "132":
            {
                address *= 8;
                break;
            }
            case "18":
            case "21":
            case "19":
            case "22":
            case "20":
            {
                address *= 16;
                break;
            }
            default:
            {
                break;
            }
        }
        return address;
    }

    renderJs.isAnalogTimeValid = function (obj, input) {
        var timeUnit = obj.attr("time_format");
        var reg = /^(\d{1,5})$/; //hours 
        if (timeUnit === "m") {
            reg = /^(\d{1,3}):(\d{1,2})$/; //"00:00";
        } else if (timeUnit === "s") {
            reg = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/; //"00:00:00";
        } else if (timeUnit === "ms") {
            reg = /^(\d{1,2}):(\d{1,2}):(\d{1,2}).\d{1,2}$/; //"00:00:00.00";
        } else if (timeUnit === "md") {
            reg = /^(\d{1,2})-(\d{1,2})$/; //01-30
        } else if (timeUnit === "hm") {
            reg = /^(\d{1,2}):(\d{1,2})$/; //"00:00";
        }
        return reg.test(input);
    }

    renderJs.getAtcValFromAnalogTime = function (obj, input) {
        var timeUnit = obj.attr("time_format");
        var atcVal = input;
        if (timeUnit === "m") {
            var time = input.split(":");
            atcVal = parseInt(time[0]) * 60 + parseInt(time[1]);
        } else if (timeUnit === "s") {
            var time = input.split(":");
            atcVal = parseInt(time[0]) * 3600 + parseInt(time[1]) * 60 + parseInt(time[2]);
            //unsgined max value =65535
            atcVal = (atcVal > 65535) ? 65535 : atcVal;
        } else if (timeUnit === "ms") {
            var hms = input.split(".");
            var time = hms[0].split(":");
            atcVal = parseInt(time[1]) * 6000 + parseInt(time[2]) * 100 + parseInt(hms[1]);
            //block_formate=Unsgined, maxValue =65535
            atcVal = (atcVal > 65535) ? 65535 : atcVal;
        } else if (timeUnit === "md") {
            /* yearly: block_formate=Hex */
            var monthDay = input.split("-");
            var month = parseInt(monthDay[0]);
            month = (month < 10) ? "0" + month : month;
            var day = parseInt(monthDay[1]);
            day = (day < 10) ? "0" + day : day;
            atcVal = "" + month + day;
        } else if (timeUnit === "hm") {
            /* weekly: block_formate=Hex */
            var hm = input.split(":");
            var hour = parseInt(hm[0]);
            hour = (hour < 10) ? "0" + hour : hour;
            var mintue = parseInt(hm[1]);
            mintue = (mintue < 10) ? "0" + mintue : mintue;
            atcVal = "" + hour + mintue;
        }
        //console.log("AnlogTimeVal:" + input + "==" + timeUnit + "==" + atcVal);
        return atcVal;
    }

    var intervalId;
    renderJs.setDigitalData = function (obj) {
        var id = obj.id;

        //show loading icon
        $("#" + id).children(".btn_laoding").css("display", "block");
        renderJs.showLoadingGif($("#" + id + " p"));
        //hide icon after 5 sec
        setTimeout(function () {
            $("#" + id).children(".btn_laoding").css("display", "none");
            renderJs.hideLoadingGif($("#" + id + " p"));
        }, 5000);

        var oRequest = new DBRequest(document.getElementById(id));
        if (obj.value) {
            oRequest.SetValue("00");
        } else {
            oRequest.SetValue("01");
        }
        if (oRequest.SetQuery()) {
            intervalId = setInterval(renderJs.checkResult, 1000, oRequest);
        }
        return false;
    }

    /** get decimal value */
    renderJs.getFloatValueByDecimalPlace = function (id, value) {
        var block_format = $("#" + id).attr("block_format");
        if (block_format === "Hex" || block_format === "Binary") {
            return value;
        }

        var decimal = $("#" + id).attr("decimal");
        if (isNaN(decimal)) {
            //old version no decimalPlace
            decimal = 1;
        } else {
            decimal = parseInt(decimal);
        }
        return (value / decimal).toFixed(getDecimalPlace(decimal));
    }
    function getDecimalPlace(decimal) {
        if (decimal === 1000) {
            return 3;
        } else if (decimal === 100) {
            return 2;
        } else if (decimal === 10) {
            return 1;
        } else {
            return 0;
        }
    }
    /**  decimal value to int */
    renderJs.getIntValueFromAanlogInput = function (bindObj, value) {
        var block_format = $(bindObj).attr("block_format");
        if (block_format === "Hex" || block_format === "Binary") {
            return value;
        }

        var decimalValue = $(bindObj).attr("decimal");
        if (isNaN(decimalValue)) {
            decimalValue = 1;
        }
        var result = value * parseInt(decimalValue);
        return  getAccurateValue(result);
    }

    /** used to fix js float Accurate issue */
    function getAccurateValue(value) {
        return Math.round(value * 1000000000) / 1000000000;
    }

    renderJs.setAnalogData = function (obj) {
        var id = obj.parentNode.id;
        var slider_maxVal = parseInt($("#" + id).children(".analog_max_val").contents()[0].data);
        var slider_minVal = parseInt($("#" + id).children(".analog_min_val").contents()[0].data);
        var currentVal = parseInt($("#" + id).children(".analogValue").val());
        $("#" + id).children(".analog_bar").hide();
        $("#" + id).children(".analog_min_val").hide();
        $("#" + id).children(".setAnalogBtn").show();
        var slider = $("#" + id).children(".analog_set_val").css('margin', '10 auto').show().rotateSlide({
            orientation: "vertical",
            max: slider_maxVal,
            min: slider_minVal,
            value: currentVal,
            change: function (event, ui) {
                $("#" + id).children(".analog_max_val").html(ui.value);
                $("#" + id).children(".analogValue").val(ui.value);
            }
        });
        $("#" + id).children(".setAnalogBtn").click(function () {
            var setValue = slider.rotateSlide("value");
            rotateSlide.hide();
            $("#" + id).children(".analog_bar").show();
            $("#" + id).children(".analog_min_val").show();
            $("#" + id).children(".analog_max_val").html(slider_maxVal);
            $("#" + id).children(".setAnalogBtn").hide();
            //console.log("analog_bar_slider:"+newValue);
            renderJs.doSetAnalogValue(id, setValue);
            //showAnalogBar(id,slider_maxVal,slider_minVal, setValue); // for off-line test
        });
    }
    renderJs.doSetAnalogValue = function (divID, value) {
        var oRequest = new DBRequest(document.getElementById(divID));
        oRequest.SetValue(value);
        console.log("doSetAnalogValue:" + value);
        if (oRequest.SetQuery()) {
            renderJs.updateNoticeDisplay(divID, value);
            return true;
        }
        return false;
    }
    renderJs.updateNoticeDisplay = function (divID, value) {
        if ($("#" + divID).has(".analog_input")) {
            $("#" + divID).children(".notice").css("display", "inline").html("submitted").fadeOut(2500, function () {
                $("#" + divID + " .inputVal").val("");
                // $("#" + divID + " .inputVal").attr("placeholder", value);
            });
        }
    }

    renderJs.showAnalogBar = function (id, maxVal, minVal, strValue) {
        var whiteHeight = "100%";
        if (strValue >= maxVal) {
            whiteHeight = "0%";
        } else if (strValue <= minVal) {
            whiteHeight = "100%";
        } else if (maxVal != minVal) {
            whiteHeight = Math.round((1 - ((strValue - minVal) / (maxVal - minVal))) * 10000) / 100.00 - 0.1 + "%";
        }

        $("#" + id + " .whiteBg").css('height', whiteHeight);
        var color = renderJs.getColorByBarValue(id, strValue);
        if (color) {
            $("#" + id + " .barBg").css('background-color', color);
        }
    }

    renderJs.getColorByBarValue = function (id, barValue) {
        var scopeColor = $("#" + id).attr("scope_color");
        if (!scopeColor) {
            return null;
        }
        var range = scopeColor.split(",");
        barValue = parseFloat(barValue);
        for (var i = 0; i < range.length; i++) {
            var value = range[i].split(":");
            if (value[0] <= barValue && barValue <= value[1]) {
                return  renderJs.getColorFromRGB(value[2]);
            }
        }
    }

    renderJs.checkResult = function (obj) {
        if (0 == obj.m_iSetPendingFlag) {
            clearInterval(intervalId);
        }
    }

    renderJs.isAnalogInputValid = function (inputVal, bindObj) {
        var sType = $(bindObj).attr("block_format");
        var patt = /^1[10]*$/;
        if (sType === "Binary") {
            patt = /^1[10]*$/;
        }
        if (sType === "Signed") {
            patt = /^(-|\+)?\d+$/;
        }
        if (sType === "Unsigned") {
            patt = /^\d+$/;
        }
        if (sType === "Hex") {
            inputVal = (inputVal + "").toUpperCase();
            patt = /^[0-9A-F]{0,4}$/;
        }
        return (patt.test(inputVal));
    }

    renderJs.getMinFormatTimeByVmVal = function (val) {
        var min = parseInt(val / 60);
        var sec = val % 60;
        min = (min > 9) ? min : "0" + min;
        sec = (sec > 9) ? sec : "0" + sec;
        return min + ":" + sec;
    }
    renderJs.getSecFormatTimeByVmVal = function (val) {
        var h = parseInt(val / 3600);
        var m = parseInt(val / 60 % 60);
        var s = parseInt(val % 60 % 60);
        h = h >= 10 ? h : "0" + h;
        m = m >= 10 ? m : "0" + m;
        s = s >= 10 ? s : "0" + s;
        return h + ":" + m + ":" + s;
    }
    renderJs.getMsFormatTimeByVmVal = function (val) {
        var minute = parseInt(val / 6000);
        var sec = (val % 6000) + "";
        minute = (minute > 9) ? "00:" + minute : "00:0" + minute;
        var newSec = "0000" + sec;
        newSec = newSec.substr(sec.length, 4);
        newSec = newSec.substr(0, 2) + "." + newSec.substr(2, 4);
        return minute + ":" + newSec;
    }
    renderJs.getMonthDayFormatTimeByVmVal = function (val) {
        var month = ("" + val).substr(0, 2);
        month = month.replace("FF", "disabled");
        var day = ("" + val).substr(2, 2);
        day = day.replace("FF", "disabled");
        return month + "-" + day;
    }
    renderJs.getWeeklyTimeFormatTimeByVmVal = function (val) {
        if (val.indexOf("FF") !== -1) {
            return "disabled";
        }
        var hour = ("" + val).substr(0, 2);
        var minute = ("" + val).substr(2, 2);
        return hour + ":" + minute;
    }

    renderJs.getValueByBlockFormat = function (blockFormat, accessModeType, sValue) {
        var orgin;
        var display;
        switch (blockFormat) {
            case "Binary":
            {
                orgin = "bin_" + sValue;
                display = "2#" + parseInt(sValue, 16).toString(2);
                //display = parseInt(sValue, 16).toString(2);
                return display;
            }
            case "Hex":
            {
                orgin = "hex_" + sValue;
                display = "16#" + parseInt(sValue, 16).toString(16).toUpperCase();
                //display = parseInt(sValue, 16).toString(16).toUpperCase();
                return display;
            }
            case "Signed":
            {
                //byte=2,word=4,dword==6;
                orgin = "signed_" + sValue;
                display = Unsigned2Signed(parseInt(sValue, 16), accessModeType).toString();
                return display;
            }
            case "Unsigned":
            default:
            {
                orgin = "def_" + sValue;
                display = parseInt(sValue, 16).toString();
                return display;
            }
        }
    }

    renderJs.getColorFromRGB = function (colorStr) {
        var value = parseInt(colorStr);
        value = Math.abs(value);
        var val = 0xff000000 | value;
        val = val.toString(16).substring(1);
        var str = '';
        if (val.length < 6) {
            var i = 6 - val.length;
            for (var t = 0; t < i; t++) {
                str += '0';
            }
        }
        var final = '#' + str + val;
        return (final === "#1000000") ? "#000000" : final;
    }

    renderJs.logout = function () {
        //$.ajax({
        //    url: 'forward.htm',
        //    type: 'GET',
        //    error: function () {
        //        // "forward.htm " not exist, logout and jump to bm's login page.
        //        LocalLogout();
        //    },
        //    success: function () {
        //        //jump to customize login page.
        //        LocalLogout();
        //        //TODO check bm version<8.3 jump to  bm's login page
        //        window.location.replace("login.htm?!App-Language=" + LocalStorage.Instance().Get("logo_current_language"));
        //    }
        //});
        /** logout forward should be controled by BM */
        LocalLogout();
        return false;
    }

    // load js file
    renderJs.loadJS = function (fileName) {
        var id = fileName.substring(0, fileName.indexOf('.'));
        var src = "js/" + fileName;
        var oHead = document.getElementsByTagName('HEAD').item(0);
        var scriptTag = document.getElementById(id);
        if (scriptTag) {
            //oHead.removeChild(scriptTag);
            return;
        }
        var oScript = document.createElement("script");
        oScript.id = id;
        oScript.type = "text/javascript";
        oScript.src = src;
        oHead.appendChild(oScript);
        return oScript;
    }


    //-- check connction ----------------
    /** 
     * Strategy:
     *  Send connection request once a second;
     *  Check connection result every 10 seconds.
     * - request [succes] once in 10 times = connection live
     * - request continous [fail] 10 times = connection lost
     * */
    var connectionStartus = false;
    renderJs.initBmConnectionCheck = function () {
        //ignore login page
        if ("login" === $("body").attr("page_tag")) {
            return;
        }
        //init connection check
        var callBackParam = 0;
        setInterval(checkBM_connection, 5000);//1000
        setInterval(checkConnectionResult, 50000);//10000
        checkBM_connection(callBackParam);
    }
    function checkConnectionResult() {
        if (false === connectionStartus) {
            $("#timeout_dlg").show();
            $("#timeout_dlg").dialog({
                title: "Connection Lost",
                autoOpen: false,
                closeOnEscape: false,
                dialogClass: "alert",
                draggable: false,
                height: 160,
                width: 300,
                modal: true,
                esizable: false
            }).dialog("open");
            $(".ui-dialog-titlebar-close").hide();
            CONNECTED_BM_LOST = true;
            DBInit();
        }
        connectionStartus = false;
    }
    function doCheckCallback() {
        if (this.m_iLocalResult === 200) {
            connectionStartus = true;
            try {
                $("#timeout_dlg").dialog("destroy");
                $("#timeout_dlg").hide();
            } catch (err) {/**do nothing*/
            }
        } else if (this.m_iLocalResult === 403) {
            LocalLogout();
        }
    }
    function checkBM_connection(callBackParameter) {
        AjaxRequest.Instance().Request("GETSTDG",
                "",
                //connectionCallBack,
                doCheckCallback,
                callBackParameter,
                LocalStorage.Instance().Get("logo_current_language"),
                3000,
                "SYM",
                DESMakeKey(LocalStorage.Instance().Get("logo_current_login_key1A1"), LocalStorage.Instance().Get("logo_current_login_key1A2")),
                DESMakeKey(LocalStorage.Instance().Get("logo_current_login_key1B1"), LocalStorage.Instance().Get("logo_current_login_key1B2")),
                LocalStorage.Instance().Get("logo_current_login_ref"));
    }
    function connectionCallBack(param) {
        if (this.m_iLocalResult == 601 || this.m_iLocalResult == 0) { //timeout:
            $("#timeout_dlg").show();
            $("#timeout_dlg").dialog({
                title: "Connection Lost",
                autoOpen: false,
                closeOnEscape: false,
                dialogClass: "alert",
                draggable: false,
                height: 160,
                width: 300,
                modal: true,
                esizable: false
            }).dialog("open");
            $(".ui-dialog-titlebar-close").hide();
            CONNECTED_BM_LOST = true;
        } else if (CONNECTED_BM_LOST) {
            $("#timeout_dlg").dialog("destroy");
            $("#timeout_dlg").hide();
            CONNECTED_BM_LOST = false;
            DBInit();
        }
    }
    /**
     * full screen page loading 
     **/
    renderJs.removeLoadingDiv = function () {
        if ($("#loadingDiv")) {
            $("#loadingDiv").hide();
        }
    }
    /**
     * initUserInfo
     **/
    renderJs.initUserInfo = function () {
        // get userInfo from LocalDB
        var currentUser = LocalStorage.Instance().Get("logo_current_user");
        if ("Web Guest" === currentUser) {
            //disable all comps writeable
            disableWriteableComponents();
        } else {
            currentUser = "Web User"
        }
        //show user info on menu
        if ($("#userInfo")) {
            $("#userInfo").remove();
        }
        $("#nav .menuTitle").append("<div id='userInfo' style='font-size:14;font-weight:100'>[ " + currentUser + " ]</div>");
    }

    renderJs.initCloudMode = function () {
        if (IS_CLOUD_MODE) {
            // [cloud]: "loignCmp" 
            if ($("#loginCmp")) {
                $("#keepMeLoggedOn").css("display", "none");
                $("#check_logoncustomized").attr("checked", "checked");
                $("#check_logoncustomized").attr("disabled", true);
                $("#toCustomizedSite").css("display", "");
                $("#check_logoncustomized").css("display", "");
            }
            //[cloud]: "PushButton" 
            $("div[comp_type='PushButton']").each(function () {
                //[cloud]: click mode timeout  
                $(this).attr("frequency", 5000);
                //[cloud]: "PushButton" only support "Click" mode
                $(this).attr("mouse_mode", "Click");
            });
        } else {
            //[local bm]: all device_name="_local_"
            $(".server_binding").each(function (index, div) {
                div.setAttribute("device_name", "_local_");
            });
        }
    }

    function disableWriteableComponents() {
        $("div[comp_type='CustomizedComponent']").each(function () {
            $(this).attr("mode", false);
            $(this).css("cursor", "not-allowed");//$(this).css("cursor", "dufault");
            $(this).removeAttr('onclick');
            $(this).attr('title', "Read Only For Guest Uset");
        });
        $("div[comp_type='AnalogValueComponent']").each(function () {
            $(this).attr("mode", false);
            $(this).find(".inputVal").attr('disabled', "disabled");
        });
        $("div[comp_type='AnalogTimeComponent']").each(function () {
            $(this).attr("mode", false);
            $(this).find(".inputVal").attr('disabled', "disabled");
        });
        $("div[comp_type='AnalogSliderComponent']").each(function () {
            $(this).attr("mode", false);
        });
        $(".analog_slider_comp").each(function () {
            $(this).children(".ui-slider-handle").css("cursor", "not-allowed");
        });
        $("div[comp_type='PushButton']").each(function () {
            $(this).attr("mode", false);
            $(this).css("cursor", "not-allowed");
            $(this).attr('title', "Read Only For Guest Uset");
            $(this).removeAttr('ontouchstart');
            $(this).removeAttr('onmousedown');
            $(this).removeAttr('onmouseout');
            $(this).removeAttr('onmouseup');
            $(this).removeAttr('ontouchend');
            $(this).removeAttr('ontouchend');
            $(this).removeAttr('onclick');
        });
    }

    /**
     * loading gif icon
     **/
    renderJs.showLoading = function (id) {
        //show loading icon
        $("#" + id).children(".btn_laoding").css("display", "block");
        renderJs.showLoadingGif($("#" + id + " p"));
        //hide icon after 5 sec
        setTimeout(function () {
            $("#" + id).children(".btn_laoding").css("display", "none");
            renderJs.hideLoadingGif($("#" + id + " p"));
        }, 5000);
    }
    renderJs.showLoadingGif = function (selector) {
        //$("#" + id + " p").css("background-attachment", "fixed");
        selector.css("background-image", "url('data:image/gif;base64,R0lGODlhEAAQAMQAAP///+7u7t3d3bu7u6qqqpmZmYiIiHd3d2ZmZlVVVURERDMzMyIiIhEREQARAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFBwAQACwAAAAAEAAQAAAFdyAkQgGJJOWoQgIjBM8jkKsoPEzgyMGsCjPDw7ADpkQBxRDmSCRetpRA6Rj4kFBkgLC4IlUGhbNQIwXOYYWCXDufzYPDMaoKGBoKb886OjAKdgZAAgQkfCwzAgsDBAUCgl8jAQkHEAVkAoA1AgczlyIDczUDA2UhACH5BAUHABAALAAAAAAPABAAAAVjICSO0IGIATkqIiMKDaGKC8Q49jPMYsE0hQdrlABCGgvT45FKiRKQhWA0mPKGPAgBcTjsspBCAoH4gl+FmXNEUEBVAYHToJAVZK/XWoQQDAgBZioHaX8igigFKYYQVlkCjiMhACH5BAUHABAALAAAAAAQAA8AAAVgICSOUGGQqIiIChMESyo6CdQGdRqUENESI8FAdFgAFwqDISYwPB4CVSMnEhSej+FogNhtHyfRQFmIol5owmEta/fcKITB6y4choMBmk7yGgSAEAJ8JAVDgQFmKUCCZnwhACH5BAUHABAALAAAAAAQABAAAAViICSOYkGe4hFAiSImAwotB+si6Co2QxvjAYHIgBAqDoWCK2Bq6A40iA4yYMggNZKwGFgVCAQZotFwwJIF4QnxaC9IsZNgLtAJDKbraJCGzPVSIgEDXVNXA0JdgH6ChoCKKCEAIfkEBQcAEAAsAAAAABAADgAABUkgJI7QcZComIjPw6bs2kINLB5uW9Bo0gyQx8LkKgVHiccKVdyRlqjFSAApOKOtR810StVeU9RAmLqOxi0qRG3LptikAVQEh4UAACH5BAUHABAALAAAAAAQABAAAAVxICSO0DCQKBQQonGIh5AGB2sYkMHIqYAIN0EDRxoQZIaC6bAoMRSiwMAwCIwCggRkwRMJWKSAomBVCc5lUiGRUBjO6FSBwWggwijBooDCdiFfIlBRAlYBZQ0PWRANaSkED1oQYHgjDA8nM3kPfCmejiEAIfkEBQcAEAAsAAAAABAAEAAABWAgJI6QIJCoOIhFwabsSbiFAotGMEMKgZoB3cBUQIgURpFgmEI0EqjACYXwiYJBGAGBgGIDWsVicbiNEgSsGbKCIMCwA4IBCRgXt8bDACkvYQF6U1OADg8mDlaACQtwJCEAIfkEBQcAEAAsAAABABAADwAABV4gJEKCOAwiMa4Q2qIDwq4wiriBmItCCREHUsIwCgh2q8MiyEKODK7ZbHCoqqSjWGKI1d2kRp+RAWGyHg+DQUEmKliGx4HBKECIMwG61AgssAQPKA19EAxRKz4QCVIhACH5BAUHABAALAAAAAAQABAAAAVjICSOUBCQqHhCgiAOKyqcLVvEZOC2geGiK5NpQBAZCilgAYFMogo/J0lgqEpHgoO2+GIMUL6p4vFojhQNg8rxWLgYBQJCASkwEKLC17hYFJtRIwwBfRAJDk4ObwsidEkrWkkhACH5BAUHABAALAAAAQAQAA8AAAVcICSOUGAGAqmKpjis6vmuqSrUxQyPhDEEtpUOgmgYETCCcrB4OBWwQsGHEhQatVFhB/mNAojFVsQgBhgKpSHRTRxEhGwhoRg0CCXYAkKHHPZCZRAKUERZMAYGMCEAIfkEBQcAEAAsAAABABAADwAABV0gJI4kFJToGAilwKLCST6PUcrB8A70844CXenwILRkIoYyBRk4BQlHo3FIOQmvAEGBMpYSop/IgPBCFpCqIuEsIESHgkgoJxwQAjSzwb1DClwwgQhgAVVMIgVyKCEAIfkECQcAEAAsAAAAABAAEAAABWQgJI5kSQ6NYK7Dw6xr8hCw+ELC85hCIAq3Am0U6JUKjkHJNzIsFAqDqShQHRhY6bKqgvgGCZOSFDhAUiWCYQwJSxGHKqGAE/5EqIHBjOgyRQELCBB7EAQHfySDhGYQdDWGQyUhADs=')");
        selector.css("background-position", "center");
        selector.css("background-repeat", "no-repeat");
    }
    renderJs.hideLoadingGif = function (selector) {
        selector.css("background-image", "");
    }

    //--push button----------------
    renderJs.onPushButtonClicked = function (oTarget) {
        var id = oTarget.id;
        var mouse_mode = document.getElementById(id).getAttribute("mouse_mode");
        if (mouse_mode !== "Click") {
            return true;
        }

        var clickProgress = $("#" + id).attr("click_progress");
        if ("inProgress" === clickProgress) {
            return false;
        }

        $("#" + id).attr("click_progress", "inProgress");
        renderJs.showLoading(id);
        var oRequest = new DBRequest(document.getElementById(id));
        oRequest.SetValue("01");
        if (oRequest.SetQuery()) {
            var frequency = document.getElementById(id).getAttribute("frequency");
            setTimeout(renderJs.resetPushButtonValue, parseInt(frequency), oTarget);
            return true;
        }
        return false;
    }
    renderJs.resetPushButtonValue = function (oTarget) {
        var id = oTarget.id;
        renderJs.showLoading(id);
        $("#" + id).removeAttr("click_progress");
        var oRequest = new DBRequest(document.getElementById(id));
        oRequest.SetValue("00");
        if (oRequest.SetQuery()) {
            return true;
        }
        return false;
    }

    renderJs.onPushButtonDown = function (oTarget) {
        var id = oTarget.id;
        var mouse_mode = document.getElementById(id).getAttribute("mouse_mode");
        if (mouse_mode !== "Hold") {
            return true;
        }
        var isWaiting = $("#" + id).attr("pushdown_time");
        if (!isWaiting || isWaiting === "-1") {
            renderJs.showLoading(id);
            $("#" + id).attr("pushdown_time", Date.parse(new Date()));
            var pushbuttonIntervalId = setInterval(renderJs.setPushButtonValue, 40, oTarget);
            $("#" + id).attr("push_button_interval_id", pushbuttonIntervalId);
        }
    }
    renderJs.setPushButtonValue = function (oTarget) {
        var id = oTarget.id;
        var oRequest = new DBRequest(document.getElementById(id));
        oRequest.SetValue("01");
        if (oRequest.SetQuery()) {
            return true;
        }
        return false;
    }
    renderJs.onPushButtonUp = function (oTarget) {
        var id = oTarget.id;
        var mouse_mode = document.getElementById(id).getAttribute("mouse_mode");
        var pushbuttonIntervalId = $("#" + id).attr("push_button_interval_id");
        if (mouse_mode !== "Hold" || pushbuttonIntervalId === "" || pushbuttonIntervalId === undefined) {
            return true;
        }

        /**hold mode, pushButtonUp will holding at lease 1 second */
        var pushButtonDelayTime = 500;
        var isInDelay = $("#" + id).attr("in_delay");
        if (isInDelay === "on") {
            return;
        }
        var pushDownTime = $("#" + id).attr("pushdown_time");
        if (pushDownTime && pushDownTime > 0) {
            $("#" + id).css("cursor", "default");
            var current = Date.parse(new Date());
            var executeTime = current - pushDownTime;
            if (executeTime < pushButtonDelayTime) {
                renderJs.showLoading(id);
                $("#" + id).attr("in_delay", "on");
                setTimeout(function () {
                    renderJs.doPushButtonUp(id);
                }, pushButtonDelayTime - executeTime);
            } else {
                //local mode
                return renderJs.doPushButtonUp(id);
            }
        } else {
            return true;
        }
    }
    renderJs.doPushButtonUp = function (id) {
        var pushbuttonIntervalId = $("#" + id).attr("push_button_interval_id");
        clearInterval(pushbuttonIntervalId);
        $("#" + id).attr("push_button_interval_id", "");
        $("#" + id).attr("pushdown_time", -1);
        $("#" + id).attr("in_delay", "off");
        var oRequest = new DBRequest(document.getElementById(id));
        oRequest.SetValue("00");
        if (oRequest.SetQuery()) {
            return true;
        }
        return false;
    }
    var g_iTouchDisableFlag = 1;
    renderJs.FuncTouchDown = function (oTarget) {
        g_iTouchDisableFlag = 0;
        renderJs.onPushButtonDown(oTarget);
    }
    renderJs.FuncTouchUp = function (oTarget) {
        g_iTouchDisableFlag = 0;
        renderJs.onPushButtonUp(oTarget);
    }
    renderJs.FuncMouseDown = function (oTarget) {
        if (g_iTouchDisableFlag) {
            renderJs.onPushButtonDown(oTarget);
        }
    }
    renderJs.FuncMouseUp = function (oTarget) {
        if (g_iTouchDisableFlag) {
            renderJs.onPushButtonUp(oTarget);
        }
    }
    //--push button end----------------


    //end renderJs Obj
    return renderJs;
})();

/**
 * AnalogBar callback
 * */
function _callback_loadAnalogBarComponent() {
    var id = this.m_sShowParam;
    var maxVal = parseFloat($("#" + id).attr("max_val"));
    var minVal = parseFloat($("#" + id).attr("min_val"));

    var blockFormat = $("#" + id).attr("block_format");
    var accessModeType = $("#" + id).attr("type");
    var value = renderJs.getValueByBlockFormat(blockFormat, accessModeType, this.m_sValue);
    value = renderJs.getFloatValueByDecimalPlace(id, value);
    value = (value > maxVal) ? maxVal : value;
    value = (value < minVal) ? minVal : value;
    renderJs.showAnalogBar(id, maxVal, minVal, value);
    $("#" + id).attr("title", (blockFormat + " [" + value + "]"));
}
/**
 * AnalogSlider callback
 * */
function _callback_loadAnalogSliderComponent() {
    var id = this.m_sShowParam;
    var blockFormat = $("#" + id).attr("block_format");
    var accessModeType = $("#" + id).attr("type");
    var value = renderJs.getValueByBlockFormat(blockFormat, accessModeType, this.m_sValue);
    value = renderJs.getFloatValueByDecimalPlace(id, value);
    if (STOP_SLIDER_REFERSH_ID != id) {
        $("#" + id + " div").children(".ui-slider-handle").attr("title", value);
        $("#" + id).children(".analog_slider_comp").rotateSlide("value", value);
        var spHeight = $("#" + id + " div").children(".ui-slider-handle").css("height");
        var sliderComWd = parseFloat($("#" + id).children(".analog_slider_comp").css("width"));
        var sliderhanWd = parseFloat($("#" + id + " div").children(".ui-slider-handle").css("width"));
//            $("#" + id).children(".analog_slider_comp").css("border-width", "1px")
//                    .css("margin-left", 0)
//                    .css("margin-right",0);
        $("#" + id).children(".analog_slider_comp").css("border-width", "1px");
        $("#" + id + " div").children(".ui-slider-handle")
                .css("left", ((sliderComWd - sliderhanWd - 2) / 2).toString() + "px")
                .css("margin-left", "0px")
                .css("font-size", "5px")
                .css("text-align", "center")
                .css("line-height", spHeight)
                .css("border-width", "1px");
    }
}
/**
 * AnalogDateTime callback
 * */
function _callback_showDateTime() {
    if (this.m_sValue && this.m_sValue.length == 12) {
        var sv = this.m_sValue;
        var sec = renderJs.getValueByBlockFormat("Unsigned", "2", sv.substr(0, 2)) + "";
        sec = (sec.length == 1) ? "0" + sec : sec;
        var date = "20" + sv.substr(2, 2) + " - " + sv.substr(4, 2) + " - " + sv.substr(6, 2);
        var time = sv.substr(8, 2) + ":" + sv.substr(10, 2) + ":" + sec;
        var dayNo = new Date(parseInt("20" + sv.substr(2, 2)), sv.substr(4, 2) - 1, sv.substr(6, 2)).getDay();
        if ($("#" + this.m_sShowParam).attr("time_format") === "hms") {
            $("#" + this.m_sShowParam + " .dayTime").html(time);
        } else {
            $("#" + this.m_sShowParam + " .dayTime").html(WEEKDAY[dayNo] + " " + time);
        }
        $("#" + this.m_sShowParam + " .date").html(date);
    } else {
        //error
        if ($("#" + this.m_sShowParam).attr("time_format") === "hms") {
            $("#" + this.m_sShowParam + " .dayTime").html("HH:mm:ss");
        } else {
            $("#" + this.m_sShowParam + " .dayTime").html("ddd. HH:mm:ss");
        }
        $("#" + this.m_sShowParam + " .date").html("yyyy-MM-dd");
        console.error("LWE runtime error: AnalogDateTimeComponent connect error!");
    }
}
/**
 * AnalogTime callback
 **/
function _callback_loadAnalogTimeComponent() {
    var id = this.m_sShowParam;
    var blockFormat = $("#" + id).attr("block_format");
    var accessModeType = $("#" + id).attr("type");
    //negative number: out of UnsignedValue range
    var signedValue = Unsigned2Signed(parseInt(this.m_sValue, 16), accessModeType);
    if (signedValue < 0) {
        console.log(signedValue);
        actVal = "unsupported data type";
        $("#" + id).children(".valueText").children(".inputVal").attr("placeholder", actVal);
        $("#" + id).attr("last_placeholder", actVal);
        return;
    }

    var actVal = "";
    var time_format = $("#" + id).attr("time_format");
    /* *
     * for [yearly] and [weekly] timer; 
     * time_format=Hex 
     * */
    if (time_format === "md") {//yearly month-day   
        actVal = renderJs.getMonthDayFormatTimeByVmVal(this.m_sValue);
    } else if (time_format === "hm") {//weekly hh:mm   
        actVal = renderJs.getWeeklyTimeFormatTimeByVmVal(this.m_sValue);
    }
    else {
        /**
         *  for [hour], [h:m], [h:m:s], [h:m:s.ms]; 
         * time_format = Unsigned (65535)
         * */
        var unsignedValue = renderJs.getValueByBlockFormat(blockFormat, accessModeType, this.m_sValue);
        if (unsignedValue <= 65535) {
            actVal = renderJs.getValueByBlockFormat(blockFormat, accessModeType, this.m_sValue);
            if (time_format === "m") {
                actVal = renderJs.getMinFormatTimeByVmVal(actVal);
            } else if (time_format === "s") {
                actVal = renderJs.getSecFormatTimeByVmVal(actVal);
            } else if (time_format === "ms") {
                actVal = renderJs.getMsFormatTimeByVmVal(actVal);
            }
        } else {
            /**out of range*/
            actVal = "unsupported data type";
        }
    }
    $("#" + id).children(".valueText").children(".inputVal").attr("placeholder", actVal);
    $("#" + id).attr("last_placeholder", actVal);
}
/**
 * digital callback
 **/
function _callback_loadCustomizedComponent() {
    var id = this.m_sShowParam;
    var ontext = document.getElementById(id).getAttribute("on_text");
    var offtext = document.getElementById(id).getAttribute("off_text");
    var onimage = document.getElementById(id).getAttribute("on_image");
    var offimage = document.getElementById(id).getAttribute("off_image");
    var lastValue = document.getElementById(id).getAttribute("last_value");
    var value = parseInt(this.m_sValue, 16);
    document.getElementById(id).value = value;//used to set value by click
    renderJs.hideLoadingGif($("#" + id + " p"));
    if (lastValue === value) {
        return;
    }
    document.getElementById(id).setAttribute('last_value', value);
    var showText = (value === 0) ? offtext : ontext;
    var showImage = (value === 0) ? offimage : onimage;
    if ($("#" + id + " p").length === 0) {
        document.getElementById(id).innerHTML = showText;
    } else {
        $("#" + id + " p").html(showText);
    }
    document.getElementById(id).style.backgroundImage = "url(" + getImageByProtocol(showImage) + ")";
}

/**
 * PushButton callback
 **/
function _callback_loadPushButton() {
    var id = this.m_sShowParam;
    var value = parseInt(this.m_sValue, 16);
    var lastValue = document.getElementById(id).getAttribute("last_value");

    var isWaiting = $("#" + id).attr("pushdown_time");
    if (!(isWaiting > 0)) {
        $("#" + id).css("cursor", "hand");
    }

    renderJs.hideLoadingGif($("#" + id + " p"));
    if (lastValue === value) {
        return;
    }
    var ontext = document.getElementById(id).getAttribute("on_text");
    var offtext = document.getElementById(id).getAttribute("off_text");
    var onimage = document.getElementById(id).getAttribute("on_image");
    var offimage = document.getElementById(id).getAttribute("off_image");

    var showText = (value === 0) ? offtext : ontext;
    var showImage = (value === 0) ? offimage : onimage;
    if ($("#" + id + " p").length === 0) {
        document.getElementById(id).innerHTML = showText;
    } else {
        $("#" + id + " p").html(showText);
    }
    document.getElementById(id).style.backgroundImage = "url(" + getImageByProtocol(showImage) + ")";
    $("#" + id).attr("last_value", value);
}

function getImageByProtocol(imageUrl) {
    //[https] - return image64 String
    //[http] - return image path
    if (isHttpsProtocol()) {
        var base64 = _imageMap.get(imageUrl);
        if (!base64) {
            return "Not_Found_Base64";
        }
        return base64;
    }
    return imageUrl;
}

function isHttpsProtocol() {
    // for test:   return ((window.location.protocol === "https:") || (window.location.pathname.indexOf("/https/") != -1));
    return ((window.location.protocol === "https:"));
}

// for user defined API: jump to another page
function jumpToLink(url) {
    var link = url + "?!App-Language=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_language");
    if (!isHttpsProtocol()) {
        //http
        link = link + "&Security-Hint=" + LocalStorage.Instance().Get(LOCAL_STORAGE_PREFIX + "_current_login_ref");
    }

    window.location.replace(link);
    return false;
}

/** 
 * Init page after all resource(img/video/...) loaded.
 * Empty method for compatibility
 * */
function loadPage() {
}