
function dv_rolloutManager(handlersDefsArray, baseHandler) {
    this.handle = function () {
        var errorsArr = [];

        var handler = chooseEvaluationHandler(handlersDefsArray);
        if (handler) {
            var errorObj = handleSpecificHandler(handler);
            if (errorObj === null) {
                return errorsArr;
            }
            else {
                var debugInfo = handler.onFailure();
                if (debugInfo) {
                    for (var key in debugInfo) {
                        if (debugInfo.hasOwnProperty(key)) {
                            if (debugInfo[key] !== undefined || debugInfo[key] !== null) {
                                errorObj[key] = encodeURIComponent(debugInfo[key]);
                            }
                        }
                    }
                }
                errorsArr.push(errorObj);
            }
        }

        var errorObjHandler = handleSpecificHandler(baseHandler);
        if (errorObjHandler) {
            errorObjHandler['dvp_isLostImp'] = 1;
            errorsArr.push(errorObjHandler);
        }
        return errorsArr;
    };

    function handleSpecificHandler(handler) {
        var request;
        var errorObj = null;

        try {
            request = handler.createRequest();
            if (request && !request.isSev1) {
                var url = request.url || request;
                if (url) {
                    if (!handler.sendRequest(url)) {
                        errorObj = createAndGetError('sendRequest failed.',
                            url,
                            handler.getVersion(),
                            handler.getVersionParamName(),
                            handler.dv_script);
                    }
                } else {
                    errorObj = createAndGetError('createRequest failed.',
                        url,
                        handler.getVersion(),
                        handler.getVersionParamName(),
                        handler.dv_script,
                        handler.dvScripts,
                        handler.dvStep,
                        handler.dvOther
                    );
                }
            }
        }
        catch (e) {
            errorObj = createAndGetError(e.name + ': ' + e.message, request ? (request.url || request) : null, handler.getVersion(), handler.getVersionParamName(), (handler ? handler.dv_script : null));
        }

        return errorObj;
    }

    function createAndGetError(error, url, ver, versionParamName, dv_script, dvScripts, dvStep, dvOther) {
        var errorObj = {};
        errorObj[versionParamName] = ver;
        errorObj['dvp_jsErrMsg'] = encodeURIComponent(error);
        if (dv_script && dv_script.parentElement && dv_script.parentElement.tagName && dv_script.parentElement.tagName == 'HEAD') {
            errorObj['dvp_isOnHead'] = '1';
        }
        if (url) {
            errorObj['dvp_jsErrUrl'] = url;
        }
        if (dvScripts) {
            var dvScriptsResult = '';
            for (var id in dvScripts) {
                if (dvScripts[id] && dvScripts[id].src) {
                    dvScriptsResult += encodeURIComponent(dvScripts[id].src) + ":" + dvScripts[id].isContain + ",";
                }
            }
            
            
            
        }
        return errorObj;
    }

    function chooseEvaluationHandler(handlersArray) {
        var config = window._dv_win.dv_config;
        var index = 0;
        var isEvaluationVersionChosen = false;
        if (config.handlerVersionSpecific) {
            for (var i = 0; i < handlersArray.length; i++) {
                if (handlersArray[i].handler.getVersion() == config.handlerVersionSpecific) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }
        else if (config.handlerVersionByTimeIntervalMinutes) {
            var date = config.handlerVersionByTimeInputDate || new Date();
            var hour = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            index = Math.floor(((hour * 60) + minutes) / config.handlerVersionByTimeIntervalMinutes) % (handlersArray.length + 1);
            if (index != handlersArray.length) { 
                isEvaluationVersionChosen = true;
            }
        }
        else {
            var rand = config.handlerVersionRandom || (Math.random() * 100);
            for (var i = 0; i < handlersArray.length; i++) {
                if (rand >= handlersArray[i].minRate && rand < handlersArray[i].maxRate) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }

        if (isEvaluationVersionChosen == true && handlersArray[index].handler.isApplicable()) {
            return handlersArray[index].handler;
        }
        else {
            return null;
        }
    }
}

function doesBrowserSupportHTML5Push() {
    "use strict";
    return typeof window.parent.postMessage === 'function' && window.JSON;
}

function dv_GetParam(url, name, checkFromStart) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = (checkFromStart ? "(?:\\?|&|^)" : "[\\?&]") + name + "=([^&#]*)";
    var regex = new RegExp(regexS, 'i');
    var results = regex.exec(url);
    if (results == null)
        return null;
    else
        return results[1];
}

function dv_Contains(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function dv_GetDynamicParams(url, prefix) {
    try {
        prefix = (prefix != undefined && prefix != null) ? prefix : 'dvp';
        var regex = new RegExp("[\\?&](" + prefix + "_[^&]*=[^&#]*)", "gi");
        var dvParams = regex.exec(url);

        var results = [];
        while (dvParams != null) {
            results.push(dvParams[1]);
            dvParams = regex.exec(url);
        }
        return results;
    }
    catch (e) {
        return [];
    }
}

function dv_createIframe() {
    var iframe;
    if (document.createElement && (iframe = document.createElement('iframe'))) {
        iframe.name = iframe.id = 'iframe_' + Math.floor((Math.random() + "") * 1000000000000);
        iframe.width = 0;
        iframe.height = 0;
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
    }

    return iframe;
}

function dv_GetRnd() {
    return ((new Date()).getTime() + "" + Math.floor(Math.random() * 1000000)).substr(0, 16);
}

function dv_SendErrorImp(serverUrl, errorsArr) {

    for (var j = 0; j < errorsArr.length; j++) {
        var errorObj = errorsArr[j];
        var errorImp =   dv_CreateAndGetErrorImp(serverUrl, errorObj);
        dv_sendImgImp(errorImp);
    }
}

function dv_CreateAndGetErrorImp(serverUrl, errorObj) {
    var errorQueryString = '';
    for (key in errorObj) {
        if (errorObj.hasOwnProperty(key)) {
            if (key.indexOf('dvp_jsErrUrl') == -1) {
                errorQueryString += '&' + key + '=' + errorObj[key];
            }
            else {
                var params = ['ctx', 'cmp', 'plc', 'sid'];
                for (var i = 0; i < params.length; i++) {
                    var pvalue = dv_GetParam(errorObj[key], params[i]);
                    if (pvalue) {
                        errorQueryString += '&dvp_js' + params[i] + '=' + pvalue;
                    }
                }
            }
        }
    }

    var sslFlag = '&ssl=1';
    var errorImp = 'https://' + serverUrl + sslFlag + errorQueryString;

    return errorImp;
}

function dv_getDVUniqueKey(elm) {
    return elm && elm.getAttribute('data-uk');
}

function dv_getDVErrorGlobalScope(elm) {
    var uniqueKey = dv_getDVUniqueKey(elm);
    return uniqueKey && window._dv_win && window._dv_win[uniqueKey] && window._dv_win[uniqueKey].globalScopeVerifyErrorHandler || {};
}

function dv_onLoad(evt) {
    var elm = evt && evt.target || {};
    var globalScope = dv_getDVErrorGlobalScope(elm);
    if (globalScope) {
        var scriptSRC = dv_getScriptSRC(elm);
        if (!globalScope.isJSONPCalled) {
            setTimeout(function onTimeout(){
                globalScope.onTimeout(scriptSRC);
            }, globalScope.msTillJSONPCalled);
        }
    }
}

function dv_onResponse(evt) {
    var elm = evt && evt.target || {};
    var globalScope = dv_getDVErrorGlobalScope(elm);
    if (globalScope) {
        var scriptSRC = dv_getScriptSRC(elm);
        if (!globalScope.isJSONPCalled) {
            globalScope.onResponse(scriptSRC);
        }
    }
}

function dv_getScriptSRC(elm) {
    return elm && elm.src || '';
}
var IQPAParams = [
    "auprice", "ppid", "audeal", "auevent", "auadv", "aucmp", "aucrtv", "auorder", "ausite", "auplc", "auxch", "audvc", "aulitem",
    "auadid", "pltfrm", "aufilter1", "aufilter2", "autt", "auip", "aubndl", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9",
    "c10", "c11", "c12", "c13", "c14", "c15"
];

function dv_AppendIQPAParams(src) {
    var qs = [];
    var paramVal;
    IQPAParams.forEach(function forEachParam(paramName){
        paramVal = dv_GetParam(src, paramName);
        if (paramVal !== '' && paramVal !== null) {
            qs.push([paramName, paramVal].join('='));
        }
    });
    return qs.length && '&' + qs.join('&') || '';
}

function dv_onError(evt) {
    var elm = evt && evt.target || {};
    var globalScope = dv_getDVErrorGlobalScope(elm);
    if (globalScope) {
        globalScope.onError(dv_getScriptSRC(elm));
    }
}

function dv_getDVBSErrAddress(config) {
    return config && config.bsErrAddress || 'rtb0.doubleverify.com';
}

function dv_sendImgImp(url) {
    (new Image()).src = url;
}

function dv_sendScriptRequest(url, onLoad, onError, uniqueKey) {
    var emptyFunction = function(){};
    onLoad = onLoad || emptyFunction;
    onError = onError || emptyFunction;
    document.write('<scr' + 'ipt data-uk="' + uniqueKey + '" onerror="(' + onError + ')({target:this});" onload="(' + onLoad + ')({target:this});" type="text/javascript" src="' + url + '"></scr' + 'ipt>');
}

function dv_getPropSafe(obj, propName) {
    try {
        if (obj)
            return obj[propName];
    } catch (e) {
    }
}

function dvBsType() {
    var that = this;
    var eventsForDispatch = {};

    this.getEventsForDispatch = function getEventsForDispatch () {
        return eventsForDispatch;
    };

    var messageEventListener = function (event) {
        try {
            var timeCalled = getCurrentTime();
            var data = window.JSON.parse(event.data);
            if (!data.action) {
                data = window.JSON.parse(data);
            }
            if (data.timeStampCollection) {
                data.timeStampCollection.push({messageEventListenerCalled: timeCalled});
            }
            var myUID;
            var visitJSHasBeenCalledForThisTag = false;
            if ($dvbs.tags) {
                for (var uid in $dvbs.tags) {
                    if ($dvbs.tags.hasOwnProperty(uid) && $dvbs.tags[uid] && $dvbs.tags[uid].t2tIframeId === data.iFrameId) {
                        myUID = uid;
                        visitJSHasBeenCalledForThisTag = true;
                        break;
                    }
                }
            }

        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?flvr=0&ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tListener=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (ex) {
            }
        }
    };

    if (window.addEventListener)
        addEventListener("message", messageEventListener, false);
    else
        attachEvent("onmessage", messageEventListener);

    this.pubSub = new function () {

        var subscribers = [];

        this.subscribe = function (eventName, uid, actionName, func) {
            if (!subscribers[eventName + uid])
                subscribers[eventName + uid] = [];
            subscribers[eventName + uid].push({Func: func, ActionName: actionName});
        };

        this.publish = function (eventName, uid) {
            var actionsResults = [];
            if (eventName && uid && subscribers[eventName + uid] instanceof Array)
                for (var i = 0; i < subscribers[eventName + uid].length; i++) {
                    var funcObject = subscribers[eventName + uid][i];
                    if (funcObject && funcObject.Func && typeof funcObject.Func == "function" && funcObject.ActionName) {
                        var isSucceeded = runSafely(function () {
                            return funcObject.Func(uid);
                        });
                        actionsResults.push(encodeURIComponent(funcObject.ActionName) + '=' + (isSucceeded ? '1' : '0'));
                    }
                }
            return actionsResults.join('&');
        };
    };

    this.domUtilities = new function () {

        this.addImage = function (url, parentElement, trackingPixelCompleteCallbackName) {
            url = appendCacheBuster(url);
            if (typeof(navigator.sendBeacon) === 'function') {
                var isSuccessfullyQueuedDataForTransfer = navigator.sendBeacon(url);
                if (isSuccessfullyQueuedDataForTransfer && typeof(window[trackingPixelCompleteCallbackName]) === 'function') {
                    window[trackingPixelCompleteCallbackName]();
                }
                return;
            }

            var image = new Image();
            if (typeof(window[trackingPixelCompleteCallbackName]) === 'function') {
                image.addEventListener('load', window[trackingPixelCompleteCallbackName]);
            }
            image.src = url;
        };

        this.addScriptResource = function (url, parentElement, onLoad, onError, uniqueKey) {
            var emptyFunction = function(){};
            onLoad = onLoad || emptyFunction;
            onError = onError || emptyFunction;
            uniqueKey = uniqueKey || '';
            if (parentElement) {
                var scriptElem = parentElement.ownerDocument.createElement("script");
                scriptElem.onerror = onError;
                scriptElem.onload = onLoad;
                if (scriptElem && typeof(scriptElem.setAttribute) === 'function') {
                    scriptElem.setAttribute('data-uk', uniqueKey);
                }
                scriptElem.type = 'text/javascript';
                scriptElem.src = appendCacheBuster(url);
                parentElement.insertBefore(scriptElem, parentElement.firstChild);
            }
            else {
                addScriptResourceFallBack(url, onLoad, onError, uniqueKey);
            }
        };

        function addScriptResourceFallBack(url, onLoad, onError, uniqueKey) {
            var emptyFunction = function(){};
            onLoad = onLoad || emptyFunction;
            onError = onError || emptyFunction;
            uniqueKey = uniqueKey || '';
            var scriptElem = document.createElement('script');
            scriptElem.onerror = onError;
            scriptElem.onload = onLoad;
            if (scriptElem && typeof(scriptElem.setAttribute) === 'function') {
                scriptElem.setAttribute('data-uk', uniqueKey);
            }
            scriptElem.type = "text/javascript";
            scriptElem.src = appendCacheBuster(url);
            var firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(scriptElem, firstScript);
        }

        this.addScriptCode = function (srcCode, parentElement) {
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.innerHTML = srcCode;
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addHtml = function (srcHtml, parentElement) {
            var divElem = parentElement.ownerDocument.createElement("div");
            divElem.style = "display: inline";
            divElem.innerHTML = srcHtml;
            parentElement.insertBefore(divElem, parentElement.firstChild);
        };
    };

    this.resolveMacros = function (str, tag) {
        var viewabilityData = tag.getViewabilityData();
        var viewabilityBuckets = viewabilityData && viewabilityData.buckets ? viewabilityData.buckets : {};
        var upperCaseObj = objectsToUpperCase(tag, viewabilityData, viewabilityBuckets);
        var newStr = str.replace('[DV_PROTOCOL]', upperCaseObj.DV_PROTOCOL);
        newStr = newStr.replace('[PROTOCOL]', upperCaseObj.PROTOCOL);
        newStr = newStr.replace(/\[(.*?)\]/g, function (match, p1) {
            var value = upperCaseObj[p1];
            if (value === undefined || value === null)
                value = '[' + p1 + ']';
            return encodeURIComponent(value);
        });
        return newStr;
    };

    this.settings = new function () {
    };

    this.tagsType = function () {
    };

    this.tagsPrototype = function () {
        this.add = function (tagKey, obj) {
            if (!that.tags[tagKey])
                that.tags[tagKey] = new that.tag();
            for (var key in obj)
                that.tags[tagKey][key] = obj[key];
        };
    };

    this.tagsType.prototype = new this.tagsPrototype();
    this.tagsType.prototype.constructor = this.tags;
    this.tags = new this.tagsType();

    this.tag = function () {
    };
    this.tagPrototype = function () {
        this.set = function (obj) {
            for (var key in obj)
                this[key] = obj[key];
        };

        this.getViewabilityData = function () {
        };
    };

    this.tag.prototype = new this.tagPrototype();
    this.tag.prototype.constructor = this.tag;

    this.getTagObjectByService = function (serviceName) {

        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] === 'object'
                && this.tags[impressionId].services
                && this.tags[impressionId].services[serviceName]
                && !this.tags[impressionId].services[serviceName].isProcessed) {
                this.tags[impressionId].services[serviceName].isProcessed = true;
                return this.tags[impressionId];
            }
        }


        return null;
    };

    this.addService = function (impressionId, serviceName, paramsObject) {

        if (!impressionId || !serviceName)
            return;

        if (!this.tags[impressionId])
            return;
        else {
            if (!this.tags[impressionId].services)
                this.tags[impressionId].services = {};

            this.tags[impressionId].services[serviceName] = {
                params: paramsObject,
                isProcessed: false
            };
        }
    };

    this.Enums = {
        BrowserId: {Others: 0, IE: 1, Firefox: 2, Chrome: 3, Opera: 4, Safari: 5},
        TrafficScenario: {OnPage: 1, SameDomain: 2, CrossDomain: 128}
    };

    this.CommonData = {};

    var runSafely = function (action) {
        try {
            var ret = action();
            return ret !== undefined ? ret : true;
        } catch (e) {
            return false;
        }
    };

    var objectsToUpperCase = function () {
        var upperCaseObj = {};
        for (var i = 0; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    upperCaseObj[key.toUpperCase()] = obj[key];
                }
            }
        }
        return upperCaseObj;
    };

    var appendCacheBuster = function (url) {
        if (url !== undefined && url !== null && url.match("^http") == "http") {
            if (url.indexOf('?') !== -1) {
                if (url.slice(-1) == '&')
                    url += 'cbust=' + dv_GetRnd();
                else
                    url += '&cbust=' + dv_GetRnd();
            }
            else
                url += '?cbust=' + dv_GetRnd();
        }
        return url;
    };

    
    var messagesClass = function () {
        var waitingMessages = [];

        this.registerMsg = function(dvFrame, data) {
            if (!waitingMessages[dvFrame.$frmId]) {
                waitingMessages[dvFrame.$frmId] = [];
            }

            waitingMessages[dvFrame.$frmId].push(data);

            if (dvFrame.$uid) {
                sendWaitingEventsForFrame(dvFrame, dvFrame.$uid);
            }
        };

        this.startSendingEvents = function(dvFrame, impID) {
            sendWaitingEventsForFrame(dvFrame, impID);
            
        };

        function sendWaitingEventsForFrame(dvFrame, impID) {
            if (waitingMessages[dvFrame.$frmId]) {
                var eventObject = {};
                for (var i = 0; i < waitingMessages[dvFrame.$frmId].length; i++) {
                    var obj = waitingMessages[dvFrame.$frmId].pop();
                    for (var key in obj) {
                        if (typeof obj[key] !== 'function' && obj.hasOwnProperty(key)) {
                            eventObject[key] = obj[key];
                        }
                    }
                }
                that.registerEventCall(impID, eventObject);
            }
        }

        function startMessageManager() {
            for (var frm in waitingMessages) {
                if (frm && frm.$uid) {
                    sendWaitingEventsForFrame(frm, frm.$uid);
                }
            }
            setTimeout(startMessageManager, 10);
        }
    };
    this.messages = new messagesClass();

    this.dispatchRegisteredEventsFromAllTags = function () {
        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] !== 'function' && typeof this.tags[impressionId] !== 'undefined')
                dispatchEventCalls(impressionId, this);
        }
    };

    var dispatchEventCalls = function (impressionId, dvObj) {
        var tag = dvObj.tags[impressionId];
        var eventObj = eventsForDispatch[impressionId];
        if (typeof eventObj !== 'undefined' && eventObj != null) {
            var url = 'https://' + tag.ServerPublicDns + "/bsevent.gif?flvr=0&impid=" + impressionId + '&' + createQueryStringParams(eventObj);
            dvObj.domUtilities.addImage(url, tag.tagElement.parentElement);
            eventsForDispatch[impressionId] = null;
        }
    };

    this.registerEventCall = function (impressionId, eventObject, timeoutMs) {
        addEventCallForDispatch(impressionId, eventObject);

        if (typeof timeoutMs === 'undefined' || timeoutMs == 0 || isNaN(timeoutMs))
            dispatchEventCallsNow(this, impressionId, eventObject);
        else {
            if (timeoutMs > 2000)
                timeoutMs = 2000;

            var dvObj = this;
            setTimeout(function () {
                dispatchEventCalls(impressionId, dvObj);
            }, timeoutMs);
        }
    };

    this.createEventCallUrl = function(impId, eventObject) {
        var tag = this.tags && this.tags[impId];
        if (tag && typeof eventObject !== 'undefined' && eventObject !== null) {
            return ['https://', tag.ServerPublicDns, '/bsevent.gif?flvr=0&impid=', impId, '&', createQueryStringParams(eventObject)].join('');
        }
    }

    var dispatchEventCallsNow = function (dvObj, impressionId, eventObject) {
        addEventCallForDispatch(impressionId, eventObject);
        dispatchEventCalls(impressionId, dvObj);
    };

    var addEventCallForDispatch = function (impressionId, eventObject) {
        for (var key in eventObject) {
            if (typeof eventObject[key] !== 'function' && eventObject.hasOwnProperty(key)) {
                if (!eventsForDispatch[impressionId])
                    eventsForDispatch[impressionId] = {};
                eventsForDispatch[impressionId][key] = eventObject[key];
            }
        }
    };

    if (window.addEventListener) {
        window.addEventListener('unload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.addEventListener('beforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
        window.attachEvent('onbeforeunload', function () {
            that.dispatchRegisteredEventsFromAllTags();
        }, false);
    }
    else {
        window.document.body.onunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
        window.document.body.onbeforeunload = function () {
            that.dispatchRegisteredEventsFromAllTags();
        };
    }

    var createQueryStringParams = function (values) {
        var params = '';
        for (var key in values) {
            if (typeof values[key] !== 'function') {
                var value = encodeURIComponent(values[key]);
                if (params === '')
                    params += key + '=' + value;
                else
                    params += '&' + key + '=' + value;
            }
        }

        return params;
    };
}


