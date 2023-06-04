// Configuración de Vue.js
const aplic = new Vue({
    el: '#game',
    data: {
        gameStarted: false,
        gameEnded: false,
        playerName: '',
        timer: 0,
        ranking: [],
        partides: []
    },
    methods: {
        startGame() {
            this.gameStarted = true;
            this.timer = 0;
            game.scene.start('GameScene');
            startTimer();

        },
        endGame() {
            this.gameStarted = false;
            this.gameEnded = true;
            game.scene.stop('GameScene');
            stopTimer();
            saveScore();
        },
        toMenu() {
            this.playerName = '';
            this.gameEnded = false;
            window.location.href = 'index.html';
        },
        closeGame(){
            window.close();
        },
        clearRanking(){
            localStorage.clear();
            location.reload();
        },
        guardaPartida(){
            aplic.partides = [];
            const partida = {
                player: aplic.playerName,
                time: aplic.timer,
                px: player.x,
                py: player.y
            };
            aplic.timer.pause = true;
            aplic.partides.push(partida);
            localStorage.setItem('partides', JSON.stringify(this.partides));  //Guarda el ranking al localStorage
            window.location.href = 'index.html';
        },
        cargaPartida() {
            
            if (aplic.partides.length >= 0){
                aplic.timer.pause=false;
                this.gameStarted = true;
                aplic.timer = this.partides[0].time;
                game.scene.start('GameScene');
                player.x = aplic.partides[0].px;
                player.y = aplic.partides[0].py;
                startTimer();
            }
        }
    },
    mounted() {
        this.ranking = JSON.parse(localStorage.getItem('ranking') || '[]');   //Carrega al ranking actual el que hi ha a localStorage
        this.partides = JSON.parse(localStorage.getItem('partides') || '[]');
    }
});

// Configuración de Phaser.io
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false, // Per veure les collides (útil)
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let walls;
let object1;
let object2;
let timerInterval;
let resetTimer;
let lostText;
let pauseText
let playerX;
let playerY;

// Cárrega d'assets
function preload() {
    // Carregar recursos
    this.load.image('suelo', 'assets/suelo.png');
    this.load.image('player', 'assets/player.png');
    this.load.image('wall', 'assets/pared.png');
    this.load.image('mirror', 'assets/mirror.png');
    this.load.image('object1', 'assets/vela1.png');
    this.load.image('object2', 'assets/salida.png');
}

function create() {
    this.add.image(0, 0, 'suelo').setOrigin(0);    //Establir imatge de fons

    // Escenari
    player = this.physics.add.sprite(60, 60, 'player');  // 60 60 es la pos. inicial del jugador
    walls = this.physics.add.staticGroup();
    object1 = this.physics.add.sprite(40, 180, 'object1');
    object2 = this.physics.add.sprite(750, 570, 'object2');

    createMaze.call(this); // Per crear el laberint

    // Temporitzador cada 20 segons (retorna al jugador a l'entrada)
    resetTimer = this.time.addEvent({
        delay: 20000, // 20 segons
        callback: resetPlayerPosition,    //Cada 20 segons, retorna al player a la posició inicial (perdut)
        callbackScope: this,
        loop: true
    });

     // Crear text "You are lost" (es mostra quan el jugador es perd, cada 25 segons)
     lostText = this.add.text(400, 300, 'You are lost', {
        font: '25px Arial',
        fill: '#ffffff'
    });
    lostText.setOrigin(0.5); // Posició del text (al centre)
    lostText.setVisible(false);
    pauseText = this.add.text(400, 200, 'PAUSE', {
        font: '25px Arial',
        fill: '#ffffff'
    });
    pauseText.setOrigin(0.5); // Posició del text (al centre)
    pauseText.setVisible(false);

    // Controls per el personatge
    const cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.collider(player, walls);  //Colisió
    this.physics.add.overlap(player, object1, handleObject1Collision, null, this); //Espelma
    this.physics.add.overlap(player, object2, handleObject2Collision, null, this); //Sortida

    this.input.keyboard.on('keydown', function (event) {

        if (event.code === "KeyP"){
            if (pauseText.visible == false) {
               aplic.timer.paused = true;
               pauseText.setVisible(true);
               playerX = player.x;
               playerY = player.y;
               player.disableBody(true,true);
            }
            else {
                pauseText.setVisible(false);
                player.enableBody(true,playerX,playerY,true,true);
            }
        }       
        const { x, y } = player.body.velocity;

        //Moviment del personatge
        if (event.code === 'ArrowUp' && y >= 0) {
            player.setVelocityY(-200);
            player.setRotation(0); // Orientació inicial (cap rotació)
        } else if (event.code === 'ArrowDown' && y <= 0) {
            player.setVelocityY(200);
            player.setRotation(Math.PI); // Rota cap abaix
        } else if (event.code === 'ArrowLeft' && x >= 0) {
            player.setVelocityX(-200);
            player.setRotation(-Math.PI / 2); // Rota cap a la esquerra
        } else if (event.code === 'ArrowRight' && x <= 0) {
            player.setVelocityX(200);
            player.setRotation(Math.PI / 2); // Rota cap a la dreta
        }
    });

    this.input.keyboard.on('keyup', function (event) {   //Atura el personatge
        player.setVelocity(0);
    });
}

