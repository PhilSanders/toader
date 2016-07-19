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
//var player;
//var enemy;
//var cursors;
//var bullets;
var bulletTime = 0;
var debug = false;

function preload() {
	game.load.image('map', 'assets/img/map1.01.png');
    game.load.image('player', 'assets/img/toad.png');
    game.load.image('enemy', 'assets/img/car.png');
	game.load.image('bullet', 'assets/img/bullet.png');
	game.load.spritesheet('explosion', 'assets/img/explosion1.png', 142, 200, 16);
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

	//  collision
    var playerCollisionGroup = game.physics.p2.createCollisionGroup();
    var weaponCollisionGroup = game.physics.p2.createCollisionGroup();
	var enemyCollisionGroup = game.physics.p2.createCollisionGroup();
    //game.physics.p2.updateBoundsCollisionGroup();

	//  Add the map background to the scene
	game.add.image(0, 0, 'map');

	//  Add player
	var player = createPlayer(game,playerCollisionGroup,enemyCollisionGroup);

	//  Add enemy
	var enemies = createEnemy(game,enemyCollisionGroup,weaponCollisionGroup);

	//  Spawn enemies
	game.time.events.repeat(Phaser.Timer.SECOND * 3.2, 20, function(){
		spawnEnemy(enemies, enemyCollisionGroup, playerCollisionGroup, weaponCollisionGroup);
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
		e.body.setCollisionGroup(weaponCollisionGroup);
		e.body.fixedRotation = false;
		e.body.collides(enemyCollisionGroup, function(){
			e.kill();
		});
	});


	//  An explosion pool
	explosions = game.add.group();
	explosions.createMultiple(30, 'explosion');
	/*
	for (var i = 0; i < 30; i++){
        //  They are evenly spaced out on the X coordinate, with a random Y coordinate
        var explosion = explosions.create(0,0, 'explosion');
		explosion.name = 'explosion' + i;
    }
	var frameNames = Phaser.Animation.generateFrameNames('explosion', 0, 16, '', 0);
	explosions.callAll('animations.add', 'animations', 'explosion', frameNames, 30, true, false);
	*/
	explosions.setAll('anchor.x', 0.5);
	explosions.setAll('anchor.y', 0.5);


	//  Setup input
    cursors = game.input.keyboard.createCursorKeys();
	fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

}

function update() {

	player.body.setZeroVelocity();

    if (cursors.left.isDown){
    	player.body.moveLeft(100);
		player.body.rotation = -1.61;
    }
    else if (cursors.right.isDown){
    	player.body.moveRight(100);
		player.body.rotation = 1.61;
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
}

function render() {
	//game.debug.body('player');
	if (debug) game.debug.spriteInfo(player, 32, 500);
}

function createPlayer(game,playerCollisionGroup,enemyCollisionGroup){
	player = game.add.sprite(400, 300, 'player');
	//  Enable if for physics. This creates a default rectangular body.
	game.physics.p2.enable(player, debug);
	//  Modify a few body properties
	player.body.setZeroDamping();
	player.body.fixedRotation = false;
	//player.body.kinematic = true;

	//  Set the ships collision group
    player.body.setCollisionGroup(playerCollisionGroup);
	//  The ship will collide with the pandas, and when it strikes one the hitPanda callback will fire, causing it to alpha out a bit
    //  When pandas collide with each other, nothing happens to them.
    player.body.collides(enemyCollisionGroup, function(){
		console.log('Kill Player');
		player.kill();
	});
}

function createEnemy(game,enemyCollisionGroup,weaponCollisionGroup){
	var enemies = game.add.group();
	enemies.createMultiple(30,'enemy');
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.P2JS;
	game.physics.p2.enable(enemies, debug);
	enemies.setAll('anchor.x', 0.5);
	enemies.setAll('anchor.y', 0.5);
    enemies.setAll('outOfBoundsKill', true);
    enemies.setAll('checkWorldBounds', true);
	enemies.forEach(function(e){
		e.body.setCollisionGroup(enemyCollisionGroup);
		e.body.fixedRotation = false;
		e.body.kinematic = true;
		e.animations.add('explosion');
		e.body.collides(weaponCollisionGroup, function(){
			var explode = explosions.getFirstExists(false);
			explode.reset(e.body.x, e.body.y);
			explode.play('explosion', 30, false, true);
			e.kill();
			console.log('Kill Enemy');
		});
	});
	return enemies;
}

function spawnEnemy(enemies, enemyCollisionGroup, playerCollisionGroup, weaponCollisionGroup){
	var enemy = enemies.getFirstExists(false);
		enemy.reset(820, 260);
		enemy.body.collides([enemyCollisionGroup, playerCollisionGroup, weaponCollisionGroup]);
		enemy.body.moveLeft(160);
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
			if(player.body.rotation == -1.61){
				bullet.body.rotation = player.body.rotation;
				bullet.body.moveLeft(400);
			}
			if(player.body.rotation == 1.61){
				bullet.body.rotation = player.body.rotation;
				bullet.body.moveRight(400);
			}
			bulletTime = game.time.now + 400;
		}
	}
}
