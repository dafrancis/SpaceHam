(function () {
    "use strict";

    var Juicy = {
        /**
         * Starts a canvas application
         *
         * @module
         * @param {Object} options    Options for the application (optional)
         *                            Options include:
         *                              canvas : The canvas element
         *                              time : The time for each loop (default: 30)
         *                              clear : Sets autoclear (default: true)
         * @param {Function} callback Function for the main canvas loop.
         */
        run: function (options, callback) {
            var backupCanvas, self = this;
            if (typeof options === "function") {
                callback = options;
                options = {};
            }
            backupCanvas = document.getElementsByTagName("canvas")[0];
            this.clear = options.clear === undefined ? true : options.clear;
            this.canvas = options.canvas || backupCanvas;
            this.canvas.addEventListener("mousemove", this._mouse.mousemove);
            this.canvas.addEventListener("mousedown", this._mouse.mousedown);
            this.canvas.addEventListener("mouseup", this._mouse.mouseup);
            this.ctx = this.canvas.getContext("2d");
            this.ctx.drawCircle = function (x, y, radius) {
                this.beginPath();
                this.arc(x, y, radius, 0, Math.PI * 2, true);
                this.closePath();
                this.fill();
            };
            this.canvas.ctx = this.ctx;
            setInterval(function () {
                var collection;
                if (self.clear) {
                    self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                }
                if (self.percentLoaded() === "100%") {
                    for (collection in self.collections) {
                        if (self.collections.hasOwnProperty(collection)) {
                            self.collections[collection].step();
                        }
                    }
                }
                callback.call(self);
                Juicy.mouse.click = false;
            }, options.time || 30);
        },
        /**
         * Keeps the state of the mouse object
         *
         * x : mouse x on the canvas
         * y : mouse y on the canvas
         * click : determines if mouse is clicked
         * down : determines if the mouse is pressed
         */
        mouse: {},
        /**
         * Mouse event functions
         */
        _mouse: {
            /**
             * Sets mouse.x and mouse.y when mouse moves
             */
            mousemove: function (e) {
                var mouseX, mouseY;
                if (e.offsetX) {
                    mouseX = e.offsetX;
                    mouseY = e.offsetY;
                } else if (e.layerX) {
                    mouseX = e.layerX - Juicy.canvas.offsetLeft;
                    mouseY = e.layerY - Juicy.canvas.offsetTop;
                }
                Juicy.mouse.x = mouseX / Juicy.ratio.x;
                Juicy.mouse.y = mouseY / Juicy.ratio.y;
            },
            /**
             * Sets mouse clicked and mouse is down when mouse is down
             */
            mousedown: function () {
                Juicy.mouse.click = true;
                Juicy.mouse.isDown = true;
            },
            /**
             * Sets mouse down as false when mouse is up
             */
            mouseup: function () {
                Juicy.mouse.isDown = false;
            }
        },
        /**
         * Holds the Audio Objects
         */
        sounds: {},
        /**
         * Holds the Image Objects
         */
        images: {},
        /**
         * Takes an object of names -> path and loads Audio
         * objects ready to be used in the application
         *
         * @param {Object} obj Object of names -> path of all the sounds to be used
         */
        audioLoad: function (obj) {
            var sound, audio, stop, loaded, self = this;
            stop = function () {
                this.pause();
                this.currentTime = 0;
            };
            loaded = function () {
                return new function() {
                    if (!this._loaded) {
                        self._loading -= 1;
                        this._loaded = 1;
                    }
                };
            };
            for (sound in obj) {
                if (obj.hasOwnProperty(sound)) {
                    audio = new Audio();
                    audio.stop = stop;
                    audio.oncanplaythrough = loaded();
                    audio.src = obj[sound];
                    this.sounds[sound] = audio;
                    self._loading += 1;
                }
            }
        },
        /**
         * Takes an object of names -> path and loads Image
         * objects ready to be used in the application
         *
         * @param {Object} obj Object of names -> path of all the images to be used
         */
        imageLoad: function (obj) {
            var img, image, loaded, self = this;
            loaded = function() {
                self._loading -= 1;
                this._loaded = 1;
            };
            for (image in obj) {
                if (obj.hasOwnProperty(image)) {
                    img = new Image();
                    img.src = obj[image];
                    img.onload = loaded;
                    this.images[image] = img;
                    self._loading += 1;
                }
            }
        },
        /**
         * Count of items still loading
         */
        _loading: 0,
        /**
         * Returns the percentage of items which are still loading
         */
        percentLoaded: function () {
            var totalItems, imgLen, soundLen, percent;
            imgLen = Object.keys(this.images).length;
            soundLen = Object.keys(this.sounds).length;
            totalItems = imgLen + soundLen;
            percent = (totalItems - this._loading) / totalItems;
            percent *= 10000;
            percent = Math.round(percent) / 100;
            return percent + "%";
        },
        /**
         * Returns an object containing lists of items which are still loading
         */
        filesLoading: function () {
            var img, snd, imgLoad = [], sndLoad = [];
            for (img in this.images) {
                if (!this.images[img]._loaded) {
                    imgLoad.push(img);
                }
            }
            for (snd in this.sounds) {
                if (!this.sounds[snd]._loaded) {
                    sndLoad.push(snd);
                }
            }
            return {
                sounds: sndLoad,
                images: imgLoad
            };
        },
        /**
         * Sets the application to fullscreen mode. This needs to be bound to a
         * button as the JavaScript fullscreen API doesn't allow fullscreen
         * otherwise.
         */
        fullscreen: function () {
            var elem = this.canvas;
            if (elem.requestFullScreenWithKeys) {
                elem.requestFullScreenWithKeys();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen(elem.ALLOW_KEYBOARD_INPUT);
            } else if (elem.webkitRequestFullScreen) {
                elem.webkitRequestFullScreen(elem.ALLOW_KEYBOARD_INPUT);
            }
        },
        /**
         * Holds the collections used in the application
         */
        collections: {},
        /**
         * Takes an object of names -> Collection and sets up
         * collections ready to be used in the application
         *
         * @param {Object} collections Object of names -> Collection of all the
         *                             collections to be used
         */
        setupCollections: function (collections) {
            var collection, self = this;
            for (collection in collections) {
                if (collections.hasOwnProperty(collection)) {
                    self.collections[collection] = new collections[collection]();
                }
            }
        },
        /**
         * Ratio for fullscreen mode
         */
        ratio: {
            x: 1,
            y: 1
        },
        /**
         * Sets up fullscreen
         */
        onInFullScreen: function () {
            var html, body, elem;
            elem = this.canvas;
            html = document.getElementsByTagName("html")[0];
            body = document.getElementsByTagName("body")[0];
            html.className += " ffs_body";
            body.className += " ffs_body";
            elem.className += " ffs_element";

            this.ratio = {
                x: window.innerWidth / this.canvas.width,
                y: window.innerHeight / this.canvas.height
            };
        },
        /**
         * Sets the application back to normal when going out of fullscreen
         */
        onOutFullScreen: function () {
            var html, body, elem;
            elem = this.canvas;
            html = document.getElementsByTagName("html")[0];
            body = document.getElementsByTagName("body")[0];
            html.className = html.className.replace("ffs_body", "");
            body.className = body.className.replace("ffs_body", "");
            elem.className = elem.className.replace("ffs_element", "");

            this.ratio = {
                x: 1,
                y: 1
            };
        },
        drawText: function (text, x, y, color, font, space) {
            var self = this;
            if (typeof text === "string") {
                text = text.split("\n");
            }
            space = space || 50;
            this.ctx.fillStyle = color || "black";
            this.ctx.font = font || "12px sans-serif";
            text.forEach(function (str) {
                self.ctx.fillText(str, x, y);
                y += space;
            });
        },
        drawMouse: function (mouse, offX, offY) {
            var x, y, img = this.images[mouse];
            if (offX !== undefined && offY !== undefined) {
                x = this.mouse.x - offX;
                y = this.mouse.y - offY;
            } else {
                x = this.mouse.x - (img.width / 2);
                y = this.mouse.y - (img.height / 2);
            }
            this.ctx.drawImage(img, x, y);
        },
        Key: {
            _pressed: {},

            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,

            W: 87,
            S: 83,
            A: 65,
            D: 68,

            SPACE: 32,
          
            isDown: function(keyCode) {
                return this._pressed[keyCode];
            },
          
            onKeydown: function(event) {
                this._pressed[event.keyCode] = true;
            },
          
            onKeyup: function(event) {
                delete this._pressed[event.keyCode];
            }
        },
        _items: {},
        getOrCreate: function (key, callback, force) {
            if (force || !this._items.hasOwnProperty(key)) {
                this._items[key] = callback();
            }
            return this._items[key];
        }
    };

    window.addEventListener('keyup', function(event) {
        Juicy.Key.onKeyup(event);
    }, false);

    window.addEventListener('keydown', function(event) {
        //event.preventDefault();
        Juicy.Key.onKeydown(event);
    }, false);

    /**
     * Bind for going in and out of fullscreen
     */
    document.addEventListener("fullscreenchange", function () {
        var evt = (document.fullscreen) ? "onInFullScreen" : "onOutFullScreen";
        Juicy[evt]();
    }, false);
    /**
     * Bind for going in and out of fullscreen (Mozilla)
     */
    document.addEventListener("mozfullscreenchange", function () {
        var evt = (document.mozFullScreen) ? "onInFullScreen" : "onOutFullScreen";
        Juicy[evt]();
    }, false);
    /**
     * Bind for going in and out of fullscreen (Webkit)
     */
    document.addEventListener("webkitfullscreenchange", function () {
        var evt = (document.webkitIsFullScreen) ? "onInFullScreen" : "onOutFullScreen";
        Juicy[evt]();
    }, false);

    /**
     * Base class for application objects
     *
     * @module
     * @this {Base}
     */
    function Base() {
        // Something goes here
        this.autodraw = true;
    }

    /**
     * Draw function. Only methods that draws something per step should be here.
     *
     * @this {Base}
     */
    Base.prototype.draw = function () {};

    /**
     * Change function. Only methods changes something per step should be here.
     *
     * @this {Base}
     */
    Base.prototype.change = function () {};

    /**
     * Step function. What happens per cycle in the canvas loop.
     *
     * @this {Base}
     */
    Base.prototype.step = function () {
        if (this.img && this.autodraw) {
            this.drawImage();
        }
        this.draw();
        this.change();
    };

    /**
     * Returns wether object has gone outside of the canvas object
     *
     * @this {Base}
     */
    Base.prototype.isOutOfBounds = function () {
        var tooRight = this.x > Juicy.canvas.width,
            tooLeft = this.x + this.width < 0,
            tooUp = this.y + this.height < 0,
            tooDown = this.y > Juicy.canvas.height;
        return tooRight || tooDown || tooUp || tooLeft;
    };

    /**
     * Returns wether object is currently being hovered on
     *
     * @this {Base}
     */
    Base.prototype.isHover = function () {
        var isX, isY;
        isX = Juicy.mouse.x > this.x && Juicy.mouse.x < this.width + this.x;
        isY = Juicy.mouse.y > this.y && Juicy.mouse.y < this.height + this.y;
        return isX && isY;
    };

    /**
     * Returns wether object is currently being clicked
     *
     * @this {Base}
     */
    Base.prototype.isClicked = function () {
        return Juicy.mouse.click && this.isHover();
    };

    /**
     * Draws an image on the canvas
     *
     * @this {Base}
     */
    Base.prototype.drawImage = function () {
        Juicy.ctx.drawImage(Juicy.images[this.img], this.x, this.y, this.width, this.height);
    };

    /**
     * Some people are scared of JavaScript's prototypal inheritance.
     * "It doesn't look right" they say. Extend more or less does it in a way
     * that seems the most natural, in a way that's similar to Spine or
     * Backbone.
     *
     * @this {Base}
     */
    Base.extend = function (options) {
        var option, This = this, klass = options.init || function () {};
        klass.prototype = new This();
        for (option in options) {
            if (options.hasOwnProperty(option) && option !== "init") {
                klass.prototype[option] = options[option];
            }
        }
        klass.extend = this.extend;
        return klass;
    };

    Juicy.Base = Base;

    /**
     * Collection class. Collections are to hold more than one Base items
     * When creating a collection you should say what kind of model you're
     * using and also a filter if objects are to be removed from the collection.
     *
     * e.g.
     * var Particles = Juicy.Collection.extend({
     *     model: Particle,
     *     filter: function (particle) {
     *         return !particle.isOutOfBounds();
     *     }
     * });
     *
     * @module
     * @this {Collection}
     */
    Juicy.Collection = Base.extend({
        init: function () {
            this.collection = [];
        },
        /**
         * Step for collections
         *
         * @this {Collection}
         */
        step: function () {
            this.drawCollection();
            this.filterCollection();
            this.draw();
            this.change();
        },
        /**
         * Runs the step function for all the objects in the collection
         *
         * @this {Collection}
         */
        drawCollection: function () {
            this.collection.forEach(function (object) {
                object.step();
            });
        },
        /**
         * Runs the filter for the collection if there is a filter
         *
         * @this {Collection}
         */
        filterCollection: function () {
            if (this.filter) {
                this.collection = this.collection.filter(this.filter);
            }
        },
        /**
         * Adds a new object (depending on model) for the collection
         *
         * @this {Collection}
         */
        add: function () {
            this.collection.push(new this.model());
        },
        /**
         * Removes an object depending on the index
         *
         * @this {Collection}
         * @param {Number} index The index of the object in the collection;
         */
        remove: function (index) {
            return this.collection.splice(index, 1);
        }
    });

    /**
     * Animated Class. Like Base but used for images which are animated.
     * Images must be a spritesheet and width and height should be provided.
     * You can repeat an animation by setting repeat to true.
     *
     * e.g.
     * var Explosion = Juicy.Animated.extend({
     *     img: "explosion",
     *     width: 64,
     *     height: 64,
     *     repeat: false
     * });
     *
     * @module
     * @this {Animated}
     */
    Juicy.Animated = Juicy.Base.extend({
        offsetX: 0,
        offsetY: 0,
        isFinished: false,
        /**
         * Step function
         *
         * @this {Animated}
         */
        step: function () {
            this.drawFrame();
            this.animate();
            this.draw();
            this.change();
        },
        /**
         * Sets the next frame to be animated
         *
         * @this {Animated}
         */
        animate: function () {
            var img = Juicy.images[this.img];
            this.offsetX += this.width;
            if (this.offsetX === img.width) {
                this.offsetX = 0;
                this.offsetY += this.height;
            }
            if (this.offsetY === img.height) {
                if (this.repeat) {
                    this.offsetY = 0;
                } else {
                    this.isFinished = true;
                }
            }
        },
        /**
         * Draws the current frame
         *
         * @this {Animated}
         */
        drawFrame: function () {
            var img, offx, offy, width, height, x, y;
            img = Juicy.images[this.img];
            offx = this.offsetX;
            offy = this.offsetY;
            width = this.width;
            height = this.height;
            x = this.x;
            y = this.y;
            Juicy.ctx.drawImage(img, offx, offy, width, height, x, y, width, height);
        }
    });

    this.Juicy = Juicy;
}.call(this));