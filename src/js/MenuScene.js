class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        const baseURL = 'XXXXXXXXX';
        this.load.image('background', `${baseURL}background1.png`);
    }

    create() {
        // Configure AWS SDK
        AWS.config.update({
            region: 'XXXXXXXXX',
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'XXXXXXXXX'
            }),
        });

        const dynamoDB = new AWS.DynamoDB.DocumentClient();

        // Add and scale background to fit screen
        const bg = this.add.image(0, 0, 'background');
        bg.setOrigin(0, 0);
        
        // Calculate scale to cover the entire screen
        const scaleX = this.cameras.main.width / bg.width;
        const scaleY = this.cameras.main.height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);
        
        // Center the background if it's larger than the screen
        bg.x = (this.cameras.main.width - bg.displayWidth) / 2;
        bg.y = (this.cameras.main.height - bg.displayHeight) / 2;

        // Create a container for UI elements
        const uiContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);

        // Create input field for PlayerID
        const playerIDInput = this.add.dom(0, 220, 'input', {
            type: 'text',
            fontSize: '20px',
            color: '#000',
            width: '200px',
            height: '30px',
            padding: '5px 10px',
            border: '2px solid #ccc',
            borderRadius: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
        });
        playerIDInput.node.placeholder = 'Enter Player Name 🚀';
        uiContainer.add(playerIDInput);

        // Create save button with updated styling
        const saveButton = this.add.text(160, 222, 'Save', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 10, y: 10 },
            borderRadius: '5px'
        }).setOrigin(0.5).setInteractive();
        uiContainer.add(saveButton);

        // Create start button with updated styling
        const startButton = this.add.text(10, 290, '🎮 Start Game 🎮', {
            fontSize: '32px',
            fill: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 40, y: 15 },
            borderRadius: '5px'
        }).setOrigin(0.5).setInteractive();
        uiContainer.add(startButton);

        // Add hover effects
        [saveButton, startButton].forEach(button => {
            button.on('pointerover', () => {
                button.setStyle({ fill: '#ffff00' });
            });
            button.on('pointerout', () => {
                button.setStyle({ fill: '#ffffff' });
            });
        });

        // Save PlayerID and start game functionality
        saveButton.on('pointerdown', () => {
            const playerID = playerIDInput.node.value.trim();
            
            if (playerID) {
                const params = {
                    TableName: 'XXXXXXXXX',
                    Item: {
                        PlayerID: playerID,
                        HighScore: 0
                    }
                };

                dynamoDB.put(params, (err) => {
                    if (err) {
                        console.error('Error saving PlayerID:', err);
                        this.showMessage('Error saving PlayerID!', '#ff0000');
                    } else {
                        console.log('PlayerID saved successfully.');
                        this.showMessage('PlayerID Saved!', '#FF6EC7');
                    }
                });
            } else {
                this.showMessage('Please enter a PlayerID!', '#ff0000');
            }
        });

        // Start game on click
        startButton.on('pointerdown', () => {
            const playerID = playerIDInput.node.value.trim();
            if (playerID) {
                this.scene.start('GameScene', { playerID });
            } else {
                this.showMessage('Please save a PlayerID!', '#ff0000');
            }
        });
    }

    showMessage(text, color) {
        // Remove existing message if any
        const existingMessage = this.children.list.find(child => child.messageText === true);
        if (existingMessage) existingMessage.destroy();

        // Add new message
        const message = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 160,
            text,
            {
                fontSize: '24px',
                fill: color
            }
        ).setOrigin(0.5);
        message.messageText = true;

        // Fade out after 2 seconds
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: message,
                alpha: 0,
                duration: 500,
                onComplete: () => message.destroy()
            });
        });
    }
}