var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(h,w,u){h!=Array.prototype&&h!=Object.prototype&&(h[w]=u.value)};$jscomp.getGlobal=function(h){return"undefined"!=typeof window&&window===h?h:"undefined"!=typeof global&&null!=global?global:h};$jscomp.global=$jscomp.getGlobal(this);$jscomp.SYMBOL_PREFIX="jscomp_symbol_";
$jscomp.initSymbol=function(){$jscomp.initSymbol=function(){};$jscomp.global.Symbol||($jscomp.global.Symbol=$jscomp.Symbol)};$jscomp.Symbol=function(){var h=0;return function(w){return $jscomp.SYMBOL_PREFIX+(w||"")+h++}}();
$jscomp.initSymbolIterator=function(){$jscomp.initSymbol();var h=$jscomp.global.Symbol.iterator;h||(h=$jscomp.global.Symbol.iterator=$jscomp.global.Symbol("iterator"));"function"!=typeof Array.prototype[h]&&$jscomp.defineProperty(Array.prototype,h,{configurable:!0,writable:!0,value:function(){return $jscomp.arrayIterator(this)}});$jscomp.initSymbolIterator=function(){}};$jscomp.arrayIterator=function(h){var w=0;return $jscomp.iteratorPrototype(function(){return w<h.length?{done:!1,value:h[w++]}:{done:!0}})};
$jscomp.iteratorPrototype=function(h){$jscomp.initSymbolIterator();h={next:h};h[$jscomp.global.Symbol.iterator]=function(){return this};return h};$jscomp.iteratorFromArray=function(h,w){$jscomp.initSymbolIterator();h instanceof String&&(h+="");var u=0,p={next:function(){if(u<h.length){var B=u++;return{value:w(B,h[B]),done:!1}}p.next=function(){return{done:!0,value:void 0}};return p.next()}};p[Symbol.iterator]=function(){return p};return p};
$jscomp.polyfill=function(h,w,u,p){if(w){u=$jscomp.global;h=h.split(".");for(p=0;p<h.length-1;p++){var B=h[p];B in u||(u[B]={});u=u[B]}h=h[h.length-1];p=u[h];w=w(p);w!=p&&null!=w&&$jscomp.defineProperty(u,h,{configurable:!0,writable:!0,value:w})}};$jscomp.polyfill("Array.prototype.keys",function(h){return h?h:function(){return $jscomp.iteratorFromArray(this,function(h){return h})}},"es6","es3");
function dv_baseHandler(){function h(b){var c=window._dv_win,f=0;try{for(;10>f;){if(c[b]&&"object"===typeof c[b])return!0;if(c==c.parent)break;f++;c=c.parent}}catch(e){}return!1}function w(b){var c=0,f;for(f in b)b.hasOwnProperty(f)&&++c;return c}function u(b,c){a:{var f={};try{if(b&&b.performance&&b.performance.getEntries){var e=b.performance.getEntries();for(b=0;b<e.length;b++){var d=e[b],q=d.name.match(/.*\/(.+?)\./);if(q&&q[1]){var g=q[1].replace(/\d+$/,""),k=c[g];if(k){for(var h=0;h<k.stats.length;h++){var r=
k.stats[h];f[k.prefix+r.prefix]=Math.round(d[r.name])}delete c[g];if(!w(c))break}}}}var m=f;break a}catch(C){}m=void 0}if(m&&w(m))return m}function p(b,c){function f(b){var d=r,c;for(c in b)b.hasOwnProperty(c)&&(d+=["&"+c,"="+b[c]].join(""));return d}function e(){return Date.now?Date.now():(new Date).getTime()}function d(){if(!w){w=!0;var d=f({dvp_injd:1});$dvbs.domUtilities.addImage(d,document.body);d="https://cdn.doubleverify.com/dvtp_src.js#tagtype=video";var c="ctx cmp plc sid adsrv adid crt advid prr dup turl iframe ad vssd apifw vstvr tvcp ppid auip pltfrm gdpr gdpr_consent adu invs litm ord sadv scrt vidreg seltag splc spos sup unit dvtagver msrapi vfwctx auprice audeal auevent auadv aucmp aucrtv auorder ausite auplc auxch audvc aulitem auadid autt c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 aufilter1 aufilter2 ppid".split(" ");
for(i=0;i<c.length;i++){var g=c[i],q=k(b,g);void 0!==q&&(d+=["&",g,"=",encodeURIComponent(q)].join(""))}d+="&gmnpo="+("1"==b.gmnpo?"1":"0");d+="&dvp_dvtpts="+e();d+="&bsimpid="+h;void 0!==b.dvp_aubndl&&(d+="&aubndl="+encodeURIComponent(b.dvp_aubndl));for(var m in b)b.hasOwnProperty(m)&&m.match(/^dvpx?_/i)&&b[m]&&(d+=["&",m.toLocaleLowerCase(),"=",encodeURIComponent(b[m])].join(""));$dvbs.domUtilities.addScriptResource(d,document.body)}}function q(b){var d={};d[b]=e();b=f(d);$dvbs.domUtilities.addImage(b,
document.body)}function g(b,d){-1<l.indexOf(b)?q(d):u.subscribe(function(){q(d)},b)}function k(b,d){d=d.toLowerCase();for(tmpKey in b)if(tmpKey.toLowerCase()===d)return b[tmpKey];return null}var h=b.impressionId,r=window._dv_win.dv_config.bsEventJSURL?window._dv_win.dv_config.bsEventJSURL:"https://"+b.ServerPublicDns+"/bsevent.gif";r+="?flvr=0&impid="+encodeURIComponent(h);var m=f({dvp_innovidImp:1}),C="responseReceived_"+h,v=b.DVP_DCB||b.DVP_DECISION_CALLBACK,n=k(b,"adid"),t=function(b){var d=b;
switch(b){case 5:d=1;break;case 6:d=2}return d}(c.ResultID),w=!1;$dvbs.domUtilities.addImage(m,document.body);if("function"===typeof window[v]){var y=!1;setTimeout(function(){var b=f({dvp_wasCallbackCalled:y});$dvbs.domUtilities.addImage(b,document.body)},1E3);window[C]=function(b,c,g,q,k,m,n){y=!0;try{if(n){var h=f({dvp_stat:n});$dvbs.domUtilities.addImage(h,document.body)}else{h=f({dvp_r9:e()});$dvbs.domUtilities.addImage(h,document.body);g="&dvp_cStartTS="+g+"&dvp_cEndTS="+q+"&dvp_dReceivedTS="+
k+"&dvp_wasAdPlayed="+b;q=t;if(!c)switch(q=2,t){case 1:var l=21;break;case 2:l=20;break;case 3:l=22;break;case 4:l=23}c={bres:q,dvp_blkDecUsed:c?"1":"0"};l&&(c.breason=l);h=f(c)+g;$dvbs.domUtilities.addImage(h,document.body,m);b&&!I()&&d()}}catch(N){b=f({dvp_innovidCallbackEx:1,dvp_innovidCallbackExMsg:N}),$dvbs.domUtilities.addImage(b,document.body)}};try{var p=f({dvp_r8:e()});$dvbs.domUtilities.addImage(p,document.body);window[v](t,C)}catch(E){c=f({dvp_innovidEx:1,dvp_innovidExMsg:E}),$dvbs.domUtilities.addImage(c,
document.body)}}else c=f({dvp_innovidNoCallback:1}),$dvbs.domUtilities.addImage(c,document.body);try{var u=window[n]();if(u.getPreviousEvents&&"function"===typeof u.getPreviousEvents){p=f({dvp_r10:e()});$dvbs.domUtilities.addImage(p,document.body);var l=u.getPreviousEvents(),x=0;-1<l.indexOf("AdStarted")?(x=1,d()):u.subscribe(d,"AdStarted");p=f({dvp_innovidAdStarted:x,dvp_innovidPrevEvents:l});$dvbs.domUtilities.addImage(p,document.body);g("AdError","dvp_ader");g("AdStopped","dvp_adst");g("AdVideoStart",
"dvp_avse");g("AdImpression","dvp_aie")}else x=f({dvp_innovidCallbackEx:3,dvp_innovidCallbackExMsg:"vpaidWrapper.getPreviousEvents not a function"}),$dvbs.domUtilities.addImage(x,document.body)}catch(E){x=f({dvp_innovidCallbackEx:2,dvp_innovidCallbackExMsg:E,dvp_adid:n}),$dvbs.domUtilities.addImage(x,document.body)}}function B(b,c){try{$dvbs.registerEventCall(b,{dvp_te_exec:O.RTN}),Object.keys(c).length&&c.forEach(function(c){c.actions&&c.actions.length?c.actions.forEach(function(e){$dvbs.pubSub.subscribe(c.eventName,
b,"RTN_"+c.eventName,function(){e.url&&e.actionType&&("image"===e.actionType?navigator.sendBeacon(e.url):"javascript"===e.actionType&&$dvbs.domUtilities.addScriptResource(e.url,document.body))})}):$dvbs.registerEventCall(b,{dvp_rtnError:1,dvp_errMsg:"Malformed or empty RTN object"})})}catch(f){$dvbs.registerEventCall(b,{dvp_rtnError:1,dvp_errMsg:encodeURIComponent(f.message)})}}function P(b){var c,f=window._dv_win.document.visibilityState;window[b.tagObjectCallbackName]=function(e){var d=window._dv_win.$dvbs;
d&&(c=e.ImpressionID,d.tags.add(e.ImpressionID,b),d.tags[e.ImpressionID].set({tagElement:b.script,impressionId:e.ImpressionID,dv_protocol:b.protocol,protocol:"https:",uid:b.uid,serverPublicDns:e.ServerPublicDns,ServerPublicDns:e.ServerPublicDns}),b.script&&b.script.dvFrmWin&&(b.script.dvFrmWin.$uid=e.ImpressionID,d.messages&&d.messages.startSendingEvents&&d.messages.startSendingEvents(b.script.dvFrmWin,e.ImpressionID)),function(){function b(){var c=window._dv_win.document.visibilityState;"prerender"===
f&&"prerender"!==c&&"unloaded"!==c&&(f=c,window._dv_win.$dvbs.registerEventCall(e.ImpressionID,{prndr:0}),window._dv_win.document.removeEventListener(d,b))}if("prerender"===f)if("prerender"!==window._dv_win.document.visibilityState&&"unloaded"!==visibilityStateLocal)window._dv_win.$dvbs.registerEventCall(e.ImpressionID,{prndr:0});else{var d;"undefined"!==typeof window._dv_win.document.hidden?d="visibilitychange":"undefined"!==typeof window._dv_win.document.mozHidden?d="mozvisibilitychange":"undefined"!==
typeof window._dv_win.document.msHidden?d="msvisibilitychange":"undefined"!==typeof window._dv_win.document.webkitHidden&&(d="webkitvisibilitychange");window._dv_win.document.addEventListener(d,b,!1)}}());if("1"!=b.foie)try{var q=u(window,{verify:{prefix:"vf",stats:[{name:"duration",prefix:"dur"}]}});q&&window._dv_win.$dvbs.registerEventCall(e.ImpressionID,q)}catch(g){}};window[b.callbackName]=function(e){z.setIsJSONPCalled(!0);var d=window._dv_win.$dvbs&&"object"==typeof window._dv_win.$dvbs.tags[c]?
window._dv_win.$dvbs.tags[c]:b;var f=window._dv_win.dv_config.bs_renderingMethod||function(b){document.write(b)};"2"!=d.tagformat||void 0===d.DVP_DCB&&void 0===d.DVP_DECISION_CALLBACK||p(d,e);switch(e.ResultID){case 1:d.tagPassback?f(d.tagPassback):e.Passback?f(decodeURIComponent(e.Passback)):e.AdWidth&&e.AdHeight&&f(decodeURIComponent("%3Cdiv%20style%3D%22display%3A%20flex%3B%20align-items%3A%20center%3B%20justify-content%3A%20center%3B%20width%3A%20"+e.AdWidth+"px%3B%20height%3A%20"+e.AdHeight+
"px%3B%20outline-offset%3A%20-1px%3B%20background%3A%20url('data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAAGWvHq%2BAAAABmJLR0QA%2FwD%2FAP%2BgvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AQBECEbFuFN7gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAFBklEQVRo3uUby3arOEzxAbxIyKLt%2F%2F9gIQtIF4aFZ5ERVxhJyIbcnjmjTZLast4vQ%2BG762OMMX53fQzTFIfxGenfKvgXvj4%2FoOsfy3eECgBgmmcYhnFZ6PoHeO%2F%2FbBiGEQAAxufPghlC%2BLOBYqa%2FHezAJcYYOUz87QAA7vd2g4lMAsrLfQJ%2BQeUM43PZsMJEwN8L58gMfgIAAMVKv6syX4bxGVF9qTiuvV2Byouf7e0Kl%2B%2Buj6kJU8aktV07aFClTkThfm9hGMbNGu53dCNd%2FPr8gBCm5TsnAivz%2BPwBqkHvPaDiVvpAW6Nh0FBhmpagSdfQV0Q7oVySPrz3LyO3t%2BvCKrJIHTtdG58%2FvLycZk%2Bzr1uFkgFWuYHKZHHNEMIr4lMb0pO5v7e3qyyj983KATYydv1jswFZneZ5wzaKVaEMVnNgjsw2B8pcbMdLmKbY1PVG5dTl0rVpnsGlSDReOcfo%2Bgc0df3SagrTPC8m4aDrH1ClaR4AgHKRmgN%2FL9HBbeI4wdKVitXUtYpLGXPSgpUg1lBaPzWCWW6wJ4lkB9aFUL1pQkXOvW9WBDltULNM8wwhTEtIcQn88t31kdpEU7FmOwsemqiiqtPsQvufXMCmCulUSKy9XaG9XYGrLhbv1iSlWU0NGdyQqlPKBHQfh0vxVkQ1abSQybX3oQ7nUPWUpEQ1oaokLVAnSfG4cy8xxpjrEFyVtuCJNt3rETDgu%2F6xiT9zRqKSci0DxzHdZ5E0zXabjGTtwSxr9FyqjazSJkmTi%2Bckb01BS5HaGnems%2BZWzdb62qQTfQdwDDl2Wj0RuKnYpX1sDrJljcvHTqow4%2FNn5SBNXYuzPD0Y8agDsRlpr3NIg1vyYGnSS%2BPUURVIcRhC2A0ZyYPxTKqNyuo8IYRlpMSGLYRJDRdOYyEEqEpDIIfY5qYhhLBrL0s%2BLS7imqq995tijYVdCxlx0EMnaW9XlvD93m4aZ0s4cZ3gqspYOjppRKcMcXipGZyU7Ju63iXIhVOKx53trCWqtMpwZzor8n%2BqynBnnlJlNGa5M51VSmlksBSDlOHlKk%2FzUq0KcVVEYgidytz3coS19lPrFh1y2fUP1Xu1HKsRxHWakao9hLNglZHeESaal3vvocKx3zKP7BXnLJtaxgNkjKY1Wp1y7inYUVG7Akg79vSeKefKwHJ1kEtTikBxJrYkmpIBr1TgPdgbrZ1WkPbuz84UEiNZG1ZLhdydE0sqeqlytGG2pEt4%2B0Ccc9H8zs4kS1Br0542F0fqR0lesOCwyehoIioZq86gqcWq6XbZwrTGqMSAhmOhKWVpjp74PObIsLt3R3g0g1oETs8R32woFbLEHUuEs9CiZa6SslZJmpcuf%2F4GcNc0tDf9lYcxvwGVrI3mkDVeY0NjbumOui9XCtkYlZJIbjt3pF8tzQ0czZTvTXnJSdlHSstRXAlPUpQ4vRy1TK4nnNEwaDTd2ZNE6fQSQiieevBiprjXLamjpco5Mv1YSuH%2Fpry4o%2BMPN70cgZI4tYyG7h3J4evzI1tJ%2BIynBLTHMdnlpXQKsTQCkoAaPakZEctL%2BpbK0Y7FMkloCnrXHMsKileMpS0ZR3zvveez2kDJG6szRiSuJqaulfbOaQJ5KfcYH5wnLK82v2uMCmHaPDz%2BDVj%2BfSNNBGdZmIu9v6EIKWbVZHTmVYrl9clSRVsS0urOKDdlW1J%2B6SubFoH3SiF13X8A3uobUgsAG3MAAAAASUVORK5CYII%3D')%20repeat%3B%20outline%3A%20solid%201px%20%23969696%3B%22%3E%3C%2Fdiv%3E"));
break;case 2:case 3:d.tagAdtag&&f(d.tagAdtag);break;case 4:e.AdWidth&&e.AdHeight&&f(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+e.AdWidth+"px%3B%20height%3A%20"+e.AdHeight+"px%3B%22%3E%09%0A%3C%2Fdiv%3E"))}e.ServerContext&&
e.ServerContext.rtn&&e.ServerContext.rtn.events&&B(c,e.ServerContext.rtn.events)}}function Q(b){var c=null,f=null,e=function(b){var d=dv_GetParam(b,"cmp");b=dv_GetParam(b,"ctx");return"919838"==b&&"7951767"==d||"919839"==b&&"7939985"==d||"971108"==b&&"7900229"==d||"971108"==b&&"7951940"==d?"</scr'+'ipt>":/<\/scr\+ipt>/g}(b.src);"function"!==typeof String.prototype.trim&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var d=function(b){!(b=b.previousSibling)||"#text"!=b.nodeName||
null!=b.nodeValue&&void 0!=b.nodeValue&&0!=b.nodeValue.trim().length||(b=b.previousSibling);if(b&&"SCRIPT"==b.tagName&&b.getAttribute("type")&&("text/adtag"==b.getAttribute("type").toLowerCase()||"text/passback"==b.getAttribute("type").toLowerCase())&&""!=b.innerHTML.trim()){if("text/adtag"==b.getAttribute("type").toLowerCase())return c=b.innerHTML.replace(e,"\x3c/script>"),{isBadImp:!1,hasPassback:!1,tagAdTag:c,tagPassback:f};if(null!=f)return{isBadImp:!0,hasPassback:!1,tagAdTag:c,tagPassback:f};
f=b.innerHTML.replace(e,"\x3c/script>");b=d(b);b.hasPassback=!0;return b}return{isBadImp:!0,hasPassback:!1,tagAdTag:c,tagPassback:f}};return d(b)}function I(){try{if("object"==typeof window.$ovv||"object"==typeof window.parent.$ovv)return 1}catch(b){}return 0}function J(b,c,f,e,d,q,g,k,w,r,m,C){c.dvregion=0;var v=dv_GetParam(l,"useragent");l=window._dv_win.$dvbs.CommonData;if(void 0!=l.BrowserId&&void 0!=l.BrowserVersion&&void 0!=l.BrowserIdFromUserAgent)var n={ID:l.BrowserId,version:l.BrowserVersion,
ID_UA:l.BrowserIdFromUserAgent};else n=R(v?decodeURIComponent(v):navigator.userAgent),l.BrowserId=n.ID,l.BrowserVersion=n.version,l.BrowserIdFromUserAgent=n.ID_UA;var t="";void 0!=c.aUrl&&(t="&aUrl="+c.aUrl);var p="";try{e.depth=S(e);var y=T(e,f,n);if(y&&y.duration){var u="&dvp_strhd="+y.duration;u+="&dvpx_strhd="+y.duration}y&&y.url||(y=U(e));y&&y.url&&(t="&aUrl="+encodeURIComponent(y.url),p="&aUrlD="+y.depth);var D=e.depth+d;q&&e.depth--}catch(E){u=p=t=D=e.depth=""}d=I();q=function(){function b(d){c++;
var e=d.parent==d;return d.mraid||e?d.mraid:20>=c&&b(d.parent)}var d=window._dv_win||window,c=0;try{return b(d)}catch(ea){}}();var l=c.script.src;d="&ctx="+(dv_GetParam(l,"ctx")||"")+"&cmp="+(dv_GetParam(l,"cmp")||"")+"&plc="+(dv_GetParam(l,"plc")||"")+"&sid="+(dv_GetParam(l,"sid")||"")+"&advid="+(dv_GetParam(l,"advid")||"")+"&adsrv="+(dv_GetParam(l,"adsrv")||"")+"&unit="+(dv_GetParam(l,"unit")||"")+"&isdvvid="+(dv_GetParam(l,"isdvvid")||"")+"&uid="+c.uid+"&tagtype="+(dv_GetParam(l,"tagtype")||"")+
"&adID="+(dv_GetParam(l,"adID")||"")+"&app="+(dv_GetParam(l,"app")||"")+"&sup="+(dv_GetParam(l,"sup")||"")+"&isovv="+d+"&gmnpo="+(dv_GetParam(l,"gmnpo")||"")+"&crt="+(dv_GetParam(l,"crt")||"");"1"==dv_GetParam(l,"foie")&&(d+="&foie=1");q&&(d+="&ismraid=1");(q=dv_GetParam(l,"xff"))&&(d+="&xff="+q);(q=dv_GetParam(l,"vssd"))&&(d+="&vssd="+q);(q=dv_GetParam(l,"apifw"))&&(d+="&apifw="+q);(q=dv_GetParam(l,"vstvr"))&&(d+="&vstvr="+q);(q=dv_GetParam(l,"tvcp"))&&(d+="&tvcp="+q);m&&(d+="&urlsrc=sf");C&&(d+=
"&sfe=1");navigator&&navigator.maxTouchPoints&&5==navigator.maxTouchPoints&&(d+="&touch=1");navigator&&navigator.platform&&(d+="&nav_pltfrm="+navigator.platform);u&&(d+=u);v&&(d+="&useragent="+v);n&&(d+="&brid="+n.ID+"&brver="+n.version+"&bridua="+n.ID_UA);d+="&dup="+dv_GetParam(l,"dup");try{d+=dv_AppendIQPAParams(l)}catch(E){}(m=dv_GetParam(l,"turl"))&&(d+="&turl="+m);(m=dv_GetParam(l,"tagformat"))&&(d+="&tagformat="+m);"video"===dv_GetParam(l,"tagtype")&&(d+="&DVP_BYPASS219=1");d+=V();r=r?"&dvf=0":
"";m=h("maple")?"&dvf=1":"";g=(window._dv_win.dv_config.verifyJSURL||"https://"+(window._dv_win.dv_config.bsAddress||"rtb"+c.dvregion+".doubleverify.com")+"/verify.js")+"?flvr=0&jsCallback="+c.callbackName+"&jsTagObjCallback="+c.tagObjectCallbackName+"&num=6"+d+"&srcurlD="+e.depth+"&ssl="+c.ssl+r+m+"&refD="+D+c.tagIntegrityFlag+c.tagHasPassbackFlag+"&htmlmsging="+(g?"1":"0")+"&tstype="+K(window._dv_win);(D=dv_GetDynamicParams(l,"dvp").join("&"))&&(g+="&"+D);(D=dv_GetDynamicParams(l,"dvpx").join("&"))&&
(g+="&"+D);if(!1===k||w)g=g+("&dvp_isBodyExistOnLoad="+(k?"1":"0"))+("&dvp_isOnHead="+(w?"1":"0"));f="srcurl="+encodeURIComponent(f);(k=W())&&(f+="&ancChain="+encodeURIComponent(k));(e=X(e))&&(f+="&canurl"+encodeURIComponent(e));e=4E3;/MSIE (\d+\.\d+);/.test(navigator.userAgent)&&7>=new Number(RegExp.$1)&&(e=2E3);if(k=dv_GetParam(l,"referrer"))k="&referrer="+k,g.length+k.length<=e&&(g+=k);(k=dv_GetParam(l,"prr"))&&(g+="&prr="+k);(k=dv_GetParam(l,"iframe"))&&(g+="&iframe="+k);(k=dv_GetParam(l,"gdpr"))&&
(g+="&gdpr="+k);(k=dv_GetParam(l,"gdpr_consent"))&&(g+="&gdpr_consent="+k);t.length+p.length+g.length<=e&&(g+=p,f+=t);(t=Y())&&(g+="&m1="+t);(t=Z())&&0<t.f&&(g+="&bsig="+t.f,g+="&usig="+t.s);t=aa();0<t&&(g+="&hdsig="+t);navigator&&navigator.hardwareConcurrency&&(g+="&noc="+navigator.hardwareConcurrency);g+=ba();t=ca();g+="&vavbkt="+t.vdcd;g+="&lvvn="+t.vdcv;""!=t.err&&(g+="&dvp_idcerr="+encodeURIComponent(t.err));"prerender"===window._dv_win.document.visibilityState&&(g+="&prndr=1");(l=dv_GetParam(l,
"wrapperurl"))&&1E3>=l.length&&g.length+l.length<=e&&(g+="&wrapperurl="+l);g+="&"+b.getVersionParamName()+"="+b.getVersion();b="&eparams="+encodeURIComponent(F(f));g=g.length+b.length<=e?g+b:g+"&dvf=3";window.performance&&window.performance.mark&&window.performance.measure&&window.performance.getEntriesByName&&(window.performance.mark("dv_create_req_end"),window.performance.measure("dv_creqte_req","dv_create_req_start","dv_create_req_end"),(b=window.performance.getEntriesByName("dv_creqte_req"))&&
0<b.length&&(g+="&dvp_exetime="+b[0].duration.toFixed(2)));for(var x in c)c.hasOwnProperty(x)&&void 0!==c[x]&&-1<["number","string"].indexOf(typeof c[x])&&-1===["protocol","callbackName","dvregion"].indexOf(x.toLowerCase())&&!x.match(/^tag[A-Z]/)&&!(new RegExp("(\\?|&)"+x+"=","gi")).test(g)&&(g+=["&",x,"=",encodeURIComponent(c[x])].join(""));return{isSev1:!1,url:g}}function V(){var b="";try{var c=window._dv_win.parent;b+="&chro="+(void 0===c.chrome?"0":"1");b+="&hist="+(c.history?c.history.length:
"");b+="&winh="+c.innerHeight;b+="&winw="+c.innerWidth;b+="&wouh="+c.outerHeight;b+="&wouw="+c.outerWidth;c.screen&&(b+="&scah="+c.screen.availHeight,b+="&scaw="+c.screen.availWidth)}catch(f){}return b}function ca(){var b=[],c=function(b){e(b,null!=b.AZSD,9);e(b,b.location.hostname!=b.encodeURIComponent(b.location.hostname),10);e(b,null!=b.cascadeWindowInfo,11);e(b,null!=b._rvz,32);e(b,null!=b.FO_DOMAIN,34);e(b,null!=b.va_subid,36);e(b,b._GPL&&b._GPL.baseCDN,40);e(b,f(b,"__twb__")&&f(b,"__twb_cb_"),
43);e(b,null!=b.landingUrl&&null!=b.seList&&null!=b.parkingPPCTitleElements&&null!=b.allocation,45);e(b,f(b,"_rvz",function(b){return null!=b.publisher_subid}),46);e(b,null!=b.cacildsFunc&&null!=b.n_storesFromFs,47);e(b,b._pcg&&b._pcg.GN_UniqueId,54);e(b,f(b,"__ad_rns_")&&f(b,"_$_"),64);e(b,null!=b.APP_LABEL_NAME_FULL_UC,71);e(b,null!=b._priam_adblock,81);e(b,b.supp_ads_host&&b.supp_ads_host_overridden,82);e(b,b.uti_xdmsg_manager&&b.uti_xdmsg_manager.cb,87);e(b,b.LogBundleData&&b.addIframe,91);e(b,
b.xAdsXMLHelperId||b.xYKAffSubIdTag,95);e(b,b.__pmetag&&b.__pmetag.uid,98);e(b,b.CustomWLAdServer&&/(n\d{1,4}adserv)|(1ads|cccpmo|epommarket|epmads|adshost1)/.test(b.supp_ads_host_overridden),100)},f=function(b,c,e){for(var d in b)if(-1<d.indexOf(c)&&(!e||e(b[d])))return!0;return!1},e=function(c,e,f){e&&-1==b.indexOf(f)&&b.push((c==window.top?-1:1)*f)};try{return function(){for(var b=window,e=0;10>e&&(c(b),b!=window.top);e++)try{b.parent.document&&(b=b.parent)}catch(g){break}}(),{vdcv:28,vdcd:b.join(","),
err:void 0}}catch(d){return{vdcv:28,vdcd:"-999",err:d.message||"unknown"}}}function S(b){for(var c=0;10>c&&b!=window._dv_win.top;)c++,b=b.parent;return c}function K(b){if(b==window._dv_win.top)return $dvbs.Enums.TrafficScenario.OnPage;try{for(var c=0;window._dv_win.top!=b&&10>=c;){var f=b.parent;if(!f.document)break;b=f;c++}}catch(e){}return b==window._dv_win.top?$dvbs.Enums.TrafficScenario.SameDomain:$dvbs.Enums.TrafficScenario.CrossDomain}function T(b,c,f){try{if(f.ID==$dvbs.Enums.BrowserId.IE||
K(b)!=$dvbs.Enums.TrafficScenario.CrossDomain)return null;b.performance&&b.performance.mark&&b.performance.mark("dv_str_html_start");if(c){var e=c.toString().match(/^(?:https?:\/\/)?[\w\-\.]+\/[a-zA-Z0-9]/gi);if(e&&0<e.length)return null}var d=b.document;if(d&&d.referrer){var h=d.referrer.replace(/\//g,"\\/").replace(/\./g,"\\."),g=new RegExp('(?:w{0,4}=")?'+h+"[^&\"; %,'\\$\\\\\\|]+","gi");c=/banner|adprefs|safeframe|sandbox|sf\.html/gi;f=/^\w{0,4}="/gi;var k=L(d,"script","src",g,c,f);if(!k){var p=
d.referrer;e="";var r=d.getElementsByTagName("script");if(r)for(h=0;!e&&h<r.length;){var m=r[h].innerHTML;if(m&&-1!=m.indexOf(p)){var C=m.match(g);e=M(C,c,f)}h++}(k=e)||(k=L(d,"a","href",g,c,f))}d=htmlUrl=k;a:{if(b.performance&&b.performance.mark&&b.performance.measure&&b.performance.getEntriesByName){b.performance.mark("dv_str_html_end");b.performance.measure("dv_str_html","dv_str_html_start","dv_str_html_end");var v=b.performance.getEntriesByName("dv_str_html");if(v&&0<v.length){var n=v[0].duration.toFixed(2);
break a}}n=null}return{url:d,depth:-1,duration:n}}}catch(t){}return null}function M(b,c,f){var e="";if(b&&0<b.length)for(var d=0;d<b.length;d++){var h=b[d];h.length>e.length&&null==h.match(c)&&0!=h.indexOf('src="')&&0!=h.indexOf('turl="')&&(e=h.replace(f,""))}return e}function L(b,c,f,e,d,h){b=b.querySelectorAll(c+"["+f+'*="'+b.referrer+'"]');var g="";if(b)for(c=0;!g&&c<b.length;)g=b[c][f].match(e),g=M(g,d,h),c++;return g}function U(b){try{if(1>=b.depth)return{url:"",depth:""};var c=[];c.push({win:window._dv_win.top,
depth:0});for(var f,e=1,d=0;0<e&&100>d;){try{if(d++,f=c.shift(),e--,0<f.win.location.toString().length&&f.win!=b)return 0==f.win.document.referrer.length||0==f.depth?{url:f.win.location,depth:f.depth}:{url:f.win.document.referrer,depth:f.depth-1}}catch(k){}var h=f.win.frames.length;for(var g=0;g<h;g++)c.push({win:f.win.frames[g],depth:f.depth+1}),e++}return{url:"",depth:""}}catch(k){return{url:"",depth:""}}}function W(){var b=window._dv_win[F("=@42E:@?")][F("2?46DE@C~C:8:?D")];if(b&&0<b.length){var c=
[];c[0]=window._dv_win.location.protocol+"//"+window._dv_win.location.hostname;for(var f=0;f<b.length;f++)c[f+1]=b[f];return c.reverse().join(",")}return null}function X(b){return(b=b.document.querySelector("link[rel=canonical]"))?b.href:null}function F(b){new String;var c=new String,f;for(f=0;f<b.length;f++){var e=b.charAt(f);var d="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".indexOf(e);0<=d&&(e="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".charAt((d+
47)%94));c+=e}return c}function G(){return Math.floor(1E12*(Math.random()+""))}function R(b){for(var c=[{id:4,brRegex:"OPR|Opera",verRegex:"(OPR/|Version/)"},{id:1,brRegex:"MSIE|Trident/7.*rv:11|rv:11.*Trident/7|Edge/|Edg/",verRegex:"(MSIE |rv:| Edge/|Edg/)"},{id:2,brRegex:"Firefox",verRegex:"Firefox/"},{id:0,brRegex:"Mozilla.*Android.*AppleWebKit(?!.*Chrome.*)|Linux.*Android.*AppleWebKit.* Version/.*Chrome",verRegex:null},{id:0,brRegex:"AOL/.*AOLBuild/|AOLBuild/.*AOL/|Puffin|Maxthon|Valve|Silk|PLAYSTATION|PlayStation|Nintendo|wOSBrowser",
verRegex:null},{id:3,brRegex:"Chrome",verRegex:"Chrome/"},{id:5,brRegex:"Safari|(OS |OS X )[0-9].*AppleWebKit",verRegex:"Version/"}],f=0,e="",d=0;d<c.length;d++)if(null!=b.match(new RegExp(c[d].brRegex))){f=c[d].id;if(null==c[d].verRegex)break;b=b.match(new RegExp(c[d].verRegex+"[0-9]*"));null!=b&&(e=b[0].match(new RegExp(c[d].verRegex)),e=b[0].replace(e[0],""));break}c=da();4==f&&(c=f);return{ID:c,version:c===f?e:"",ID_UA:f}}function da(){try{if(null!=window._phantom||null!=window.callPhantom)return 99;
if(document.documentElement.hasAttribute&&document.documentElement.hasAttribute("webdriver")||null!=window.domAutomation||null!=window.domAutomationController||null!=window._WEBDRIVER_ELEM_CACHE)return 98;if(void 0!=window.opera&&void 0!=window.history.navigationMode||void 0!=window.opr&&void 0!=window.opr.addons&&"function"==typeof window.opr.addons.installExtension)return 4;if(void 0!=document.uniqueID&&"string"==typeof document.uniqueID&&(void 0!=document.documentMode&&0<=document.documentMode||
void 0!=document.all&&"object"==typeof document.all||void 0!=window.ActiveXObject&&"function"==typeof window.ActiveXObject)||window.document&&window.document.updateSettings&&"function"==typeof window.document.updateSettings||Object.values&&navigator&&Object.values(navigator.plugins).some(function(b){return-1!=b.name.indexOf("Edge PDF")}))return 1;if(void 0!=window.chrome&&"function"==typeof window.chrome.csi&&"function"==typeof window.chrome.loadTimes&&void 0!=document.webkitHidden&&(1==document.webkitHidden||
0==document.webkitHidden))return 3;if(void 0!=window.mozInnerScreenY&&"number"==typeof window.mozInnerScreenY&&void 0!=window.mozPaintCount&&0<=window.mozPaintCount&&void 0!=window.InstallTrigger&&void 0!=window.InstallTrigger.install)return 2;var b=!1;try{var c=document.createElement("p");c.innerText=".";c.style="text-shadow: rgb(99, 116, 171) 20px -12px 2px";b=void 0!=c.style.textShadow}catch(f){}return(0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")||window.webkitAudioPannerNode&&
window.webkitConvertPointFromNodeToPage)&&b&&void 0!=window.innerWidth&&void 0!=window.innerHeight?5:0}catch(f){return 0}}function Y(){try{var b=0,c=function(c,d){d&&32>c&&(b=(b|1<<c)>>>0)},f=function(b,c){return function(){return b.apply(c,arguments)}},e="svg"===document.documentElement.nodeName.toLowerCase(),d=function(){return"function"!==typeof document.createElement?document.createElement(arguments[0]):e?document.createElementNS.call(document,"http://www.w3.org/2000/svg",arguments[0]):document.createElement.apply(document,
arguments)},h=["Moz","O","ms","Webkit"],g=["moz","o","ms","webkit"],k={style:d("modernizr").style},p=function(b,c){function e(){g&&(delete k.style,delete k.modElem)}var f;for(f=["modernizr","tspan","samp"];!k.style&&f.length;){var g=!0;k.modElem=d(f.shift());k.style=k.modElem.style}var h=b.length;for(f=0;f<h;f++){var m=b[f];~(""+m).indexOf("-")&&(m=cssToDOM(m));if(void 0!==k.style[m])return e(),"pfx"==c?m:!0}e();return!1},r=function(b,c,d){var e=b.charAt(0).toUpperCase()+b.slice(1),k=(b+" "+h.join(e+
" ")+e).split(" ");if("string"===typeof c||"undefined"===typeof c)return p(k,c);k=(b+" "+g.join(e+" ")+e).split(" ");for(var m in k)if(k[m]in c){if(!1===d)return k[m];b=c[k[m]];return"function"===typeof b?f(b,d||c):b}return!1};c(0,!0);c(1,r("requestFileSystem",window));c(2,window.CSS?"function"==typeof window.CSS.escape:!1);c(3,r("shapeOutside","content-box",!0));return b}catch(m){return 0}}function H(){var b=window,c=0;try{for(;b.parent&&b!=b.parent&&b.parent.document&&!(b=b.parent,10<c++););}catch(f){}return b}
function Z(){try{var b=H(),c=0,f=0,e=function(b,d,e){e&&(c+=Math.pow(2,b),f+=Math.pow(2,d))},d=b.document;e(14,0,b.playerInstance&&d.querySelector('script[src*="ads-player.com"]'));e(14,1,(b.CustomWLAdServer||b.DbcbdConfig)&&(a=d.querySelector('p[class="footerCopyright"]'),a&&a.textContent.match(/ MangaLife 2016/)));e(15,2,b.zpz&&b.zpz.createPlayer);e(15,3,b.vdApp&&b.vdApp.createPlayer);e(15,4,d.querySelector('body>div[class="z-z-z"]'));e(16,5,b.xy_checksum&&b.place_player&&(b.logjwonready&&b.logContentPauseRequested||
b.jwplayer));e(17,6,b==b.top&&""==d.title?(a=d.querySelector('body>object[id="player"]'),a&&a.data&&1<a.data.indexOf("jwplayer")&&"visibility: visible;"==a.getAttribute("style")):!1);e(17,7,d.querySelector('script[src*="sitewebvideo.com"]'));e(17,8,b.InitPage&&b.cef&&b.InitAd);e(17,9,b==b.top&&""==d.title?(a=d.querySelector("body>#player"),null!=a&&null!=(null!=a.querySelector('div[id*="opti-ad"]')||a.querySelector('iframe[src="about:blank"]'))):!1);e(17,10,b==b.top&&""==d.title&&b.InitAdPlayer?(a=
d.querySelector('body>div[id="kt_player"]'),null!=a&&null!=a.querySelector('div[class="flash-blocker"]')):!1);e(17,11,null!=b.clickplayer&&null!=b.checkRdy2);e(19,12,b.instance&&b.inject&&d.querySelector('path[id="cp-search-0"]'));e(20,13,function(){try{if(b.top==b&&0<b.document.getElementsByClassName("asu").length)for(var c=b.document.styleSheets,d=0;d<c.length;d++)for(var e=b.document.styleSheets[d].cssRules,f=0;f<e.length;f++)if("div.kk"==e[f].selectorText||"div.asu"==e[f].selectorText)return!0}catch(t){}}());
a:{try{var h=null!=d.querySelector('div[id="kt_player"][hiegth]');break a}catch(m){}h=void 0}e(21,14,h);a:{try{var g=b.top==b&&null!=b.document.querySelector('div[id="asu"][class="kk"]');break a}catch(m){}g=void 0}e(22,15,g);a:{try{var k=d.querySelector('object[data*="/VPAIDFlash.swf"]')&&d.querySelector('object[id*="vpaid_video_flash_tester_el"]')&&d.querySelector('div[id*="desktopSubModal"]');break a}catch(m){}k=void 0}e(25,16,k);var p=navigator.userAgent;if(p&&-1<p.indexOf("Android")&&-1<p.indexOf(" wv)")&&
b==window.top){var r=d.querySelector('img[src*="dealsneartome.com"]')||(b.__cads__?!0:!1)||0<d.querySelectorAll('img[src*="/tracker?tag="]').length;e(28,17,r||!1)}return{f:c,s:f}}catch(m){return null}}function aa(){try{var b=H(),c=0,f=b.document;b==window.top&&""==f.title&&!f.querySelector("meta[charset]")&&f.querySelector('div[style*="background-image: url("]')&&(f.querySelector('script[src*="j.pubcdn.net"]')||f.querySelector('span[class="ad-close"]'))&&(c+=Math.pow(2,6));return c}catch(e){return null}}
function ba(){try{var b="&fcifrms="+window.top.length;window.history&&(b+="&brh="+window.history.length);var c=H(),f=c.document;if(c==window.top){b+="&fwc="+((c.FB?1:0)+(c.twttr?2:0)+(c.outbrain?4:0)+(c._taboola?8:0));try{f.cookie&&(b+="&fcl="+f.cookie.length)}catch(e){}c.performance&&c.performance.timing&&0<c.performance.timing.domainLookupStart&&0<c.performance.timing.domainLookupEnd&&(b+="&flt="+(c.performance.timing.domainLookupEnd-c.performance.timing.domainLookupStart));f.querySelectorAll&&
(b+="&fec="+f.querySelectorAll("*").length)}return b}catch(e){return""}}var A=this,z=function(){function b(b,c){var f=[];c&&h.forEach(function(b){var d=dv_GetParam(c,b);""!==d&&null!==d&&f.push(["dvp_"+b,d].join("="))});var g=window&&window._dv_win||{};g=g.dv_config=g.dv_config||{};g=dv_getDVBSErrAddress(g);var m=[d,e].join("="),r=["dvp_cert",k[b]].join("=");b=["dvp_jsErrMsg",b].join("=");g+=["/verify.js?flvr=0&ctx=818052&cmp=1619415&dvp_isLostImp=1&ssl=1",m,r,b,f.join("&")].join("&");(new Image(1,
1)).src="https://"+g}function c(c,d){var e=window._dv_win.dv_config.bs_renderingMethod||function(b){document.write(b)};d="AdRenderedUponVerifyFailure__"+(d||"");if(A&&A.tagParamsObj&&A.tagParamsObj.tagAdtag)try{e(A.tagParamsObj.tagAdtag)}catch(v){d+="__RenderingMethodFailed"}else A?A.tagParamsObj?A.tagParamsObj.tagAdtag||(d+="__HandlerTagParamsObjTagAdtag__Undefined"):d+="__HandlerTagParamsObj__Undefined":d+="__Handler__Undefined";b(d,c)}var f=!1,e,d,h=["ctx","cmp","plc","sid"],g=[A.constructor&&
A.constructor.name||"UKDV","__",G()].join(""),k={VerifyLoadJSONPCallbackFailed:1,VerifyFailedToLoad:2},p={onResponse:function(d){f||(b("VerifyCallbackFailed",d),c(d,"VCF"))},onError:function(d){b("VerifyFailedToLoad",d);c(d,"VFTL")}};p.reportError=b;p.isJSONPCalled=f;window._dv_win[g]={globalScopeVerifyErrorHandler:p};return{setVersionData:function(b,c){d=b;e=c},setIsJSONPCalled:function(b){f=b},getIsJSONPCalled:function(){return f},onLoad:dv_onResponse,onError:dv_onError,uniqueKey:g}}();this.createRequest=
function(){window.performance&&window.performance.mark&&window.performance.mark("dv_create_req_start");var b=!1,c=window._dv_win,f=0,e=!1,d;try{for(d=0;10>=d;d++)if(null!=c.parent&&c.parent!=c)if(0<c.parent.location.toString().length)c=c.parent,f++,b=!0;else{b=!1;break}else{0==d&&(b=!0);break}}catch(t){b=!1}a:{try{var h=c.$sf;break a}catch(t){}h=void 0}var g=(d=c.location&&c.location.ancestorOrigins)&&d[d.length-1];if(0==c.document.referrer.length)b=c.location;else if(b)b=c.location;else{b=c.document.referrer;
a:{try{var k=c.$sf&&c.$sf.ext&&c.$sf.ext.hostURL&&c.$sf.ext.hostURL();break a}catch(t){}k=void 0}if(k&&(!d||0==k.indexOf(g))){b=k;var p=!0}e=!0}if(!window._dv_win.dvbsScriptsInternal||!window._dv_win.dvbsProcessed||0==window._dv_win.dvbsScriptsInternal.length)return{isSev1:!1,url:null};d=window._dv_win.dv_config&&window._dv_win.dv_config.isUT?window._dv_win.dvbsScriptsInternal[window._dv_win.dvbsScriptsInternal.length-1]:window._dv_win.dvbsScriptsInternal.pop();k=d.script;this.dv_script_obj=d;this.dv_script=
k;window._dv_win.dvbsProcessed.push(d);window._dv_win._dvScripts.push(k);g=k.src;this.dvOther=0;this.dvStep=1;var r=window._dv_win.dv_config?window._dv_win.dv_config.dv_GetRnd?window._dv_win.dv_config.dv_GetRnd():G():G();d=window.parent.postMessage&&window.JSON;var m={};try{for(var u=/[\?&]([^&]*)=([^&#]*)/gi,v=u.exec(g);null!=v;)"eparams"!==v[1]&&(m[v[1]]=v[2]),v=u.exec(g);var n=m}catch(t){n=m}this.tagParamsObj=n;n.perf=this.perf;n.uid=r;n.script=this.dv_script;n.callbackName="__verify_callback_"+
n.uid;n.tagObjectCallbackName="__tagObject_callback_"+n.uid;n.tagAdtag=null;n.tagPassback=null;n.tagIntegrityFlag="";n.tagHasPassbackFlag="";0==(null!=n.tagformat&&"2"==n.tagformat)&&(v=Q(n.script),n.tagAdtag=v.tagAdTag,n.tagPassback=v.tagPassback,v.isBadImp?n.tagIntegrityFlag="&isbadimp=1":v.hasPassback&&(n.tagHasPassbackFlag="&tagpb=1"));v=(/iPhone|iPad|iPod|\(Apple TV|iOS|Coremedia|CFNetwork\/.*Darwin/i.test(navigator.userAgent)||navigator.vendor&&"apple, inc."===navigator.vendor.toLowerCase())&&
!window.MSStream;n.protocol="https:";n.ssl="1";g=n;(r=window._dv_win.dvRecoveryObj)?("2"!=g.tagformat&&(r=r[g.ctx]?r[g.ctx].RecoveryTagID:r._fallback_?r._fallback_.RecoveryTagID:1,1===r&&g.tagAdtag?document.write(g.tagAdtag):2===r&&g.tagPassback&&document.write(g.tagPassback)),g=!0):g=!1;if(g)return{isSev1:!0};this.dvStep=2;P(n);k=k&&k.parentElement&&k.parentElement.tagName&&"HEAD"===k.parentElement.tagName;this.dvStep=3;return J(this,n,b,c,f,e,d,!0,k,v,p,h)};this.sendRequest=function(b){var c=dv_GetParam(b,
"tagformat");if(z)try{z.setVersionData(this.getVersionParamName(),this.getVersion()),c&&"2"==c?$dvbs.domUtilities.addScriptResource(b,document.body,z.onLoad,z.onError,z.uniqueKey):dv_sendScriptRequest(b,z.onLoad,z.onError,z.uniqueKey)}catch(f){c&&"2"==c?$dvbs.domUtilities.addScriptResource(b,document.body):dv_sendScriptRequest(b)}else c&&"2"==c?$dvbs.domUtilities.addScriptResource(b,document.body):dv_sendScriptRequest(b);return!0};this.isApplicable=function(){return!0};this.onFailure=function(){};
var O={RTN:1};window.debugScript&&(window.CreateUrl=J);this.getVersionParamName=function(){return"ver"};this.getVersion=function(){return"171"}};


function dvbs_src_main(dvbs_baseHandlerIns, dvbs_handlersDefs) {

    this.bs_baseHandlerIns = dvbs_baseHandlerIns;
    this.bs_handlersDefs = dvbs_handlersDefs;

    this.exec = function () {
        try {
            window._dv_win = (window._dv_win || window);
            window._dv_win.$dvbs = (window._dv_win.$dvbs || new dvBsType());

            window._dv_win.dv_config = window._dv_win.dv_config || {};
            window._dv_win.dv_config.bsErrAddress = window._dv_win.dv_config.bsAddress || 'rtb0.doubleverify.com';

            var errorsArr = (new dv_rolloutManager(this.bs_handlersDefs, this.bs_baseHandlerIns)).handle();
            if (errorsArr && errorsArr.length > 0)
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?flvr=0&ctx=818052&cmp=1619415&num=6', errorsArr);
        }
        catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?flvr=0&ctx=818052&cmp=1619415&num=6&dvp_isLostImp=1', {dvp_jsErrMsg: encodeURIComponent(e)});
            } catch (e) {
            }
        }
    };
};


try {
    window._dv_win = window._dv_win || window;
    var dv_baseHandlerIns = new dv_baseHandler();
	

    var dv_handlersDefs = [];
    (new dvbs_src_main(dv_baseHandlerIns, dv_handlersDefs)).exec();
} catch (e) { }