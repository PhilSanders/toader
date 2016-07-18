// var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'toader', {
	preload: preload,
	create: create,
	update: update,
	render: render
});

function preload() {
	game.load.image('player', 'assets/img/map1.01.png');
    game.load.image('player', 'assets/img/toad.png');
    game.load.image('car', 'assets/img/car.png');
	game.load.image('bullet', 'assets/img/bullet.png');
	game.load.spritesheet('explosion', 'assets/img/explosion1.png', 142, 200, 16);
}

function create(){

}

function update() {

}

function render() {

}
