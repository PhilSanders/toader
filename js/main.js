/*
 * Toader Game
 * Author: Phil Sanders
 * Email: phil@sourcetoad.com
 * Web: http://www.sourcetoad.com/
 */

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'toader', {
  preload:      preload,
  create:       create,
  update:       update,
  render:       render
});

//  Set globals
var scale = 1,
    lives = 3,
    points = 0,
    bulletTime = 0,
    gameTime = 0,
    playerSpeed = 65,
    playerRespawning = false,
    playerRespawnTime = 1200,
    enemyCount = 5,
    enemyPointsValue = 50,
    enemySpeed = 150,
    enemyLeft = [0, 350],
    enemyRight = [820, 250],
    enemyTop = [350, 0],
    enemyBottom = [450, 600],
    gameover = false,
    debug = false,
    debugHitResult = '';

function preload() {
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
}

function create() {
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
  var playerCG = game.physics.p2.createCollisionGroup(),
      weaponCG = game.physics.p2.createCollisionGroup(),
      enemyCG = game.physics.p2.createCollisionGroup(),
      powerCG = game.physics.p2.createCollisionGroup();

  //  Collide with bounds
  game.physics.p2.updateBoundsCollisionGroup();

  //  Add the map background to the scene
  game.add.image(0, 0, 'map');

  //  Make Player
  createPlayer(playerCG, enemyCG, powerCG);

  //  Make Enemies
  createEnemy(enemyCG, weaponCG);

  startTime = new Date();
  totalTime = 120;
  timeElapsed = 0;

  createTimer();

  gameTimer = game.time.events.loop(100, function(){
      updateTimer();
  });

  //  Weapon group
  weapon = game.add.group();
  weapon.createMultiple(10, 'bullet');
  weapon.enableBody = true;
  weapon.physicsBodyType = Phaser.Physics.P2JS;
  game.physics.p2.enable(weapon, debug);
  weapon.setAll('anchor.x', 0.5);
  weapon.setAll('anchor.y', 0.5);
  weapon.setAll('outOfBoundsKill', true);
  weapon.setAll('checkWorldBounds', true);
  weapon.forEach(function(e) {
    e.body.setCollisionGroup(weaponCG);
    e.body.collides(enemyCG);
    e.scale.set(scale);
    e.body.fixedRotation = false;
    e.body.onBeginContact.add(function() {
      e.kill();
      // points += enemyPointsValue;
    }, this);
  });

  //  Explosion group
  explosions = game.add.group();
  explosions.createMultiple(30, 'explosion');
  explosions.setAll('anchor.x', 0.5);
  explosions.setAll('anchor.y', 0.5);
  explosions.forEach(function(e) {
    e.animations.add('explosion');
  });

  // Power Pellets group
  point_coins = game.add.group();
  point_coins.createMultiple(100, 'point_coin');
  point_coins.enableBody = false;
  point_coins.physicsBodyType = Phaser.Physics.P2JS;
  game.physics.p2.enable(point_coins, debug);
  point_coins.setAll('anchor.x', 0.5);
  point_coins.setAll('anchor.y', 0.5);
  point_coins.forEach(function(e) {
    e.body.setCircle(14);
    e.body.setCollisionGroup(powerCG);
    e.body.collides(playerCG);
    // e.scale.set(scale);
    e.body.data.shapes[0].sensor = true;
    e.body.kinematic = false;
    e.animations.add('point_coin');
    e.body.onBeginContact.add(function() {
      e.kill();
      points += enemyPointsValue;
    }, this);
  });

  //  Spawn enemies
  game.time.events.loop(Phaser.Timer.SECOND * 3.2, function() {
    spawnEnemy(enemies, enemyCG, playerCG, weaponCG, enemyRight[0], enemyRight[1], 'left', enemySpeed);
  }, this);
  game.time.events.loop(Phaser.Timer.SECOND * 4.2, function() {
    spawnEnemy(enemies, enemyCG, playerCG, weaponCG, enemyLeft[0], enemyLeft[1], 'right', enemySpeed);
  }, this);
  game.time.events.loop(Phaser.Timer.SECOND * 4, function() {
    spawnEnemy(enemies, enemyCG, playerCG, weaponCG, enemyBottom[0], enemyBottom[1], 'up', enemySpeed);
  }, this);
  game.time.events.loop(Phaser.Timer.SECOND * 3.2, function() {
    spawnEnemy(enemies, enemyCG, playerCG, weaponCG, enemyTop[0], enemyTop[1], 'down', enemySpeed);
  }, this);

  //  Setup input
  cursors = game.input.keyboard.createCursorKeys();
  fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

}