//Funcio per alternar les imatges al pasar el mouse per sobre del Logo
function alternarImagen() {
    const ani = document.getElementById('animacio');
    // Alternar imatges
    if (ani.href.baseVal === 'assets/vela1.png') {
      ani.href.baseVal = 'assets/vela2.png';
    } else {
      ani.href.baseVal = 'assets/vela1.png';
    }
  }

function resetPlayerPosition() {
    if (pauseText.visible == false) {  
        lostText.setVisible(true); // Mostra el text "You are lost"
        player.setPosition(60, 60); // Retorna al jugador a la posició inicial

        // en 2 segons, s'oculta el text
        this.time.delayedCall(2000, function() {
            lostText.setVisible(false);
        }, [], this);
    }
}
function update() {
    // Actualització continua del joc
}

function createMaze() {
    // Funció per crear el laberint (pareds)

    walls.create(480, 480, 'mirror'); //Mirror que desapareix al agafar la espelma
    
    walls.create(40, 240, 'mirror');
    walls.create(110, 370, 'mirror');
    walls.create(50, 120, 'mirror');
    walls.create(100, 120, 'mirror');
    walls.create(150, 120, 'mirror');
    walls.create(150, 170, 'mirror');
    walls.create(150, 220, 'mirror');
    walls.create(150, 270, 'mirror');
    walls.create(150, 320, 'mirror');
    walls.create(150, 370, 'mirror');
    walls.create(150, 420, 'mirror');
    walls.create(150, 470, 'mirror');
    walls.create(350, 50, 'mirror');
    walls.create(350, 200, 'mirror');
    walls.create(350, 250, 'mirror');
    walls.create(350, 300, 'mirror');
    walls.create(350, 350, 'mirror');
    walls.create(350, 400, 'mirror');
    walls.create(350, 450, 'mirror');
    walls.create(350, 500, 'mirror');
    walls.create(350, 550, 'mirror');
    walls.create(480, 550, 'mirror');
              //La paret que desapaareix aniria aquí
    walls.create(480, 410, 'mirror');
    walls.create(480, 340, 'mirror');
    walls.create(480, 270, 'mirror');
    walls.create(480, 200, 'mirror');
    walls.create(480, 130, 'mirror');
    walls.create(480, 60, 'mirror');
    walls.create(600, 550, 'mirror');
    walls.create(600, 500, 'mirror');
    walls.create(600, 450, 'mirror');
    walls.create(600, 400, 'mirror');
    walls.create(600, 350, 'mirror');
    walls.create(600, 300, 'mirror');
    walls.create(600, 250, 'mirror');
    walls.create(600, 200, 'mirror');
    walls.create(600, 150, 'mirror');
    walls.create(650, 150, 'mirror');
    walls.create(750, 300, 'mirror');
    walls.create(750, 350, 'mirror');
    walls.create(750, 400, 'mirror');
    walls.create(650, 550, 'mirror');
    
    //Costats de la pantalla
    walls.create(0, 0, 'wall');
    walls.create(0, 50, 'wall');
    walls.create(0, 100, 'wall');
    walls.create(0, 150, 'wall');
    walls.create(0, 200, 'wall');
    walls.create(0, 250, 'wall');
    walls.create(0, 300, 'wall');
    walls.create(0, 350, 'wall');
    walls.create(0, 400, 'wall');
    walls.create(0, 450, 'wall');
    walls.create(0, 500, 'wall');
    walls.create(0, 550, 'wall');
    walls.create(0, 600, 'wall');
    walls.create(800, 0, 'wall');
    walls.create(800, 50, 'wall');
    walls.create(800, 100, 'wall');
    walls.create(800, 150, 'wall');
    walls.create(800, 200, 'wall');
    walls.create(800, 250, 'wall');
    walls.create(800, 300, 'wall');
    walls.create(800, 350, 'wall');
    walls.create(800, 400, 'wall');
    walls.create(800, 450, 'wall');
    walls.create(800, 500, 'wall');
    walls.create(800, 550, 'wall');
    walls.create(800, 600, 'wall');
    walls.create(50, 0, 'wall');
    walls.create(100, 0, 'wall');
    walls.create(150, 0, 'wall');
    walls.create(200, 0, 'wall');
    walls.create(250, 0, 'wall');
    walls.create(300, 0, 'wall');
    walls.create(350, 0, 'wall');
    walls.create(400, 0, 'wall');
    walls.create(450, 0, 'wall');
    walls.create(500, 0, 'wall');
    walls.create(550, 0, 'wall');
    walls.create(600, 0, 'wall');
    walls.create(650, 0, 'wall');
    walls.create(700, 0, 'wall');
    walls.create(750, 0, 'wall');
    walls.create(800, 0, 'wall');
    walls.create(50, 600, 'wall');
    walls.create(100, 600, 'wall');
    walls.create(150, 600, 'wall');
    walls.create(200, 600, 'wall');
    walls.create(250, 600, 'wall');
    walls.create(300, 600, 'wall');
    walls.create(350, 600, 'wall');
    walls.create(400, 600, 'wall');
    walls.create(450, 600, 'wall');
    walls.create(500, 600, 'wall');
    walls.create(550, 600, 'wall');
    walls.create(600, 600, 'wall');
    walls.create(650, 600, 'wall');
    walls.create(700, 600, 'wall');
    walls.create(750, 600, 'wall');
    walls.create(800, 600, 'wall');
    
}



