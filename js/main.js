/*
 * Toader Phaser Game
 * Author: Phil Sanders
 * Email: phil@sourcetoad.com
 * Web: http://www.sourcetoad.com/
 */

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'toader', {
	preload: preload,
	create:  create,
	update:  update,
	render:  render
});

//  Set globals
var player;
var enemy;
var cursors;
var bullets;
var bulletTime = 0;
var explosion;
var explosions;
var playerBounds = new Phaser.Rectangle( 300, 200, 200, 200 ) ;
var debug = false;

function preload() {
	game.load.image('map','assets/img/map1.01.png');
    game.load.image('player','assets/img/toad.png');
    game.load.image('enemy','assets/img/car.png');
	game.load.image('bullet','assets/img/bullet.png');
	game.load.spritesheet('explosion','assets/img/explosion1.png', 142, 200, 16);
}

function create(){

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
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,820,260,'left');
	});
	game.time.events.repeat(Phaser.Timer.SECOND * 4.2, 20, function(){
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,0,340,'right');
	});
	game.time.events.repeat(Phaser.Timer.SECOND * 5, 20, function(){
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,440,600,'up');
	});
	game.time.events.repeat(Phaser.Timer.SECOND * 3.2, 20, function(){
		spawnEnemy(enemies,enemyCG,playerCG,weaponCG,360,0,'down');
	});

	//  Bullets group
	weapon = game.add.group();
	//game.physics.p2.enable(bullets, true);
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
		e.body.collides(enemyCG, function(){
			e.kill();
		});
	});

	//  An explosion pool
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

	player.body.setZeroVelocity();

    if (cursors.left.isDown){
    	player.body.moveLeft(100);
		player.body.rotation = -1.59;
    }
    else if (cursors.right.isDown){
    	player.body.moveRight(100);
		player.body.rotation = 1.59;
    }

    if (cursors.up.isDown){
    	player.body.moveUp(100);
		player.body.rotation = 0;
    }
    else if (cursors.down.isDown){
    	player.body.moveDown(100);
		player.body.rotation = -3.12;
    }
	//  Firing?
	if (fireButton.isDown){
		fireBullet();
	}

	//  Check if player is inside playBounds
	//stayInBoundingBox(player, playerBounds);
}

function render() {
	//game.debug.body('player');
	if (debug) game.debug.spriteInfo(player, 32, 500);
	game.debug.geom( playerBounds, 'rgba(255,0,255,0.2)' ) ;
}

function createPlayer(playerCG,enemyCG){
	player = game.add.sprite(400, 300, 'player');
	//  Enable if for physics. This creates a default rectangular body.
	game.physics.p2.enable(player, debug);
	//  Modify a few body properties
	player.body.setZeroDamping();
	player.body.fixedRotation = false;
	//player.body.kinematic = true;

	//  Set the ships collision group
    player.body.setCollisionGroup(playerCG);
	//  The ship will collide with the pandas, and when it strikes one the hitPanda callback will fire, causing it to alpha out a bit
    //  When pandas collide with each other, nothing happens to them.
    player.body.collides(enemyCG, function(){
		console.log('Kill Player');
		player.kill();
	});
}

function createEnemy(enemyCG,weaponCG){
	enemies = game.add.group();
	enemies.createMultiple(30,'enemy');
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.P2JS;
	game.physics.p2.enable(enemies, debug);
	enemies.setAll('anchor.x', 0.5);
	enemies.setAll('anchor.y', 0.5);
    enemies.setAll('outOfBoundsKill', true);
    enemies.setAll('checkWorldBounds', true);
	enemies.forEach(function(e){
		e.body.setCollisionGroup(enemyCG);
		e.body.fixedRotation = false;
		e.body.kinematic = true;
		e.body.collides(weaponCG, function(){
			var explode = explosions.getFirstExists(false);
			explode.reset(e.body.x, e.body.y);
			explode.play('explosion', 30, false, true);
			e.kill();
			console.log('Kill Enemy');
		});
	});
	return enemies;
}

function spawnEnemy(enemies,enemyCG,playerCG,weaponCG,xPos,yPos,direction){
	var enemy = enemies.getFirstExists(false);
	enemy.reset(xPos, yPos);
	enemy.body.collides([enemyCG,playerCG,weaponCG]);

	if (direction == 'left'){
		enemy.body.rotation = 0;
		enemy.body.moveLeft(160);
	}
	if (direction == 'right'){
		enemy.body.rotation = -3.12;
		enemy.body.moveRight(160);
	}
	if (direction == 'up'){
		enemy.body.rotation = 1.59;
		enemy.body.moveUp(160);
	}
	if (direction == 'down'){
		enemy.body.rotation = -1.59;
		enemy.body.moveDown(160);
	}
}

function fireBullet () {
    if (game.time.now > bulletTime){
		//  Grab the first bullet we can from the pool
		bullet = weapon.getFirstExists(false);
		if (bullet){
			//  And fire it
			bullet.reset(player.x, player.y);

			if(player.body.rotation == 0){
				bullet.body.rotation = player.body.rotation;
				bullet.body.moveUp(400);
			}
			if(player.body.rotation == -3.12){
				bullet.body.rotation = player.body.rotation;
				bullet.body.moveDown(400);
			}
			if(player.body.rotation == -1.59){
				bullet.body.rotation = player.body.rotation;
				bullet.body.moveLeft(400);
			}
			if(player.body.rotation == 1.59){
				bullet.body.rotation = player.body.rotation;
				bullet.body.moveRight(400);
			}
			bulletTime = game.time.now + 400;
		}
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