function update() {
  player.body.setZeroVelocity();

  if (!playerRespawning) {
    if (cursors.left.isDown) {
      // if (player.x > 300) { // player left bounds
        player.play('left');
        player.body.moveLeft(playerSpeed);
        player.body.angle = -90;
      // }
    }
    else if (cursors.right.isDown) {
      // if (player.x < 500) { // player right bounds
        player.play('right');
        player.body.moveRight(playerSpeed);
        player.body.angle = 90;
      // }
    }
    else if (cursors.up.isDown) {
      // if (player.y > 200) { // player upper bounds
        player.play('up');
        player.body.moveUp(playerSpeed);
        player.body.angle = 0;
      // }
    }
    else if (cursors.down.isDown) {
      // if (player.y < 400) { // player lower bounds
        player.play('down');
        player.body.moveDown(playerSpeed);
        player.body.angle = -180;
      // }
    }
    else {
      stopPlayer()
    }

    //  Fire Weapon
    if (fireButton.isDown) {
      fireBullet();
    }
  }
  else {
    stopPlayer()
  }
}

function createPlayer(playerCG, enemyCG, powerCG) {
  player = game.add.sprite(400, 300, 'player_anim');
  player.smoothed = false;
  player.scale.set(scale);

  //  Enable player physics
  game.physics.p2.enable(player, debug);

  //  Setup player body
  player.body.setCircle(16);
  player.body.setZeroDamping();
  player.body.fixedRotation = false;
  player.body.kinematic = false;

  //  Player collision group
  player.body.setCollisionGroup(playerCG);
  player.body.collides([enemyCG, powerCG]);
  player.body.collideWorldBounds = true;

  //  Check for the block hitting another object
  player.body.onBeginContact.add(updatePlayerStatus, this);

  //  Player animations
  player.animations.add('stand', [0], 1, true);
  player.animations.add('up', [ 1, 0, 0 ], 10, true);
  player.animations.add('down', [ 5, 4, 4 ], 10, true);
  playerLeft = player.animations.add('left', [ 3, 2, 2 ], 10, true);
  playerRight = player.animations.add('right', [ 7, 6, 6 ], 10, true);

  playerLeft.enableUpdate = true;
  playerRight.enableUpdate = true;
}

function createEnemy(enemyCG, weaponCG) {
  enemies = game.add.group();
  enemies.createMultiple(enemyCount, 'enemy_0');
  enemies.enableBody = true;
  enemies.smoothed = false;
  // enemies.scale.set(scale);
  enemies.physicsBodyType = Phaser.Physics.P2JS;
  game.physics.p2.enable(enemies, debug);
  enemies.setAll('anchor.x', 0.5);
  enemies.setAll('anchor.y', 0.5);
  enemies.setAll('checkWorldBounds', true);
  enemies.setAll('outOfBoundsKill', true);
  enemies.forEach(function(e) {
    // randomize textures
    var newEnemy = 'enemy_' + game.rnd.integerInRange(0, 6);

    e.loadTexture(newEnemy, 0, false);
    e.body.setRectangle(90, 40);
    e.body.setCollisionGroup(enemyCG);
    e.body.fixedRotation = false;
    e.body.kinematic = true;
    e.body.collides(weaponCG, function() {
      e.kill();
      // explode on kill
      var explode = explosions.getFirstExists(false);
      explode.reset(e.body.x, e.body.y);
      explode.play('explosion', 30, false, true);

      // leave a power pellet on colision
      var point = point_coins.getFirstExists(false);
      point.reset(e.body.x, e.body.y);
      point.play('point_coin', 16, true);

      game.time.events.add(Phaser.Timer.SECOND + 4800, function() {
        point.kill();
      });
    });
  });

  return enemies;
}

function spawnEnemy(enemies, enemyCG, playerCG, weaponCG, xPos, yPos, direction, speed) {
  var enemy = enemies.getFirstExists(false);

  if (enemy) {
    enemy.reset(xPos, yPos);
    enemy.body.collides([enemyCG, playerCG, weaponCG]);

    switch (direction) {
      case 'left':
        enemy.body.angle = 0;
        enemy.body.moveLeft(speed);
        break;
      case 'right':
        enemy.body.angle = -180;
        enemy.body.moveRight(speed);
        break;
      case 'up':
        enemy.body.angle = 90;
        enemy.body.moveUp(speed);
        break;
      case 'down':
        enemy.body.angle = -90;
        enemy.body.moveDown(speed);
        break;
    }
  }
}

