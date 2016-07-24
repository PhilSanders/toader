/*
 * Toader Phaser Game
 * Author: Phil Sanders
 * Email: phil@sourcetoad.com
 * Web: http://www.sourcetoad.com/
 */

var game = new Phaser.Game(800, 800, Phaser.CANVAS, 'toader', {
	preload: preload,
	create:  create,
	update:  update,
	render:  render
});

//  Set globals
var scale = 1;
var lives = 3;
var points = 0;
var enemyValue = 10;
var bulletTime = 0;
var playerRespawnTime = 0;
var playerBounds = new Phaser.Rectangle( 280, 180, 240, 235 );
var playerRespawn = false;
var gameover = false;
var debug = false;

var result = '';

function preload() {
	game.load.image('map','assets/img/map1.01.png');
    game.load.image('player','assets/img/toad.png');
	game.load.spritesheet('player_anim','assets/img/toad_anim.png', 40, 40);
    game.load.image('enemy_0','assets/img/car.png');
	game.load.image('enemy_1','assets/img/car_red.png');
	game.load.image('enemy_2','assets/img/car_blue.png');
	game.load.image('enemy_3','assets/img/car_yellow.png');
	game.load.image('enemy_4','assets/img/car_green.png');
	game.load.image('enemy_5','assets/img/car_purple.png');
	game.load.image('enemy_6','assets/img/car_pink.png');
	game.load.image('bullet','assets/img/bullet.png');
	game.load.spritesheet('explosion','assets/img/explosion1.png', 142, 200, 16);
}

function create(){
	//  Scale game
	game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	//game.scale.setScreenSize(true);
	//  Center game
	game.scale.pageAlignHorizontally = true;
	game.scale.pageAlignVeritcally = true;
	//  Enable P2JS Physics
	game.physics.startSystem(Phaser.Physics.P2JS);
	//  Turn on impact events for the world, without this we get no collision callbacks
    game.physics.p2.setImpactEvents(true);
	//  Make things a bit more bouncey
    game.physics.p2.defaultRestitution = 0.8;

	//  Collision Groups
    var playerCG = game.physics.p2.createCollisionGroup();
    var weaponCG = game.physics.p2.createCollisionGroup();
	var enemyCG = game.physics.p2.createCollisionGroup();

	//  Collide with bounds
    //game.physics.p2.updateBoundsCollisionGroup();

	//  Add the map background to the scene
	game.add.image(0, 0, 'map');

	//  Add player
	var player = createPlayer(playerCG,enemyCG);

	//  Add enemy
	var enemies = createEnemy(enemyCG,weaponCG);

	//  Spawn enemies
	game.time.events.repeat(Phaser.Timer.SECOND * 3.2, 20, function(){
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,820,250,'left');
	});
	game.time.events.repeat(Phaser.Timer.SECOND * 4.2, 20, function(){
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,0,350,'right');
	});
	game.time.events.repeat(Phaser.Timer.SECOND * 4, 20, function(){
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,450,600,'up');
	});
	game.time.events.repeat(Phaser.Timer.SECOND * 3.2, 20, function(){
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,350,0,'down');
	});

	//  Weapon group
	weapon = game.add.group();
	weapon.createMultiple(30,'bullet');
	weapon.enableBody = true;
	weapon.physicsBodyType = Phaser.Physics.P2JS;
	game.physics.p2.enable(weapon, debug);
	weapon.setAll('anchor.x', 0.5);
	weapon.setAll('anchor.y', 0.5);
    weapon.setAll('outOfBoundsKill', true);
    weapon.setAll('checkWorldBounds', true);
	weapon.forEach(function(e){
		e.body.setCollisionGroup(weaponCG);
		e.body.fixedRotation = false;
		e.scale.set(scale);
		e.body.collides(enemyCG);
		//  Check for the block hitting another object
    	e.body.onBeginContact.add(function(){
			e.kill();
			points += enemyValue;
		}, this);
	});

	//  Explosion group
	explosions = game.add.group();
	explosions.createMultiple(30, 'explosion');
	explosions.forEach(function(e){
		e.anchor.x = 0.5;
		e.anchor.y = 0.5;
		e.animations.add('explosion');
	});

	//  Setup input
    cursors = game.input.keyboard.createCursorKeys();
	fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

}