//Fa que la paret desaparegui en agafar l'espelma
function handleObject1Collision(player, object1) {
    const wallToDestroy = walls.getFirst(true);
    if (wallToDestroy) {
        wallToDestroy.destroy();
    }
    object1.disableBody(true, true); 
}

//Aplicar el final de partida en arribar a la sortida
function handleObject2Collision() {
    player.setPosition(60, 60);    //Necessari perque sinó quan s'aplica "endGame" ho fa en bucle ja que el personatge es quedaba a sobre de la sortida i feia un trigger del handleObject2Collision de forma ilimitada.
    stopTimer();
    aplic.endGame();
}

function startTimer() {        // Augmenta cada segon 
    timerInterval = setInterval(function () {
        if (pauseText.visible == false) {
            aplic.timer++;
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

//Guarda la partida actual al ranking, elimina el pitjor si hi ha més de 5 registres i o desa tot al localStorage.
function saveScore() {
    const score = {
        player: aplic.playerName,
        time: aplic.timer
    };

    aplic.ranking.push(score);
    aplic.ranking.sort((a, b) => a.time - b.time);   //Ordena per time
    if (aplic.ranking.length > 5) {             //Si supera els 5 registres, elimina l'últim (el pitjor)
        aplic.ranking.pop();
    }
    localStorage.setItem('ranking', JSON.stringify(aplic.ranking));  //Guarda el ranking al localStorage
    
}