function fireBullet() {
  if (!gameover && !playerRespawning && game.time.now > bulletTime) {
    //  Grab a bullet from the pool
    var bullet = weapon.getFirstExists(false);

    if (bullet) {
      var angle = player.body.angle;

      switch (angle) {
        case 0:
          bullet.reset(player.x, player.y - 15);
          bullet.body.angle = player.body.angle;
          bullet.body.moveUp(400);
          break;
        case -180:
          bullet.reset(player.x, player.y + 15);
          bullet.body.angle = player.body.angle;
          bullet.body.moveDown(400);
          break;
        case -90:
          bullet.reset(player.x - 15, player.y);
          bullet.body.angle = player.body.angle;
          bullet.body.moveLeft(400);
          break;
        case 90:
          bullet.reset(player.x + 15, player.y);
          bullet.body.angle = player.body.angle;
          bullet.body.moveRight(400);
          break;
      }

      bulletTime = game.time.now + 300;
    }
  }
}

function updatePlayerStatus(body) {
  if (body && body.sprite.key !== 'point_coin') {
    if (gameover === true) {
      player.kill();
    }
    else if (lives > 1) {
      lives -= 1;
      playerRespawning = true;
      player.kill();
      respawnPlayer();
    }
    else {
      player.kill();
      gameover = true;
      gameOverText = game.add.button(game.world.centerX, game.world.centerY, 'gameover', restartGame, this, 2, 1, 0);
      gameOverText.anchor.x = 0.5;
      gameOverText.anchor.y = 0.5;
    }

    // Debug onBeginContact bodies
    if (debug) {
      if (body) {
        debugHitResult = 'You last hit: ' + body.sprite.key;
      }
      else {
        debugHitResult = 'You last hit: The wall :)';
      }
    }
  }
}

function respawnPlayer() {
  if (playerRespawning) {
    game.time.events.add(playerRespawnTime / 4, function() {
      // player.reset(player.x, player.y); // respawn in place
      player.reset(game.world.centerX, game.world.centerY); // respawn centered
      player.body.angle = 0;
      player.alpha = 0.4;
      player.scale.set(1);

      game.time.events.add(playerRespawnTime / 4, function() {
        player.alpha = 0.6;

        game.time.events.add(playerRespawnTime / 4, function() {
          player.alpha = 0.8;

          game.time.events.add(playerRespawnTime / 4, function() {
            player.alpha = 1;
            playerRespawning = false;

          }, this).autoDestroy = true;
        }, this).autoDestroy = true;
      }, this).autoDestroy = true;
    }, this).autoDestroy = true;
  }
}

function stopPlayer() {
  if (!isOdd(player.animations.currentAnim.frame)) {
    player.animations.stop();
  }
}

function createTimer() {
  timeLabel = game.add.text(game.world.centerX, 20, "00:00", {font: "20px Arial", fill: "#fff"});
  timeLabel.anchor.setTo(0.5, 0.5);
  timeLabel.align = 'center';
}

function updateTimer() {
  if (!gameover) {
    var currentTime = new Date();
    var timeDifference = startTime.getTime() - currentTime.getTime();

    //Time elapsed in seconds
    timeElapsed = Math.abs(timeDifference / 1000);

    //Time remaining in seconds
    var timeRemaining = timeElapsed;

    //Convert seconds into minutes and seconds
    var minutes = Math.floor(timeRemaining / 60);
    var seconds = Math.floor(timeRemaining) - (60 * minutes);

    //Display minutes, add a 0 to the start if less than 10
    var result = (minutes < 10) ? "0" + minutes : minutes;

    //Display seconds, add a 0 to the start if less than 10
    result += (seconds < 10) ? ":0" + seconds : ":" + seconds;

    timeLabel.text = result;
  }
}

function isOdd(n) {
  return n == parseFloat(n) && !!(n % 2);
}

function restartGame() {
  lives = 3;
  points = 0;
  gameover = false;
  game.state.restart();
}

function render() {
  //  Display Lives and Points
  game.debug.text('Lives: ' + lives, 20, 20);
  game.debug.text('Points: ' + points, 130, 20);
  // game.debug.text('Time: ' + gameTime, 250, 20);

  //  Debug bodies
  if (debug) {
    game.debug.spriteInfo(player, 20, 500);
    game.debug.text('Player Anim Frame: ' + player.frame, 20, 50);
    game.debug.text(debugHitResult, 20, 70);
  }
}