function update() {
	var playerSpeed = 65;
	player.body.setZeroVelocity();
    if (cursors.left.isDown){
		player.play('left');
    	player.body.moveLeft(playerSpeed);
		player.body.angle = -90;
    }
    else if (cursors.right.isDown){
		player.play('right');
    	player.body.moveRight(playerSpeed);
		player.body.angle = 90;
    }
    else if (cursors.up.isDown){
		player.play('up');
    	player.body.moveUp(playerSpeed);
		player.body.angle = 0;
    }
    else if (cursors.down.isDown){
		player.play('down');
    	player.body.moveDown(playerSpeed);
		player.body.angle = -180;
    }
	else {
		if (!isOdd(player.animations.currentAnim.frame)){
			player.animations.stop();
		}
	}

	//  Firing?
	if (fireButton.isDown){
		fireBullet();
	}

	//  Points
	//tallyPoints(points)

	//  Respawn the player after a few seconds
	respawnPlayer();

	//  Check if player is inside playBounds
	//stayInBoundingBox(player, playerBounds);
}

function tallyPoints(points){
	console.log(points);
	if(points === 0){
		var pointsText = game.add.text(20, 300, points, {
			font: '24px Arial',
			fill: '#FFF'
		});
	}
	else {
		pointsText.setText(points);
	}
}

function createPlayer(playerCG,enemyCG){
	player = game.add.sprite(400, 300, 'player_anim');
	player.smoothed = false;
	player.scale.set(scale);

	//  Enable player physics
	game.physics.p2.enable(player, debug);
	//  Setup player body
	player.body.setRectangle(32,32);
	player.body.setZeroDamping();
	player.body.fixedRotation = false;
	player.body.kinematic = false;

	//  Player collision group
	player.body.setCollisionGroup(playerCG);
	player.body.collides(enemyCG);
	player.body.collideWorldBounds = true;

	//  Check for the block hitting another object
    player.body.onBeginContact.add(killPlayer, this);

	//  Player animations
	player.animations.add('stand',[0],1,true);
	player.animations.add('up',[1,0,0],10,true);
	player.animations.add('down',[5,4,4],10,true);
	playerLeft = player.animations.add('left',[3,2,2],10,true);
	playerRight = player.animations.add('right',[7,6,6],10,true);

	playerLeft.enableUpdate = true;
	playerRight.enableUpdate = true;
}

function createEnemy(enemyCG,weaponCG){
	enemies = game.add.group();
	enemies.createMultiple(30, 'enemy_0');
    enemies.enableBody = true;
	enemies.smoothed = false;
	//enemies.scale.set(scale);
    enemies.physicsBodyType = Phaser.Physics.P2JS;
	game.physics.p2.enable(enemies, debug);
	enemies.setAll('anchor.x', 0.5);
	enemies.setAll('anchor.y', 0.5);
    enemies.setAll('checkWorldBounds', true);
	enemies.setAll('outOfBoundsKill', true);
	enemies.forEach(function(e){
		// randomize textures
		var newEnemy = 'enemy_' + game.rnd.integerInRange(0, 6);
		e.loadTexture(newEnemy, 0, false);
		e.body.setCollisionGroup(enemyCG);
		e.body.fixedRotation = false;
		e.body.kinematic = true;
		e.body.collides(weaponCG, function(){
			var explode = explosions.getFirstExists(false);
			explode.reset(e.body.x, e.body.y);
			explode.play('explosion', 30, false, true);
			e.kill();
			//console.log('Kill Enemy');
		});
	});
	return enemies;
}

