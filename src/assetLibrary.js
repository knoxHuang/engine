﻿// A asset library which managing loading/unloading assets in project

var AssetLibrary = (function () {

    // configs

    /**
     * uuid to urls
     * 
     * 如果uuid能映射到url则优先从url加载，否则从library加载。这个步骤在最终发布版本中应该是不需要的？
     */
    var _uuidToUrl = {};

    /**
     * 当uuid不在_uuidToUrl里面，则将uuid本身作为url加载，路径位于_libraryBase。
     */
    var _libraryBase = '';

    // variables

    /**
     * uuid to all loaded assets
     * 
     * 这里保存所有已经加载的资源，防止同一个资源在内存中加载出多份拷贝。
     * 由于弱引用尚未标准化，在浏览器中所有加载过的资源都只能手工调用 unloadAsset 释放。
     * 参考：
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
     * https://github.com/TooTallNate/node-weak
     */
    var _uuidToAsset = {};

    /**
     * the loading uuid's callbacks
     */
    var _uuidToCallbacks = new FIRE.CallbacksInvoker();

    // publics

    var AssetLibrary = {

        /**
         * uuid加载流程：
         * 1. 查找_uuidToAsset，如果已经加载过，直接返回
         * 2. 查找_uuidToCallbacks，如果已经在加载，则注册回调，直接返回
         * 3. 查找_uuidToUrl，如果有则从指定url加载，这一步方便引擎单独测试
         * 4. 如果没有url，则将uuid直接作为路径
         * 5. 递归加载Asset及其引用到的其它Asset
         * 
         * @param {string} uuid
         * @param {AssetLibrary~loadCallback} [callback] - the callback to receive the asset
         * @param {FIRE._DeserializeInfo} [info] - reused temp obj
         */
        loadAssetByUuid: function (uuid, callback, info) {
            if (typeof uuid !== 'string') {
                callback(null, '[AssetLibrary] uuid must be string');
                return;
            }
            // step 1
            var asset = _uuidToAsset[uuid];
            if (asset) {
                if (callback) {
                    callback(asset);
                }
                return;
            }

            // step 2
            if (_uuidToCallbacks.add(uuid, callback) === false) {
                // already loading
                return;
            }

            // step 3
            var url = _uuidToUrl && _uuidToUrl[uuid];

            // step 4
            if (!url) {
                url = _libraryBase + uuid.substring(0, 2) + FIRE.Path.sep + uuid;
            }

            // step 5
            LoadManager.load(TextLoader, url, 
                function (json, error) {
                    if (error) {
                        _uuidToCallbacks.invokeAndRemove(uuid, null, error);
                        return;
                    }
                    // prepare
                    if (info) {
                        // info我们只是用来重用临时对象，所以每次使用前要重设
                        info.reset();
                    }
                    else {
                        info = new FIRE._DeserializeInfo();
                    }


                    // deserialize asset
                    var curScene = Engine._scene;
                    Engine._scene = null;
                    var asset = FIRE.deserialize(json, info, FIRE.isEditor);
                    Engine._scene = curScene;
                    
                    // load depends

                    var hostLoaded = !info.hostProp;
                    var pendingCount = info.uuidList.length;
                    var dependsAssetsLoaded = pendingCount === 0;

                    if (info.hostProp) {
                        // load depends host objects
                        var attrs = FIRE.attr(asset.constructor, info.hostProp);
                        var hostType = attrs.hostType;
                        if (hostType === 'Image') {
                            hostLoaded = false;
                            var hostUrl = url + '.host';
                            LoadManager.load(ImageLoader, hostUrl, function (img, error) {
                                if (error) {
                                    console.error('[AssetLibrary] Failed to load image of "' + dependsUuid + '", ' + error);
                                }
                                asset[info.hostProp] = img;
                                hostLoaded = true;
                                if (dependsAssetsLoaded) {
                                    _uuidToCallbacks.invokeAndRemove(uuid, asset);
                                }
                            });
                        }
                    }

                    if (dependsAssetsLoaded) {
                        if (hostLoaded) {
                            _uuidToCallbacks.invokeAndRemove(uuid, asset);
                        }
                        return;
                    }
                    // load depends assets
                    for (var i = 0, len = info.uuidList.length; i < len; i++) {
                        var dependsUuid = info.uuidList[i];
                        var obj = info.uuidObjList[i];
                        var prop = info.uuidPropList[i];
                        AssetLibrary.loadAssetByUuid(dependsUuid, function (dependsAsset, error) {
                            if (error) {
                                console.error('[AssetLibrary] Failed to load "' + dependsUuid + '", ' + error);
                            }
                            // update reference
                            obj[prop] = dependsAsset;
                            // check all finished
                            --pendingCount;
                            if (pendingCount === 0) {
                                if (hostLoaded) {
                                    _uuidToCallbacks.invokeAndRemove(uuid, asset);
                                }
                            }
                        }, info);
                    }
                });
            //loadAssetByUrl (url, callback, info);
        },

        //loadAssetByUrl: function (url, callback, info) {},

        /**
         * @callback AssetLibrary~loadCallback
         * @param {FIRE.Asset} asset - if failed, asset will be null
         * @param {string} [error] - error info, if succeed, error will be empty or nil
         */

        /**
         * Kill references to the asset so it can be garbage collected.
         * Fireball will reload the asset from disk or remote if loadAssetByUuid being called again.
         * 如果还有地方引用到asset，除非destroyAsset为true，否则不应该执行这个方法。
         * 
         * @method FIRE.AssetLibrary.unloadAsset
         * @param {FIRE.Asset} asset
         * @param {boolean} [destroyAsset=false] - When destroyAsset is true, if there are objects 
         *                                         referencing the asset, the references will become invalid.
         */
        unloadAsset: function (asset, destroyAsset) {
            if (!asset) {
                console.error('[AssetLibrary] unloadAsset: asset must be non-nil');
                return;
            }
            if (destroyAsset && asset.isValid) {
                asset.destroy();
            }
            delete _uuidToAsset[asset._uuid];
        },

        /**
         * init the asset library
         * @method FIRE.AssetLibrary.init
         * @param {string} baseUrl
         * @param {object} [uuidToUrl]
         */
        init: function (libraryPath, uuidToUrl) {
            _libraryBase = FIRE.Path.setEndWithSep(libraryPath);
            //console.log('[AssetLibrary] library: ' + _libraryBase);

            _uuidToUrl = uuidToUrl;
        },

        ///**
        // * temporary flag for deserializing assets
        // * @property {boolean} FIRE.AssetLibrary.isLoadingAsset
        // */
        //isLoadingAsset: false,
    };

    return AssetLibrary;
})();

FIRE.AssetLibrary = AssetLibrary;
