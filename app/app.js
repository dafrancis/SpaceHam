(function () {
    var state = "title";
    var score = 0;
    var lives = 3;

    function randomRange (min, max) {
        return ((Math.random()*(max-min)) + min);
    }

    Juicy.imageLoad({
        linus: "images/linus.png",
        fork: "images/fork.png",
        ham: "images/ham.png",
        dogg: "images/dogg.png",
        explosion: "images/explosion.png",
        duck: "images/duck.png",
        title: "images/spaceham.png",
        stars: "images/bg_stars.gif",
        disneyland: "images/disney.jpg"
    });

    Juicy.audioLoad({
        spacejam: "sounds/spacejam.ogg",
        explosion: "sounds/explosion.wav"
    });

    var createPlayer = function () {
        var Player = Juicy.Animated.extend({
            img: "duck",
            width: 100,
            height: 100,
            speed: 5,
            repeat: true,
            alive: true,
            init: function () {
                this.x = 50;
                this.y = 200;
            },
            up: function () { this.y -= this.speed; },
            down: function () { this.y += this.speed; },
            left: function () { this.x -= this.speed; },
            right: function () { this.x += this.speed; },
            change: function () {
                var xBound, yBound;
                if (this.alive) {
                    xBound = Juicy.canvas.width - this.width;
                    yBound = Juicy.canvas.height - this.height;
                    if (Juicy.Key.isDown(Juicy.Key.UP)) this.up();
                    if (Juicy.Key.isDown(Juicy.Key.LEFT)) this.left();
                    if (Juicy.Key.isDown(Juicy.Key.DOWN)) this.down();
                    if (Juicy.Key.isDown(Juicy.Key.RIGHT)) this.right();
                    if (this.x < 0) this.x = 0;
                    if (this.x > xBound) this.x = xBound;
                    if (this.y < 0) this.y = 0;
                    if (this.y > yBound) this.y = yBound;
                    this.collisionCheck();
                }
            },
            collisionCheck: function () {
                var ham = Juicy.collections.hams.isColliding(this);
                if (ham) {
                    lives -= 1;
                    ham.explode();
                }
                if (lives === 0) {
                    this.explode();
                }
            },
            explode: function () {
                var explosions = Juicy.collections.explosions;
                this.alive = false;
                this.repeat = false;
                explosions.add();
                explosions.collection[explosions.collection.length - 1].x = this.x;
                explosions.collection[explosions.collection.length - 1].y = this.y;
            }
        });
        return new Player();
    };

    var Bullet = Juicy.Base.extend({
        size: 3,
        color: "cyan",
        ratio: 1.1,
        img: "fork",
        alive: true,
        autodraw: false,
        width: 100,
        height: 100,
        init: function () {
            var ratio, rat = 10, player = Juicy._items.player;
            this.x = player.x + 48;
            this.y = player.y + 24;

            ratio = Math.sqrt((this.xSpeed * this.xSpeed) + (this.ySpeed * this.ySpeed));
            this.ang_ratio = ratio / rat;

            this.xSpeed /= this.ang_ratio;
            this.ySpeed /= this.ang_ratio;
        },
        draw: function () {
            if (this.alive) {
                Juicy.ctx.drawImage(Juicy.images[this.img], this.x - 50, this.y - 50);
            }
        },
        change: function () {
            if (this.alive) {
                this.x += 10;
            }
        },
        explode: function () {
            var explosions = Juicy.collections.explosions;
            this.alive = false;
            explosions.add();
            explosions.collection[explosions.collection.length - 1].x = this.x;
            explosions.collection[explosions.collection.length - 1].y = this.y;
        },
        isColliding: function (obj) {
            var x1 = this.x, y1 = this.y, w1 = this.width, h1 = this.height,
                x2 = obj.x, y2 = obj.y, w2 = obj.width, h2 = obj.height;
            if (w2 !== Infinity && w1 !== Infinity) {
                w2 += x2;
                w1 += x1;
                if (isNaN(w1) || isNaN(w2) || x2 > w1 || x1 > w2) return false;
            }
            if (y2 !== Infinity && h1 !== Infinity) {
                h2 += y2;
                h1 += y1;
                if (isNaN(h1) || isNaN(y2) || y2 > h1 || y1 > h2) return false;
            }
            return this;
        }
    });

    var Bullets = Juicy.Collection.extend({
        model: Bullet,
        timeout: true,
        filter: function (bullet) {
            return bullet.alive && !bullet.isOutOfBounds();
        },
        change: function () {
            var self = this;
            if (this.timeout && Juicy.Key.isDown(Juicy.Key.SPACE) && Juicy.getOrCreate("player").alive) {
                this.add();
                this.timeout = false;
                setTimeout(function () {
                    self.timeout = true;
                }, 500);
            }
        },
        isColliding: function (obj) {
            var i, collider;
            for (i = 0; i < this.collection.length; i++) {
                collider = this.collection[i].isColliding(obj);
                if (collider) {
                    return collider;
                }
            }
            return false;
        }
    });

    var Ham = Juicy.Base.extend({
        img: "ham",
        width: 100,
        height: 100,
        x: 640,
        health: 1,
        points: 1000,
        alive: true,
        speed: 5,
        init: function () {
            this.y = ~~(Math.random() * 380);
        },
        change: function () {
            this.x -= this.speed;
            this.collisionCheck();
        },
        collisionCheck: function () {
            var bullet = Juicy.collections.bullets.isColliding(this);
            if (bullet) {
                this.health -= 1;
                score += this.points + (500 * Juicy.collections.hams.hamModulus());
                bullet.explode();
            }
            if (this.health <= 0) {
                this.explode();
            }
        },
        explode: function () {
            var explosions = Juicy.collections.explosions;
            this.alive = false;
            explosions.add();
            explosions.collection[explosions.collection.length - 1].x = this.x;
            explosions.collection[explosions.collection.length - 1].y = this.y;
        },
        isColliding: function (obj) {
            var x1 = this.x, y1 = this.y, w1 = this.width, h1 = this.height,
                x2 = obj.x, y2 = obj.y, w2 = obj.width, h2 = obj.height;
            if (w2 !== Infinity && w1 !== Infinity) {
                w2 += x2;
                w1 += x1;
                if (isNaN(w1) || isNaN(w2) || x2 > w1 || x1 > w2) return false;
            }
            if (y2 !== Infinity && h1 !== Infinity) {
                h2 += y2;
                h1 += y1;
                if (isNaN(h1) || isNaN(y2) || y2 > h1 || y1 > h2) return false;
            }
            return this;
        }
    });

    var Hams = Juicy.Collection.extend({
        model: Ham,
        hamModulus: function () {
            return Math.floor(score / (10 * this.model.prototype.points));
        },
        tooMuchHams: 3,
        change: function () {
            var hams = this.hamModulus();
            if (hams > this.tooMuchHams) {
                hams = this.tooMuchHams;
            }
            if (this.collection.length <= hams) {
                this.add();
            }
        },
        filter: function (ham) {
            return ham.alive && ham.x > -100;
        },
        isColliding: function (obj) {
            var i, collider;
            for (i = 0; i < this.collection.length; i++) {
                collider = this.collection[i].isColliding(obj);
                if (collider) {
                    return collider;
                }
            }
            return false;
        }
    });

    var Explosion = Juicy.Animated.extend({
        img: "explosion",
        width: 64,
        height: 64,
        init: function () {
            this.x =  Juicy.mouse.x - 32;
            this.y = Juicy.mouse.y - 32;
            Juicy.sounds.explosion.stop();
            Juicy.sounds.explosion.play();
        }
    });

    var Explosions = Juicy.Collection.extend({
        model: Explosion,
        filter: function (explosion) {
            return !explosion.isFinished;
        }
    });

    var SHButton = Juicy.Base.extend({
        width: 75,
        height: 50,
        init: function (text, x, y, state, callback) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.state = state;
            this.callback = callback;
        },
        draw: function () {
            if (this.isHover()) {
                Juicy.ctx.fillStyle = "#ffbf00";
            } else {
                Juicy.ctx.fillStyle = "rgb(29, 150, 28)";
            }
            Juicy.ctx.fillRect(this.x, this.y, this.width, this.height);
            Juicy.drawText(this.text, this.x + 10, this.y + 30, "black", "bold 16px Comic Sans MS");
        },
        change: function () {
            if (this.isClicked()) {
                this.callback();
                state = this.state;
            }
        }
    });

    var pos = 0;

    var startGameButton = new SHButton("Play", 400, 400, "game", function () {
        score = 0;
        lives = 3;
        Juicy.setupCollections({
            hams: Hams,
            bullets: Bullets,
            explosions: Explosions
        });
        Juicy.canvas.style.backgroundImage = "url(images/bg_stars.gif)";
        Juicy.getOrCreate("player", createPlayer, true);
    });

    var drawScore = function () {
        Juicy.ctx.textAlign = "left";
        this.drawText("Score: " + score, 20, 20, "#FFF", "bold 12px sans-serif");
    };

    var drawLives = function () {
        var i;
        this.ctx.textAlign = "left";
        this.drawText("Clones: ", 20, 40, "#FFF", "bold 12px sans-serif");
        for (i = 0; i < lives; i++) {
            this.ctx.drawImage(Juicy.images.duck, 70 + (i * 20), 30, 16, 16);
        }
    };

    var runGame = function () {
        var player = this.getOrCreate("player", createPlayer);
        player.step();
        if (score > 4000000000) {
            this.canvas.style.backgroundImage = "url(images/disney.jpg)";
        }
        drawScore.call(this);
        drawLives.call(this);
        if (lives <= 0) {
            this.drawText("GAME\nOVER", 200, 200, "#FFF", "bold 100px sans-serif", 100);
            startGameButton.step();
        }
    };

    var titleScreen = function () {
        var xJig = randomRange(-5, 5);
        var yJig = randomRange(-5, 5);
        this.ctx.drawImage(Juicy.images.title, 90 + xJig, 50 + yJig, 445, 356);
        startGameButton.step();
    };

    var states = {
        title: titleScreen,
        game: runGame
    };

    Juicy.run(function () {
        this.canvas.style.backgroundPosition = "-" + pos + "px 0px";
        pos++;

        if (Juicy.percentLoaded() === "100%") {
            this.sounds.spacejam.play();
            states[state].call(this);
        } else {
            var x = Juicy.canvas.width / 2, y = Juicy.canvas.height / 2;
            Juicy.ctx.textAlign = "center";
            this.drawText(Juicy.percentLoaded(), x, y, "#FFF", "bold 34px sans-serif");
        }
    });
}());
