var Timer = (function () {

    function doClearAll (table, clearFunc) {
        for (var key in table) {
            var ids = table[key];
            if (Array.isArray(ids)) {
                for (var i = 0; i < ids.length; i++) {
                    var id = ids[i];
                    clearFunc(id);
                }
            }
            else {
                clearFunc(ids);
            }
        }
        JS.clear(table);
    }

    function createClearMethod (table, clearFunc) {
        return function (key) {
            var ids = table[key];
            if (typeof ids !== 'undefined') {
                if (Array.isArray(ids)) {
                    for (var i = 0; i < ids.length; i++) {
                        var id = ids[i];
                        clearFunc(id);
                    }
                }
                else {
                    clearFunc(ids);
                }
                delete table[key];
            }
        };
    }

    var Timer = {

        // https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,

        setTimeoutWithKey: null,
        setIntervalWithKey: null,
        clearTimeoutByKey: null,
        clearIntervalByKey: null,

        clearAll: function () {
            doClearAll(this.timeoutIds, clearTimeout);
            doClearAll(this.intervalIds, clearInterval);
        },

        // key to (array of) id
        timeoutIds: {},
        // key to (array of) id
        intervalIds: {}
    };

    Timer.setTimeoutWithKey = function (callback, delay, keyToClear) {
        var id = setTimeout(function () {
            try {
                callback();
            }
            catch (e) {
                Fire._throw(e);
            }
            var idHasSameKey = Timer.timeoutIds[keyToClear];
            if (Array.isArray(idHasSameKey)) {
                if (idHasSameKey.length > 1) {
                    var i = idHasSameKey.indexOf(id);
                    idHasSameKey.splice(i, 1);
                    return;
                }
            }
            delete Timer.timeoutIds[keyToClear];
        }, delay);
        var existsId = Timer.timeoutIds[keyToClear];
        if (typeof existsId === 'undefined') {
            Timer.timeoutIds[keyToClear] = id;
        }
        else if (Array.isArray(existsId)) {
            existsId.push(id);
        }
        else {
            Timer.timeoutIds[keyToClear] = [existsId, id];
        }
    };

    Timer.setIntervalWithKey = function (callback, delay, keyToClear) {
        var id = setInterval(function () {
            try {
                callback();
            }
            catch (e) {
                Fire._throw(e);
            }
        }, delay);
        var existsId = Timer.intervalIds[keyToClear];
        if (typeof existsId === 'undefined') {
            Timer.intervalIds[keyToClear] = id;
        }
        else if (Array.isArray(existsId)) {
            existsId.push(id);
        }
        else {
            Timer.intervalIds[keyToClear] = [existsId, id];
        }
    };

    Timer.clearTimeoutByKey = createClearMethod(Timer.timeoutIds, clearTimeout);
    Timer.clearIntervalByKey = createClearMethod(Timer.intervalIds, clearInterval);

    Engine.on('stop', function () {
        Timer.clearAll();
    });

    return Timer;
})();
Fire._Runtime.Timer = Timer;
