/*
 * Toader Game
 * Author: Phil Sanders
 * Email: phil@sourcetoad.com
 * Web: http://www.sourcetoad.com/
 */

var toader = {
  preload: function() {
    game.load.image('map',                'assets/img/map1.01.png');
    game.load.image('player',             'assets/img/toad.png');
    game.load.spritesheet('player_anim',  'assets/img/toad_anim.png', 40, 40);
    game.load.image('enemy_0',            'assets/img/car_white.png');
    game.load.image('enemy_1',            'assets/img/car_red.png');
    game.load.image('enemy_2',            'assets/img/car_blue.png');
    game.load.image('enemy_3',            'assets/img/car_yellow.png');
    game.load.image('enemy_4',            'assets/img/car_green.png');
    game.load.image('enemy_5',            'assets/img/car_purple.png');
    game.load.image('enemy_6',            'assets/img/car_pink.png');
    game.load.image('bullet',             'assets/img/bullet.png');
    game.load.spritesheet('point_coin',   'assets/img/point_coin.png', 32, 32, 4);
    game.load.spritesheet('power_pellet', 'assets/img/power_pellet.png', 32, 32, 4);
    game.load.spritesheet('explosion',    'assets/img/explosion1.png', 142, 200, 16);
    game.load.image('gameover',           'assets/img/gameover.png');
  },
  create: function() {
    //  Setup input
    this.cursors = game.input.keyboard.createCursorKeys();
    this.fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

    //  Scale game
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    //  Center game
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVeritcally = true;

    //  Enable P2JS Physics
    game.physics.startSystem(Phaser.Physics.P2JS);

    //  Turn on impact events for the world
    game.physics.p2.setImpactEvents(true);

    //  Make things a bit more bouncey
    game.physics.p2.defaultRestitution = 0.8;

    //  Collision Groups
    this.playerCG = game.physics.p2.createCollisionGroup();
    this.weaponCG = game.physics.p2.createCollisionGroup();
    this.enemyCG = game.physics.p2.createCollisionGroup();
    this.powerCG = game.physics.p2.createCollisionGroup();

    //  Collide with bounds
    game.physics.p2.updateBoundsCollisionGroup();

    //  Add the map background to the scene
    game.add.image(0, 0, 'map');

    //  Game Defaults
    this.scale = 1;
    this.lives = 3;
    this.points = 0;
    this.bulletTime = 0;
    this.gameTime = 0;
    this.playerSpeed = 65;
    this.playerRespawning = false;
    this.playerRespawnTime = 1200;
    this.powerPelletActive = false;
    this.powerPelletsRange = [1000, 2500, 3800, 5500, 7500, 9000];
    this.oneUpRange = [6000, 10000, 18000, 25000];
    this.enemyCount = 5;
    this.enemyPointsValue = 50;
    this.enemySpeed = 150;
    this.enemyLeft = [0, 350];
    this.enemyRight = [820, 250];
    this.enemyTop = [350, 0];
    this.enemyBottom = [450, 600];
    this.gameover = false;
    this.debug = false;
    this.debugHitResult = '';

    this.createPlayer();

    this.createEnemy();

    this.createTimer();

    this.gameTimer = game.time.events.loop(100, function(){
        this.updateTimer();
    }, this);

    this.createWeapon();

    //  Spawn enemies
    game.time.events.loop(Phaser.Timer.SECOND * 3.2, function() {
      this.spawnEnemy(this.enemyRight[0], this.enemyRight[1], 'left');
    }, this);
    game.time.events.loop(Phaser.Timer.SECOND * 4.2, function() {
      this.spawnEnemy(this.enemyLeft[0], this.enemyLeft[1], 'right');
    }, this);
    game.time.events.loop(Phaser.Timer.SECOND * 4, function() {
      this.spawnEnemy(this.enemyBottom[0], this.enemyBottom[1], 'up');
    }, this);
    game.time.events.loop(Phaser.Timer.SECOND * 3.2, function() {
      this.spawnEnemy(this.enemyTop[0], this.enemyTop[1], 'down');
    }, this);
  },
  createPlayer: function() {
    this.player = game.add.sprite(400, 300, 'player_anim');
    this.player.smoothed = false;
    // this.player.scale.set(this.scale);

    //  Enable player physics
    game.physics.p2.enable(this.player, this.debug);

    //  Setup player body
    this.player.body.setCircle(18);
    this.player.body.setZeroDamping();
    this.player.body.fixedRotation = false;
    this.player.body.kinematic = false;

    //  Player collision group
    this.player.body.setCollisionGroup(this.playerCG);
    this.player.body.collides([this.enemyCG, this.powerCG]);
    this.player.body.collideWorldBounds = true;

    //  Check for the block hitting another object
    this.player.body.onBeginContact.add(this.playerCollides, this);

    //  Player animations
    this.player.animations.add('stand', [0], 1, true);
    this.player.animations.add('up', [ 1, 0, 0 ], 10, true);
    this.player.animations.add('down', [ 5, 4, 4 ], 10, true);
    this.playerLeft = this.player.animations.add('left', [ 3, 2, 2 ], 10, true);
    this.playerRight = this.player.animations.add('right', [ 7, 6, 6 ], 10, true);

    this.playerLeft.enableUpdate = true;
    this.playerRight.enableUpdate = true;
  },
  playerController: function() {
    if (this.cursors.left.isDown) {
        this.player.play('left');
        this.player.body.moveLeft(this.playerSpeed);
        this.player.body.angle = -90;
    }
    else if (this.cursors.right.isDown) {
        this.player.play('right');
        this.player.body.moveRight(this.playerSpeed);
        this.player.body.angle = 90;
    }
    else if (this.cursors.up.isDown) {
        this.player.play('up');
        this.player.body.moveUp(this.playerSpeed);
        this.player.body.angle = 0;
    }
    else if (this.cursors.down.isDown) {
        this.player.play('down');
        this.player.body.moveDown(this.playerSpeed);
        this.player.body.angle = -180;
    }
    else {
      this.stopPlayerAnim()
    }
  },
  playerCollides: function(body) {
    if (body) {
      if (body.sprite.key !== 'point_coin' && body.sprite.key !== 'power_pellet') {
        if (this.lives > 1) {
          this.lives -= 1;
          this.playerRespawning = true;
          this.player.kill();
          this.respawnPlayer();
        }
        else {
          this.player.kill();
          this.gameover = true;
          this.gameOverText = game.add.button(game.world.centerX, game.world.centerY, 'gameover', this.restartGame, this, 2, 1, 0);
          this.gameOverText.anchor.x = 0.5;
          this.gameOverText.anchor.y = 0.5;
        }

        // reset power up
        this.powerPelletActive = false;

        // Debug onBeginContact bodies
        if (this.debug) {
          if (body) {
            this.debugHitResult = 'You last hit: ' + body.sprite.key;
          }
          else {
            this.debugHitResult = 'You last hit: The wall :)';
          }
        }
      }
    }
  },
  createWeapon: function() {
    //  Weapon group
    this.weapon = game.add.group();
    this.weapon.createMultiple(10, 'bullet');
    this.weapon.enableBody = true;
    this.weapon.physicsBodyType = Phaser.Physics.P2JS;
    game.physics.p2.enable(this.weapon, this.debug);
    this.weapon.setAll('anchor.x', 0.5);
    this.weapon.setAll('anchor.y', 0.5);
    this.weapon.setAll('outOfBoundsKill', true);
    this.weapon.setAll('checkWorldBounds', true);
    this.weapon.forEach(function(e) {
      e.body.setCollisionGroup(this.weaponCG);
      e.body.collides(this.enemyCG);
      e.scale.set(this.scale);
      e.body.fixedRotation = false;
      e.body.onBeginContact.add(function() {
        e.kill();
      }, this);
    }, this);
  },
  createEnemy: function() {
    this.enemies = game.add.group();
    this.enemies.createMultiple(this.enemyCount, 'enemy_0');
    this.enemies.enableBody = true;
    this.enemies.smoothed = false;
    // enemies.scale.set(scale);
    this.enemies.physicsBodyType = Phaser.Physics.P2JS;
    game.physics.p2.enable(this.enemies, this.debug);
    this.enemies.setAll('anchor.x', 0.5);
    this.enemies.setAll('anchor.y', 0.5);
    this.enemies.setAll('checkWorldBounds', true);
    this.enemies.setAll('outOfBoundsKill', true);
    this.enemies.forEach(function(e) {
      // randomize textures
      var newEnemy = 'enemy_' + game.rnd.integerInRange(0, 6);

      e.loadTexture(newEnemy, 0, false);
      e.body.setRectangle(90, 40);
      e.body.setCollisionGroup(this.enemyCG);
      e.body.fixedRotation = false;
      e.body.kinematic = true;
      e.body.collides(this.weaponCG, function() {
        // destroy enemy
        e.kill();

        // explode on kill
        var explode = this.explosions.getFirstExists(false);
        explode.reset(e.body.x, e.body.y);
        explode.play('explosion', 30, false, true);

        if (this.powerPelletsRange.indexOf(this.points) > -1 && this.powerPelletActive !== true) {
          // leave a power pellet
          var power = this.power_pellets.getFirstExists(false);
          power.reset(e.body.x, e.body.y);
          power.play('power_pellet', 16, true);
          game.time.events.add(Phaser.Timer.SECOND + 12000, function() {
            power.kill();
          });
        }
        else {
          // leave a point coin
          var point = this.point_coins.getFirstExists(false);
          point.reset(e.body.x, e.body.y);
          point.play('point_coin', 16, true);
          game.time.events.add(Phaser.Timer.SECOND + 4000, function() {
            point.kill();
          });
        }

      }, this);
    }, this);

    //  Explosion pool
    this.explosions = game.add.group();
    this.explosions.createMultiple(20, 'explosion');
    this.explosions.setAll('anchor.x', 0.5);
    this.explosions.setAll('anchor.y', 0.5);
    this.explosions.forEach(function(e) {
      e.animations.add('explosion');
    });

    // Point Coin pool
    this.point_coins = game.add.group();
    this.point_coins.createMultiple(20, 'point_coin');
    this.point_coins.physicsBodyType = Phaser.Physics.P2JS;
    game.physics.p2.enable(this.point_coins, this.debug);
    this.point_coins.setAll('anchor.x', 0.5);
    this.point_coins.setAll('anchor.y', 0.5);
    this.point_coins.forEach(function(e) {
      e.body.setCircle(14);
      e.body.setCollisionGroup(this.powerCG);
      e.body.collides(this.playerCG);
      // e.scale.set(scale);
      e.body.data.shapes[0].sensor = true;
      e.body.kinematic = false;
      e.animations.add('point_coin');
      e.body.onBeginContact.add(function() {
        e.kill();
        this.points += this.enemyPointsValue;
      }, this);
    }, this);

    // Power Pellet pool
    this.power_pellets = game.add.group();
    this.power_pellets.createMultiple(10, 'power_pellet');
    this.power_pellets.physicsBodyType = Phaser.Physics.P2JS;
    game.physics.p2.enable(this.power_pellets, this.debug);
    this.power_pellets.setAll('anchor.x', 0.5);
    this.power_pellets.setAll('anchor.y', 0.5);
    this.power_pellets.forEach(function(e) {
      e.body.setCircle(20);
      e.body.setCollisionGroup(this.powerCG);
      e.body.collides(this.playerCG);
      // e.scale.set(scale);
      e.body.data.shapes[0].sensor = true;
      e.body.kinematic = false;
      e.animations.add('power_pellet');
      e.body.onBeginContact.add(function() {
        e.kill();
        this.powerPelletActive = true;
      }, this);
    }, this);
  },
  spawnEnemy: function(xPos, yPos, direction) {
    var enemy = this.enemies.getFirstExists(false);

    if (enemy) {
      enemy.reset(xPos, yPos);
      enemy.body.collides([this.enemyCG, this.playerCG, this.weaponCG]);

      switch (direction) {
        case 'left':
          enemy.body.angle = 0;
          enemy.body.moveLeft(this.enemySpeed);
          break;
        case 'right':
          enemy.body.angle = -180;
          enemy.body.moveRight(this.enemySpeed);
          break;
        case 'up':
          enemy.body.angle = 90;
          enemy.body.moveUp(this.enemySpeed);
          break;
        case 'down':
          enemy.body.angle = -90;
          enemy.body.moveDown(this.enemySpeed);
          break;
      }
    }
  },
  fireWeapon: function() {
    if (!this.gameover && !this.playerRespawning && game.time.now > this.bulletTime) {
      //  Grab a bullet from the pool
      var bullet = this.weapon.getFirstExists(false);

      if (bullet) {
        var angle = this.player.body.angle;

        switch (angle) {
          case 0:
            bullet.reset(this.player.x, this.player.y - 15);
            bullet.body.angle = this.player.body.angle;
            bullet.body.moveUp(400);
            break;
          case -180:
            bullet.reset(this.player.x, this.player.y + 15);
            bullet.body.angle = this.player.body.angle;
            bullet.body.moveDown(400);
            break;
          case -90:
            bullet.reset(this.player.x - 15, this.player.y);
            bullet.body.angle = this.player.body.angle;
            bullet.body.moveLeft(400);
            break;
          case 90:
            bullet.reset(this.player.x + 15, this.player.y);
            bullet.body.angle = this.player.body.angle;
            bullet.body.moveRight(400);
            break;
        }

        this.bulletTime = game.time.now + 300;
      }
    }
  },
  createTimer: function() {
    this.startTime = new Date();
    this.totalTime = 120;
    this.timeElapsed = 0;

    this.timeLabel = game.add.text(game.world.centerX, 20, "00:00", {font: "20px Arial", fill: "#fff"});
    this.timeLabel.anchor.setTo(0.5, 0.5);
    this.timeLabel.align = 'center';
  },
  updateTimer: function() {
    if (!this.gameover) {
      this.currentTime = new Date();
      this.timeDifference = this.startTime.getTime() - this.currentTime.getTime();

      //Time elapsed in seconds
      this.timeElapsed = Math.abs(this.timeDifference / 1000);

      //Time remaining in seconds
      this.timeRemaining = this.timeElapsed;

      //Convert seconds into minutes and seconds
      var minutes = Math.floor(this.timeRemaining / 60);
      var seconds = Math.floor(this.timeRemaining) - (60 * minutes);

      //Display minutes, add a 0 to the start if less than 10
      var result = (minutes < 10) ? "0" + minutes : minutes;

      //Display seconds, add a 0 to the start if less than 10
      result += (seconds < 10) ? ":0" + seconds : ":" + seconds;

      this.timeLabel.text = result;
    }
  },
  stopPlayerAnim: function() {
    if (!this.isOddFrameNum(this.player.animations.currentAnim.frame)) {
      this.player.animations.stop();
    }
  },
  isOddFrameNum: function(n) {
    return n == parseFloat(n) && !!(n % 2);
  },
  respawnPlayer: function() {
    if (this.playerRespawning) {
      game.time.events.add(this.playerRespawnTime / 4, function() {
        // player.reset(player.x, player.y); // respawn in place
        this.player.reset(game.world.centerX, game.world.centerY); // respawn centered
        this.player.body.angle = 0;
        this.player.alpha = 0.4;
        this.player.scale.set(1);

        game.time.events.add(this.playerRespawnTime / 4, function() {
          this.player.alpha = 0.6;

          game.time.events.add(this.playerRespawnTime / 4, function() {
            this.player.alpha = 0.8;

            game.time.events.add(this.playerRespawnTime / 4, function() {
              this.player.alpha = 1;
              this.playerRespawning = false;

            }, this).autoDestroy = true;
          }, this).autoDestroy = true;
        }, this).autoDestroy = true;
      }, this).autoDestroy = true;
    }
  },
  restartGame: function() {
    this.lives = 3;
    this.points = 0;
    this.gameover = false;
    game.state.restart();
  },
  update: function () {
    this.player.body.setZeroVelocity();

    if (!this.playerRespawning) {
      // Move Player
      this.playerController();
      //  Fire Weapon
      if (this.fireButton.isDown) {
        this.fireWeapon();
      }
      if (this.powerPelletActive) {
        this.player.scale.set(2);
      }
    }
    else {
      this.stopPlayerAnim();
    }
  },
  render: function() {
    //  Display Lives and Points
    game.debug.text('Lives: ' + this.lives, 20, 20);
    game.debug.text('Points: ' + this.points, 130, 20);

    //  Debug bodies
    if (this.debug) {
      game.debug.spriteInfo(this.player, 20, 500);
      game.debug.text('Player Anim Frame: ' + this.player.frame, 20, 50);
      game.debug.text(this.debugHitResult, 20, 70);
    }
  }
};

var game = new Phaser.Game(800, 600, Phaser.auto, 'toader');
game.state.add('toader', toader);
game.state.start('toader');