function spawnEnemy(enemies,enemyCG,playerCG,weaponCG,xPos,yPos,direction){
	var enemy = enemies.getFirstExists(false),
		speed = 150;
	enemy.reset(xPos, yPos);
	enemy.body.collides([enemyCG,playerCG,weaponCG]);

	if (direction == 'left'){
		enemy.body.angle = 0;
		enemy.body.moveLeft(speed);
	}
	if (direction == 'right'){
		enemy.body.angle = -180;
		enemy.body.moveRight(speed);
	}
	if (direction == 'up'){
		enemy.body.angle = 90;
		enemy.body.moveUp(speed);
	}
	if (direction == 'down'){
		enemy.body.angle = -90;
		enemy.body.moveDown(speed);
	}
}

function fireBullet () {
    if (gameover === false && playerRespawn === false && game.time.now > bulletTime){
		//  Grab a bullet from the pool
		bullet = weapon.getFirstExists(false);
		if (bullet){
			//  Fire the direction the player is facing
			if(player.body.angle == 0){
				bullet.reset(player.x, player.y - 15);
				bullet.body.angle = player.body.angle;
				bullet.body.moveUp(400);
			}
			if(player.body.angle == -180){
				bullet.reset(player.x, player.y + 15);
				bullet.body.angle = player.body.angle;
				bullet.body.moveDown(400);
			}
			if(player.body.angle == -90){
				bullet.reset(player.x - 15, player.y);
				bullet.body.angle = player.body.angle;
				bullet.body.moveLeft(400);
			}
			if(player.body.angle == 90){
				bullet.reset(player.x + 15, player.y);
				bullet.body.angle = player.body.angle;
				bullet.body.moveRight(400);
			}
			bulletTime = game.time.now + 400;
		}
	}
}

function killPlayer (body) {
    if (gameover === true) {
		player.kill();
	}
	else if (lives > 1){
		lives -= 1;
		playerRespawn = true;
		player.kill();
		//console.log(lives);
		console.log('Kill Player');
	}
	else {
		player.kill();
		gameover = true;
		var gameOverText = game.add.text(400, 300, 'GAME OVER', {
			font: '48px Arial',
			fill: '#FFF'
		});
		gameOverText.anchor.x = 0.5;
		gameOverText.anchor.y = 0.5;
	}

	if (body){
        result = 'You last hit: ' + body.sprite.key;
    }
    else {
        result = 'You last hit: The wall :)';
    }
}

function respawnPlayer(){
	if (gameover === false && playerRespawn === true){
		playerRespawn = false;
		game.time.events.add(Phaser.Timer.SECOND + 600, function(){
			player.reset(player.body.x,player.body.y);
			console.log('player respawn');
		}, this).autoDestroy = true;
	}
}

function stayInBoundingBox(player, playerBounds) {
	//  Rectangle collison
	var p = playerBounds;
	var tpos = player.body.position;
	var h = player.body.halfHeight;
	var w = player.body.halfWidth;
	var tx1 = tpos.x - w;
	var ty1 = tpos.y - h;
	var tx2 = tpos.x + w;
	var ty2 = tpos.y + h;
	if (tx1 + w < p.x) {
		tpos.x = p.x + w;
	}
	else if (tx2 + w > p.x + p.width) {
		tpos.x = p.x + p.width - w*2;
	}
	else if (ty1 + h < p.y) {
		tpos.y = p.y + h;
	}
	else if (ty2 + h > p.y + p.height) {
		tpos.y = p.y + p.height - h*2;
	}
}

function isOdd(n) {
  return n == parseFloat(n) && !!(n % 2);
}

function render() {
	//game.debug.body('player');
	if (debug) {
		game.debug.spriteInfo(player, 32, 650);
		game.debug.text(player.frame, 32, 32);
	}
	//game.debug.geom(playerBounds, 'rgba(255,0,255,0.2)');
	game.debug.text('Lives: '+ lives, game.world.centerX+280,650);
	game.debug.text('Points: '+ points, game.world.centerX+280,670);

	game.debug.text(result, game.world.centerX+180,690);
}
