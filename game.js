<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8" />
    <title>Platformer Endless Runner</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script>
    <style>
        body {
            margin: 0;
            background: #222;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        #game-container {
            border: 3px solid #555;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>

<script>
// =================================================================
// SZENE 1: HAUPTMENÜ
// =================================================================
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        console.log('MainMenuScene preload');
        this.load.image('menu_bg', 'assets/menu_background.png');
    }

    create() {
        console.log('MainMenuScene create');
        this.add.image(400, 225, 'menu_bg').setDisplaySize(800, 450);

        this.add.text(400, 100, 'Mein Plattformer', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        const startButton = this.add.text(400, 250, 'Spiel Starten', {
            fontSize: '32px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        const controlsButton = this.add.text(400, 350, 'Steuerung', {
            fontSize: '32px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => this.scene.start('GameScene'));
        controlsButton.on('pointerdown', () => this.scene.start('ControlsScene'));

        [startButton, controlsButton].forEach(btn => {
            btn.on('pointerover', () => btn.setStyle({ fill: '#ff0' }));
            btn.on('pointerout', () => btn.setStyle({ fill: '#fff' }));
        });
    }
}

// =================================================================
// SZENE 2: STEUERUNGS-ANZEIGE
// =================================================================
class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    create() {
        console.log('ControlsScene create');
        this.cameras.main.setBackgroundColor('#000022');

        this.add.text(400, 100, 'Steuerung', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 220, '← Pfeiltaste Links: Laufen nach links', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 270, '→ Pfeiltaste Rechts: Laufen nach rechts', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 320, '↑ Pfeiltaste Oben / Leertaste: Springen', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        const backButton = this.add.text(400, 400, 'Zurück', {
            fontSize: '32px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        backButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
        backButton.on('pointerover', () => backButton.setStyle({ fill: '#ff0' }));
        backButton.on('pointerout', () => backButton.setStyle({ fill: '#fff' }));
    }
}

// =================================================================
// SZENE 3: DAS SPIEL
// =================================================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        console.log('GameScene preload');
        this.load.image('background', 'assets/background.png');
        this.load.image('ground', 'assets/ground.png');
        this.load.image('obstacle', 'assets/obstacle.png');
        this.load.image('coin', 'assets/coin.png');
        this.load.spritesheet('player', 'assets/player_sheet.png', { frameWidth: 32, frameHeight: 48 });

        this.load.audio('jump', 'assets/jump.wav');
        this.load.audio('coin', 'assets/coin.wav');
        this.load.audio('gameover', 'assets/gameover.wav');
    }

    create() {
        console.log('GameScene create');
        this.gameOver = false;
        this.score = 0;

        this.physics.world.setBounds(0, 0, 1600, 450);
        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(2);

        const ground = this.physics.add.staticGroup();
        for (let i = 0; i < 5; i++) {
            ground.create(200 + (i * 400), 430, 'ground').setScale(2).refreshBody();
        }

        this.player = this.physics.add.sprite(100, 350, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, 1600, 450);

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 20
        });

        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        this.obstacles.create(500, 380, 'obstacle').setImmovable(true).body.setAllowGravity(false);
        this.obstacles.create(800, 380, 'obstacle').setImmovable(true).body.setAllowGravity(false);
        this.obstacles.create(850, 380, 'obstacle').setImmovable(true).body.setAllowGravity(false);

        this.coins.create(300, 300, 'coin').body.setAllowGravity(false);
        this.coins.create(350, 300, 'coin').body.setAllowGravity(false);
        this.coins.create(1100, 300, 'coin').body.setAllowGravity(false);

        this.physics.add.collider(this.player, ground);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#FFF',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setScrollFactor(0);

        this.jumpSound = this.sound.add('jump');
        this.coinSound = this.sound.add('coin');
        this.gameOverSound = this.sound.add('gameover');
    }

    update() {
        if (this.gameOver) return;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
            this.player.setFlipX(true);
            this.player.anims.play('run', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
            this.player.setFlipX(false);
            this.player.anims.play('run', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('idle');
        }

        if ((this.cursors.up.isDown || this.cursors.space.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-600);
            this.jumpSound.play();
        }
    }

    hitObstacle(player, obstacle) {
        this.physics.pause();
        player.setTint(0xff0000);
        this.gameOver = true;
        this.gameOverSound.play();

        this.add.text(400, 200, 'Game Over', {
            fontSize: '48px', fill: '#f00'
        }).setOrigin(0.5).setScrollFactor(0);

        const backToMenuText = this.add.text(400, 280, 'Zurück zum Menü', {
            fontSize: '32px', fill: '#fff', backgroundColor: '#555', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setInteractive();

        backToMenuText.on('pointerdown', () => this.scene.start('MainMenuScene'));
        backToMenuText.on('pointerover', () => backToMenuText.setStyle({ fill: '#ff0' }));
        backToMenuText.on('pointerout', () => backToMenuText.setStyle({ fill: '#fff' }));
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        this.coinSound.play();
    }
}

// =================================================================
// SPIEL-KONFIGURATION
// =================================================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { gravity: { y: 1200 }, debug: false }},
    scene: [MainMenuScene, ControlsScene, GameScene]
};

window.onload = () => {
    console.log('Starte Phaser Game');
    const game = new Phaser.Game(config);
};
</script>
</body>
</html>
