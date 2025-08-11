// =================================================================
// SZENE 1: HAUPTMENÜ
// =================================================================
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        this.add.text(400, 150, 'Mein Plattformer', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);

        const startButton = this.add.text(400, 300, 'Spiel Starten', {
            fontSize: '40px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        startButton.on('pointerdown', () => this.scene.start('GameScene'));

        const controlsButton = this.add.text(400, 400, 'Steuerung', {
            fontSize: '40px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        controlsButton.on('pointerdown', () => this.scene.start('ControlsScene'));

        [startButton, controlsButton].forEach(button => {
            button.on('pointerover', () => button.setStyle({ fill: '#ff0' }));
            button.on('pointerout', () => button.setStyle({ fill: '#fff' }));
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
        this.add.text(400, 100, 'Steuerung', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 250, 'Pfeiltasten Links / Rechts: Laufen', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 320, 'Pfeiltaste Oben / Leertaste: Springen', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        const backButton = this.add.text(400, 500, 'Zurück', {
            fontSize: '40px', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }
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
        this.PLAYER_SPEED = 300;
        this.JUMP_VELOCITY = -600;
        this.GROUND_WIDTH = 400;
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('ground', 'assets/ground.png');
        this.load.image('obstacle', 'assets/obstacle.png');
        this.load.image('coin', 'assets/coin.png');
        this.load.spritesheet('player', 'assets/player_sheet.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        this.gameOver = false;
        this.score = 0;

        this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 600);
        this.add.image(0, 0, 'background').setOrigin(0).setScrollFactor(0);

        this.groundGroup = this.physics.add.staticGroup();
        for (let i = 0; i < 5; i++) {
            this.groundGroup.create(i * this.GROUND_WIDTH, 580, 'ground').setOrigin(0, 0).setScale(2).refreshBody();
        }

        this.player = this.physics.add.sprite(100, 450, 'player').setScale(1.5);
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(false);
        this.player.body.setSize(this.player.width * 0.6, this.player.height);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 600);

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

        this.spawnObstacle(600);
        this.spawnObstacle(900);
        this.spawnCoin(400);
        this.spawnCoin(1200);

        this.physics.add.collider(this.player, this.groundGroup);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px', fill: '#FFF', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
        }).setScrollFactor(0);

        this.player.anims.play('idle');
    }

    update() {
        if (this.gameOver) return;

        // Endlos-Boden scrollen
        this.groundGroup.children.iterate(ground => {
            if (ground.x + ground.displayWidth < this.cameras.main.scrollX) {
                ground.x += this.GROUND_WIDTH * this.groundGroup.getLength();
                ground.refreshBody();
            }
        });

        // Hindernisse & Münzen bewegen
        this.obstacles.children.iterate(obstacle => {
            obstacle.x -= 5;
            if (obstacle.x + obstacle.width < this.cameras.main.scrollX) {
                obstacle.destroy();
                this.spawnObstacle(this.cameras.main.scrollX + 800 + Phaser.Math.Between(0, 400));
            }
        });

        this.coins.children.iterate(coin => {
            coin.x -= 5;
            if (coin.x + coin.width < this.cameras.main.scrollX) {
                coin.destroy();
                this.spawnCoin(this.cameras.main.scrollX + 900 + Phaser.Math.Between(0, 400));
            }
        });

        // Spielersteuerung & Animation
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.PLAYER_SPEED);
            this.player.setFlipX(true);
            if (this.player.anims.currentAnim.key !== 'run') this.player.anims.play('run');
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.PLAYER_SPEED);
            this.player.setFlipX(false);
            if (this.player.anims.currentAnim.key !== 'run') this.player.anims.play('run');
        } else {
            this.player.setVelocityX(0);
            if (this.player.anims.currentAnim.key !== 'idle') this.player.anims.play('idle');
        }

        if ((this.cursors.up.isDown || this.cursors.space.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(this.JUMP_VELOCITY);
        }

        // Score aktualisieren (Distanz + Coins)
        this.score = Math.max(this.score, Math.floor(this.player.x / 10));
        this.scoreText.setText('Score: ' + this.score);
    }

    hitObstacle(player, obstacle) {
        this.physics.pause();
        player.setTint(0xff0000);
        this.gameOver = true;

        this.add.text(this.cameras.main.scrollX + 400, 250, 'Game Over', {
            fontSize: '64px', fill: '#f00'
        }).setOrigin(0.5).setScrollFactor(0);

        const backToMenuText = this.add.text(this.cameras.main.scrollX + 400, 350, 'Zurück zum Menü', {
            fontSize: '32px', fill: '#fff', backgroundColor: '#555', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setInteractive();

        backToMenuText.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.score += 50;
        this.scoreText.setText('Score: ' + this.score);
    }

    spawnObstacle(x) {
        const y = 530;
        const obstacle = this.obstacles.create(x, y, 'obstacle');
        obstacle.setImmovable(true);
        obstacle.body.setAllowGravity(false);
    }

    spawnCoin(x) {
        const y = 450;
        const coin = this.coins.create(x, y, 'coin');
        coin.body.setAllowGravity(false);
    }
}

// =================================================================
// SPIEL-KONFIGURATION
// =================================================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: [MainMenuScene, ControlsScene, GameScene]
};

const game = new Phaser.Game(config);
