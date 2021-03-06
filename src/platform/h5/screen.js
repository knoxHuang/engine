/**
 * Screen class can be used to access display information.
 * @class Screen
 * @static
 */
var Screen = {
    /**
     * The current device's pixel ratio (for retina displays)
     * @property devicePixelRatio
     * @type {number}
     * @default 1
     * @readOnly
     */
    devicePixelRatio: (Fire.isRetinaEnabled && window.devicePixelRatio) || 1
};

/**
 * The current size of the screen window in pixels
 * @property size
 * @type {Vec2}
 */
Object.defineProperty(Screen, 'size', {
    get: function () {
        return Engine._renderContext.size;//.div(this.devicePixelRatio);
    },
    set: function (value) {
        Engine._renderContext.size = value;//.mul(this.devicePixelRatio);
    }
});

//Object.defineProperty(Screen, 'deviceSize', {
//    get: function () {
//        return Engine._renderContext.size;
//    },
//    set: function (value) {
//        Engine._renderContext.size = value;
//        //if ( !isPlaying ) {
//        //    render();
//        //}
//    }
//});

/**
 * The current width of the screen window in pixels
 * @property width
 * @type {number}
 */
Object.defineProperty(Screen, 'width', {
    get: function () {
        return Engine._renderContext.width;
    },
    set: function (value) {
        Engine._renderContext.width = value;
    }
});

/**
 * The current height of the screen window in pixels
 * @property height
 * @type {number}
 */
Object.defineProperty(Screen, 'height', {
    get: function () {
        return Engine._renderContext.height;
    },
    set: function (value) {
        Engine._renderContext.height = value;
    }
});

/**
 * The canvas's parent node in dom.
 * @property _container
 * @type {HTMLElement}
 * @private
 */
Object.defineProperty(Screen, '_container', {
    get: function () {
        var canvas = Fire.Engine._renderContext.canvas;
        return canvas.parentNode;
    }
});

/**
 * The container's parent node in dom.
 * @property _frame
 * @type {HTMLElement}
 * @private
 */
Object.defineProperty(Screen, '_frame', {
    get: function () {
        var container = this._container;
        return (container.parentNode === document.body) ? document.documentElement : container.parentNode;
    }
});

/**
 * Size of parent node that contains container and _canvas
 * @property _frameSize
 * @type {Vec2}
 * @private
 */
Object.defineProperty(Screen, '_frameSize', {
    get: function () {
        var frame = this._frame;
        return Fire.v2(BrowserGetter.availWidth(frame), BrowserGetter.availHeight(frame));
    }
});

//Object.defineProperty(Screen, 'resolutionPolicy', {
//    get: function () {
//        return this._resolutionPolicy;
//    },
//    set: function (value) {
//        this._resolutionPolicy = value;
//    }
//});

Fire.Screen = Screen;
