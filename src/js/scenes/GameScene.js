class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.score = 0;
        this.gameOver = false;
        this.assetsLoaded = false;
        this.playerID = null;
    }


    init(data) {
        this.playerID = data.playerID;
    }
    preload() {
        // Add loading text
        this.loadingText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Loading...',
            {
                fontSize: '32px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);

        // Setup loading error handler
        this.load.on('loaderror', (fileObj) => {
            console.log('Error loading asset:', fileObj.key);
        });

        this.load.on('complete', () => {
            this.assetsLoaded = true;
            if (this.loadingText) {
                this.loadingText.destroy();
            }
        });

        const baseURL = 'XXXXXXXXX';
        
        // Try to load assets but don't fail if they're not available
        try {
            this.load.audio('backgroundMusic', `${baseURL}game-music.mp3`);
            this.load.audio('candyCollectSound', `${baseURL}collect.mp3`);
            this.load.audio('gameOverMusic', `${baseURL}game-over.wav`);

            this.load.image('basket', `${baseURL}basket.png`);
            this.load.image('candy', `${baseURL}candy.png`);
            this.load.image('candySpecial', `${baseURL}candySpecial.png`);
            this.load.image('candyRare', `${baseURL}candyRare.png`);
            this.load.image('lightning', `${baseURL}lightning.png`);
            this.load.image('background', `${baseURL}background.png`);
            this.load.image('lollies', `${baseURL}lollies.png`);
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }

    create() {
        // Reset states
        this.gameOver = false;
        this.score = 0;

        // Set background color
        this.cameras.main.setBackgroundColor('#87CEEB');

        // Try to play background music if loaded
        try {
            if (this.cache.audio.exists('backgroundMusic')) {
                this.backgroundMusic = this.sound.add('backgroundMusic', {
                    loop: true,
                    volume: 0.5
                });
                this.backgroundMusic.play();
            }
        } catch (error) {
            console.log('Background music not available');
        }

        // Add background if loaded, otherwise use color
        try {
            if (this.textures.exists('background')) {
                const bg = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background');
                const scaleX = this.cameras.main.width / bg.width;
                const scaleY = this.cameras.main.height / bg.height;
                const scale = Math.max(scaleX, scaleY);
                bg.setScale(scale);
            }
        } catch (error) {
            console.log('Background image not available');
        }

        // Add score text
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Create basket
        if (this.textures.exists('basket')) {
            this.basket = this.physics.add.sprite(
                this.cameras.main.centerX,
                this.cameras.main.height - 50,
                'basket'
            );
        } else {
            // Fallback to a green rectangle if basket image not loaded
            this.basket = this.add.rectangle(
                this.cameras.main.centerX,
                this.cameras.main.height - 50,
                100,
                50,
                0x4CAF50
            );
            this.physics.add.existing(this.basket);
        }
        
        this.basket.setCollideWorldBounds(true);
        this.basket.setImmovable(true);

        // Create groups
        this.candies = this.physics.add.group();
        this.lightningGroup = this.physics.add.group();

        // Add collisions
        this.physics.add.overlap(this.basket, this.candies, this.collectCandy, null, this);
        this.physics.add.overlap(this.basket, this.lightningGroup, this.catchLightning, null, this);

        // Create cursor keys and add touch/mouse control
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointermove', (pointer) => {
            if (!this.gameOver) {
                this.basket.x = Phaser.Math.Clamp(
                    pointer.x,
                    this.basket.width / 2,
                    this.cameras.main.width - this.basket.width / 2
                );
            }
        });

        // Spawn timers
        this.candyTimer = this.time.addEvent({
            delay: 1000,
            callback: this.spawnCandy,
            callbackScope: this,
            loop: true
        });

        this.lightningTimer = this.time.addEvent({
            delay: 3000,
            callback: this.spawnLightning,
            callbackScope: this,
            loop: true
        });
    }

    spawnCandy() {
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        let candyType;
        let color;
        let points;

        const candyChoice = Phaser.Math.Between(1, 10);
        if (candyChoice <= 6) {
            candyType = 'candy';
            color = 0xFF69B4;  // Pink fallback
            points = 10;
        } else if (candyChoice <= 8) {
            candyType = 'candySpecial';
            color = 0xFFD700;  // Gold fallback
            points = 20;
        } else if (candyChoice <= 9) {
            candyType = 'lollies';
            color = 0x4169E1;  // Gold fallback
            points = 40;
        } else {
            candyType = 'candyRare';
            color = 0x9400D3;  // Purple fallback
            points = 50;
        }

        let candy;
        if (this.textures.exists(candyType)) {
            candy = this.candies.create(x, 0, candyType);
        } else {
            // Fallback to colored circle if image not loaded
            candy = this.add.circle(x, 0, 15, color);
            this.candies.add(candy);
            this.physics.add.existing(candy);
        }

        candy.points = points; // Store points value for scoring
        candy.setBounce(0.3);
        candy.setCollideWorldBounds(false);
        candy.setVelocityX(Phaser.Math.Between(-100, 100));
        candy.setVelocityY(200);
    }

    spawnLightning() {
        const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        let lightning;
        
        if (this.textures.exists('lightning')) {
            lightning = this.lightningGroup.create(x, 0, 'lightning');
        } else {
            // Fallback to yellow rectangle if lightning image not loaded
            lightning = this.add.rectangle(x, 0, 10, 30, 0xFFFF00);
            this.lightningGroup.add(lightning);
            this.physics.add.existing(lightning);
        }

        lightning.setBounce(0.3);
        lightning.setCollideWorldBounds(false);
        lightning.setVelocityX(Phaser.Math.Between(-100, 100));
        lightning.setVelocityY(300);
    }

    update() {
        if (this.gameOver) {
            return;
        }

        // Basket movement with keyboard
        if (this.cursors.left.isDown) {
            this.basket.x -= 7;
        } else if (this.cursors.right.isDown) {
            this.basket.x += 7;
        }

        // Keep basket within bounds
        this.basket.x = Phaser.Math.Clamp(
            this.basket.x,
            this.basket.width / 2,
            this.cameras.main.width - this.basket.width / 2
        );

        // Remove off-screen objects
        this.candies.getChildren().forEach(candy => {
            if (candy.y > this.cameras.main.height) {
                candy.destroy();
            }
        });

        this.lightningGroup.getChildren().forEach(lightning => {
            if (lightning.y > this.cameras.main.height) {
                lightning.destroy();
            }
        });
    }

    collectCandy(basket, candy) {
        // Play sound if available
        if (this.cache.audio.exists('candyCollectSound')) {
            this.sound.play('candyCollectSound', { volume: 0.7 });
        }

        this.score += candy.points;
        this.scoreText.setText('Score: ' + this.score);
        candy.destroy();
    }

    catchLightning(basket, lightning) {
        lightning.destroy();
        this.gameOver = true;

        // Stop spawning
        this.candyTimer.remove();
        this.lightningTimer.remove();

        // Stop all falling objects
        [...this.candies.getChildren(), ...this.lightningGroup.getChildren()].forEach(obj => {
            obj.body.setVelocity(0, 0);
        });

        // Stop music and play game over sound if available
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        if (this.cache.audio.exists('gameOverMusic')) {
            this.sound.play('gameOverMusic', { volume: 0.5 });
        }

        // Save high score to DynamoDB if playerID exists
        if (this.playerID) {
            const dynamoDB = new AWS.DynamoDB.DocumentClient();
            
            // First, get the current high score
            const getParams = {
                TableName: 'XXXXXXXXX',
                Key: {
                    PlayerID: this.playerID
                }
            };

            dynamoDB.get(getParams, (err, data) => {
                if (err) {
                    console.error('Error getting current high score:', err);
                } else {
                    const currentHighScore = data.Item ? data.Item.HighScore : 0;
                    
                    // Only update if new score is higher
                    if (this.score > currentHighScore) {
                        const updateParams = {
                            TableName: 'XXXXXXXXX',
                            Item: {
                                PlayerID: this.playerID,
                                HighScore: this.score
                            }
                        };

                        dynamoDB.put(updateParams, (err) => {
                            if (err) {
                                console.error('Error saving high score:', err);
                            } else {
                                console.log('New high score saved successfully!');
                                // Add high score text
                            }
                        });
                    }
                }
            });
        }

        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Game Over!',
            {
                fontSize: '196px',
                fill: '#ff0000',
                fontFamily: 'Courier New',
                stroke: '#000000',
                strokeThickness: 30,
                letterSpacing: 10
            }
        ).setOrigin(0.5);

        this.createRestartButton();
        this.physics.pause();

        if (this.basket.setTint) {
            this.basket.setTint(0xff0000);
        }
    }

    createRestartButton() {
        const restartButton = this.add.text(
            this.cameras.main.centerX - 120,  // Adjusted to move left
            this.cameras.main.centerY + 180,
            'Start Again',
            {
                fontSize: '32px',
                fill: '#ffffff',
                backgroundColor: '#4CAF50',
                padding: { x: 20, y: 10 },
            }
        )
        .setOrigin(0.5)
        .setInteractive();
        
        const menuButton = this.add.text(
            this.cameras.main.centerX + 120,  // Adjusted to move right
            this.cameras.main.centerY + 180,
            'Main Menu',
            {
                fontSize: '32px',
                fill: '#ffffff',
                backgroundColor: '#2196F3',
                padding: { x: 20, y: 10 },
            }
        )
        .setOrigin(0.5)
        .setInteractive();        

        // Add hover effects and click handlers
        [restartButton, menuButton].forEach(button => {
            button.on('pointerover', () => {
                button.setStyle({ fill: '#ffff00' });
            });

            button.on('pointerout', () => {
                button.setStyle({ fill: '#ffffff' });
            });
        });

        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });

        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}