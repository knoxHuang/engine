﻿var FIRE = FIRE || {};

FIRE.Engine = (function () {

    var Engine = {};

    var isPlaying = false;
    var isPaused = false;
    var stepOnce = false;

    // We should use this id to cancel ticker, otherwise if the engine stop and replay immediately,
    // last ticker will not cancel correctly.
    var requestId = -1;

    var scene = null;

    // is rendering and allow update logic
    Engine.__defineGetter__('isPlaying', function () {
        return isPlaying;
    });

    // is logic paused
    Engine.__defineGetter__('isPaused', function () {
        return isPaused;
    });

    Engine.init = function () {
        scene = new FIRE.Scene();
    };

    Engine.play = function () {
        if (isPlaying && !isPaused) {
            console.warn('Fireball is already playing');
            return;
        }
        if (isPlaying && isPaused) {
            isPaused = false;
            return;
        }
        isPlaying = true;

        var now = Ticker.now();
        FIRE.Time._restart(now);
        update();
    };

    Engine.stop = function () {
        // reset states
        isPlaying = false;
        isPaused = false;
        if (requestId !== -1) {
            Ticker.cancelAnimationFrame(requestId);
            requestId = -1;
        }
    };
    
    Engine.pause = function () {
        isPaused = true;
    };

    Engine.step = function () {
        isPaused = true;
        stepOnce = true;
        if (isPlaying === false) {
            Engine.play();
        }
    };

    var doUpdate = function (updateLogic) {
        //console.log('canUpdateLogic: ' + updateLogic + ' Time: ' + FIRE.Time);
        // TODO: scheduler
        if (updateLogic) {
            scene.update();
            FIRE.FObject._deferredDestroy();
        }
    };

    /**
     * @method FIRE.Engine#update
     * @param unused {float} not used parameter, can omit
     * @private
     */
    var update = function (unused) {
        if (!isPlaying) {
            return;
        }
        requestId = Ticker.requestAnimationFrame(update);

        var updateLogic = !isPaused || stepOnce;
        stepOnce = false;
        var now = Ticker.now();
        FIRE.Time._update(now, !updateLogic);
        doUpdate(updateLogic);

        // for test
        if (FIRE.__TESTONLY__.update) {
            FIRE.__TESTONLY__.update(updateLogic);
        }
    };
    Engine.update = update;

    return Engine;
})();