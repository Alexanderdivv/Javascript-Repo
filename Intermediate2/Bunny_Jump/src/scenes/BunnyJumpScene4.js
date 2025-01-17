import Phaser from "phaser";
import Carrot from "../game/Carrot";
var carrots;
var carrotsCollected;
var platforms;
var player;
var cursors;
export default class BunnyJumpScene extends Phaser.Scene {
  constructor() {
    super("bunny-jump-scene");
  }
  preload() {
    this.load.image("background", "images/bg_layer1.png");
    this.load.image("platform", "images/ground_grass.png");
    this.load.image("carrot", "images/carrot.png");
    this.load.image("bunny_jump", "images/bunny1_jump.png");
    this.load.image("bunny_stand", "images/bunny1_stand.png");
    this.load.audio("jumpSound", "sfx/phaseJump1.ogg");
  }
  create() {
    // membuat background tidak tertinggal di layar
    this.add.image(240, 320, `background`).setScrollFactor(1, 0);
    // atur deadzone dengan nilai lebar layout dikalikan 1.5
    this.cameras.main.setDeadzone(this.scale.width * 1.5);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.add.image(240, 320, "background");
    // this.add.image(240, 320, "platform");
    this.platforms = this.physics.add.staticGroup();

    // menggandakan platform
    for (let i = 0; i < 5; i++) {
      // x bernilai random dari 80-400
      const x = Phaser.Math.Between(80, 400);
      const y = 150 * i; //platform akan berjarak 150px

      // membuat platform
      const platformChild = this.platforms.create(x, y, "platform");
      platformChild.setScale(0.5); //mengecilkan platform
      platformChild.refreshBody(); //refresh platform
      const body = platformChild.body;
      body.updateFromGameObject();
    }

    // membuat player
    this.player = this.physics.add
      .sprite(240, 320, "bunny_stand")
      .setScale(0.5);

    //   membuat collision/tabrakan antara player dengan platform
    this.physics.add.collider(this.player, this.platforms);

    // membuat player/bunny agar hanya collide pada paltform yang dipijak
    // mematikan collision player pada bagian atas, kiri dan kanan
    this.player.body.checkCollision.up = false;
    this.player.body.checkCollision.left = false;
    this.player.body.checkCollision.right = false;

    // membuat kamera dapat mengikuti player/bunny keatas
    this.cameras.main.startFollow(this.player);
    // menambahkan objek carrots ke scene
    this.carrots = this.physics.add.group({
      classType: Carrot,
    });
    // platforms berbenturan dengan carrots
    this.physics.add.collider(this.platforms, this.carrots);
    this.physics.add.overlap(
      this.player,
      this.carrots,
      this.handleCollectCarrot,
      undefined,
      this
    );
    this.carrotsCollected = 0;
    // menambahkan teks score
    const style = { color: `#000`, fontSize: `24px` };
    // mengubah nilai collected carrots
    this.carrotsCollectedText = this.add
      .text(240, 10, `Carrots: 0`, style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0);
  }

  update() {
    //   variabel lokal untuk memastikan player menyentuh bawah
    const touchingDown = this.player.body.touching.down;

    // kondisi jika player menyentuh bawah
    if (touchingDown) {
      // maka player akan meloncat dengan percepatan -300
      this.player.setVelocityY(-300); //-300 karena keatas dan pertubahan animasi menjadi melompat
      this.player.setTexture("bunny_jump"); //mengubah texture menjadi melompat
      this.sound.play("jumpSound");
    }

    // mengatur pergerakan player/bunny
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    // mencari percepatan player
    const vy = this.player.body.velocity.y;
    // jika percepatan lebih dari 0 dan animasi player bukan stand/berdiri
    if (vy > 0 && this.player.texture.key !== "bunny_stand") {
      // maka player akan berdiri
      this.player.setTexture("bunny_stand");
    }

    // melakukan iterasi pada semua child di platform
    this.platforms.children.iterate((child) => {
      const platformChild = child;
      const scrollY = this.cameras.main.scrollY;
      //@ts-ignore
      if (platformChild.y >= scrollY + 700) {
        //@ts-ignore
        platformChild.y = scrollY - Phaser.Math.Between(75, 90);
        console.log(platformChild.y);
        //@ts-ignore
        platformChild.body.updateFromGameObject();

        // panggil method carrot
        this.addCarrotAbove(platformChild);
      }
    });
    this.horizontalWrap(this.player);

    const buttomPlatform = this.findButtomMostPlatform();
    //@ts-ignore
    if (this.player.y > buttomPlatform.y + 200) {
      this.scene.start(`game-over-scene`);
    }
  }

  // buat method dengan parameter sprite
  horizontalWrap(sprite) {
    // bukan yang ini, tapi sama
    // // jika sprite berada di kiri layar
    // if (sprite.x < -50) {
    //   // maka sprite akan berada di kanan layar
    //   sprite.x = this.scale.width + 50;
    // } else if (sprite.x > this.scale.width + 50) {
    //   // jika sprite berada di kanan layar
    //   // maka sprite akan berada di kiri layar
    //   sprite.x = -50;
    // }
    const halfWidth = sprite.displayWidth * 0.5;
    const gameWidth = this.scale.width;
    if (sprite.x < -halfWidth) {
      sprite.x = gameWidth + halfWidth;
    } else if (sprite.x > gameWidth + halfWidth) {
      sprite.x = -halfWidth;
    }
  }

  addCarrotAbove(sprite) {
    const y = sprite.y - sprite.displayHeight;
    const carrot = this.carrots.get(sprite.x, y, `carrot`);

    carrot.setActive(true); //aktifkan carrot
    carrot.setVisible(true); //tampilkan carrot

    // menambahkan fisik dari carrot
    this.add.existing(carrot);
    carrot.body.setSize(carrot.width, carrot.height);
    this.physics.world.enable(carrot);
    return carrot;
  }

  handleCollectCarrot(player, carrot) {
    this.carrots.killAndHide(carrot);
    this.physics.world.disableBody(carrot.body);
    this.carrotsCollected++;
    const value = `Carrots: ${this.carrotsCollected}`;
    this.carrotsCollectedText.text = value;
  }

  findButtomMostPlatform() {
    // panggil childred dari platforms
    const platforms = this.platforms.getChildren();
    // ambil item pertama dari array platforms lokal
    let buttomPlatforms = platforms[0];

    // melakukan iterasi pada semua child dari platforms, untuk mencari buttom most platform
    for (let i = 1; i < platforms.length; i++) {
      const platform = platforms[i];
      //@ts-ignore
      if (platform.y < buttomPlatforms.y) {
        continue;
      }
      buttomPlatforms = platform;
    }
    // this.add.image(buttomPlatforms.x, buttomPlatforms.y, `platform`);
    return buttomPlatforms;
  }
}
