window.onload = function() {
    const config = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.RESIZE,
            parent: 'game',
            width: '100%',
            height: '100%',
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        backgroundColor: '#87CEEB',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
            }
        },
        dom: {
            createContainer: true
        },
        scene: [MenuScene, GameScene],
        dom: {
            createContainer: true
        }
    };

    new Phaser.Game(config);
}