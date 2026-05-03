// Floating ink-particle canvas
(function () {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(a, b) { return Math.random() * (b - a) + a; }

  const COLORS = [
    "rgba(200,160,80,",
    "rgba(224,92,48,",
    "rgba(100,120,200,",
    "rgba(240,236,224,",
  ];

  class Particle {
    constructor() { this.reset(); this.y = rand(0, H); }
    reset() {
      this.x = rand(0, W);
      this.y = H + 10;
      this.size = rand(0.5, 2);
      this.speed = rand(0.15, 0.5);
      this.drift = rand(-0.15, 0.15);
      this.alpha = rand(0.05, 0.3);
      this.color = COLORS[Math.floor(rand(0, COLORS.length))];
      this.life = 1;
      this.decay = rand(0.001, 0.003);
    }
    update() {
      this.y -= this.speed;
      this.x += this.drift;
      this.life -= this.decay;
      if (this.y < -10 || this.life <= 0) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + (this.alpha * this.life) + ")";
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();
