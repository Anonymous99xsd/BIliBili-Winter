// 鼠标进入时左部所占百分比
let mouseLeftPercentage = null
// 鼠标移动距离所占百分比
let mouseMovePercentage = null

const header = document.querySelector("header")
const canvas = document.querySelector("canvas")
const day = document.querySelector("#day")
const sunset = document.querySelector("#sunset")
const snowball = document.querySelector("#snowball")
const night = document.querySelector("#night")
const fog = document.querySelector("#fog")
const treeDay = document.querySelector("#tree-day")
const treeSunset = document.querySelector("#tree-sunset")
const treeNight = document.querySelector("#tree-night")

header.addEventListener('mouseenter', e => mouseLeftPercentage = e.clientX / innerWidth)
header.addEventListener('mousemove', e => mouseMovePercentage = e.clientX / innerWidth - mouseLeftPercentage)
header.addEventListener('mouseleave', e => {
    let start = Date.now()
    let mouseMovedBeforeReset = mouseMovePercentage
    requestAnimationFrame(function raf() {
        let progress = (Date.now() - start) / 250
        mouseMovePercentage = mouseMovedBeforeReset * (1 - progress)
        if (progress >= 1) {
            mouseMovePercentage = 0
        } else {
            computeStyles()
            requestAnimationFrame(raf)
        }
    })
})

const applyTransform = (translateX = 0, translateY = 0, rotate = 0, scale = 1) => `scale${scale} translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`
function computeStyles() {
    // 树的模糊度
    treeDay.style.filter = treeSunset.style.filter = 'blur(2px)'
    treeNight.style.filter = 'blur(5px)'
    // 雪球转动角度
    const rotationOfSnowball = 10 - 6 * mouseMovePercentage
    // 不透明度变化
    day.style.opacity = treeDay.style.opacity = 1
    snowball.style.opacity = sunset.style.opacity = treeSunset.style.opacity = Math.min(Math.max(2.5 * mouseMovePercentage + 1, 0), 1)
    night.style.opacity = treeNight.style.opacity = Math.max(mouseMovePercentage * 2.5, 0)
    // 夜景不透明后，雾开始变不透明
    fog.style.opacity = Math.max(mouseMovePercentage * 3.75 - 1.5)
    // 景位移
    const rangeOfMovement = innerWidth * 0.025 + 36.345
    const movementOfScene = mouseMovePercentage * -rangeOfMovement
    // 树移动稍快
    const movementOfTree = movementOfScene * 1.5
    // 雪球位移
    const translateXOfSnowball = movementOfScene * -2
    const translateYOfSnowball = -10 * mouseMovePercentage ** 2 - 60 * mouseMovePercentage + 20
    // 应用transform属性
    fog.style.transform = day.style.transform = sunset.style.transform = night.style.transform = applyTransform(movementOfScene)
    treeDay.style.transform = treeSunset.style.transform = treeNight.style.transform = applyTransform(movementOfTree)
    snowball.style.transform = applyTransform(translateXOfSnowball, translateYOfSnowball, rotationOfSnowball)
    // 下雪方向
    animation_config.wind = 2 * mouseMovePercentage;
    animation_config.speed = 0.2 + Math.abs(mouseMovePercentage * 0.4);
}
header.addEventListener('mousemove', computeStyles)
window.addEventListener('resize', () => {
    let {width, height} = getComputedStyle(header)
    canvas.width = parseFloat(width)
    canvas.height = parseFloat(height)
})
dispatchEvent(new Event('resize'));

window.animation_config = {
    generatorDelay : { min: 1, max:20 }, //in ms
    speed : 0.2, //1x
    x_axis_rate : 0.1, // x axis mobility
    weight : 0.5, //snow flake weight
    size : 1, //snow flake size
    z_axis_rate : 0.05, //z axis mobility
    color : {b : 255, a: 1}, //b for brightness, a for alpha, by default generates random colors but if you set brightness 255 then you'll see only white color
    wind : 0 // value's sign determines wind direction.
};

(function(){
    window.animation_config = window.animation_config || {
        generatorDelay : { min: 1, max:20 },
        isRunning : true,
        speed : 1,
        x_axis_rate : 0.1,
        weight : 0.5,
        size : 1.5,
        z_axis_rate : 0.05,
        color : {b : 255, a: 0.8},
        wind : 0
    };
    window.animation_config.isRunning = true;
    
    let ctx = canvas.getContext('2d');
    //canvas.width = window.innerWidth;
    //canvas.height = window.innerHeight;
    const generatorDelay = { min: 1, max:1 };
    let screenBounds = { lower: 0, upper: canvas.width};
    
    window.onfocus = function() {
      //uncomment for performance
      //window.animation_config.isRunning = true;
    };
    window.onblur = function() {
      //uncomment for performance
      //window.animation_config.isRunning = false;
    };
    
    let particleArray = [];
    
    function randomInt(min = 0, max = 1){
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    function randomFloat(min = 0, max = 1){
        return (Math.random() * (max - min)) + min;  //Math.random() * (max - min + 1) + min;
    }
    function randomColor(brightness, alpha){
        return 'rgba(' + randomInt(brightness,255) + ',' + randomInt(brightness,255) + ',' + randomInt(brightness,255) + ',' + alpha + ')';
    }
    
    class Particle{
        constructor(pos, vector, z_index, size, color, weight){
            this.pos = pos;
            this.vector = vector;
            this.z_index = z_index%5;
            this.color = color;
            this.size = size%50;
            this.weight = weight%50;
        }
        
        get displaySize(){
            return Math.sqrt(this.z_index*this.size) * window.animation_config.size;
        }
        
        draw(){
            if(this.death || !(this.pos.x >= 0 && this.pos.x <= canvas.width )) return;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.displaySize, 0, Math.PI*2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        update(){
            this.vector.z += randomFloat(-0.1,0.1);
            this.z_index += this.vector.z * window.animation_config.z_axis_rate;
            if(this.z_index <= 0) this.z_index = Math.abs(this.z_index);
            if(this.pos.y > canvas.height - this.displaySize || !(this.pos.x >= screenBounds.lower && this.pos.x <= screenBounds.upper ) || this.displaySize <= 0){
                this.death = true;
                return;
            }
            
            this.vector.x += (randomFloat(-0.3, 0.3) * this.z_index) * window.animation_config.x_axis_rate;
            this.vector.y = Math.sqrt(this.weight * this.size * this.z_index) * window.animation_config.speed;
            
            
            this.pos.x += this.vector.x + window.animation_config.wind;
            this.pos.y += this.vector.y;
        }
    }
    
    function init(){
        particleArray = [];
        
        function generateRandomParticle(){
            if(window.animation_config.isRunning){
                if(window.animation_config.wind > 0) {
                    screenBounds.lower = (window.animation_config.wind * 200) * -1;
                    screenBounds.upper = canvas.width;
                }
                else if(window.animation_config.wind < 0) {
                    screenBounds.lower = 0;
                    screenBounds.upper = canvas.width + (window.animation_config.wind * -200);
                }
                let pos = { x: randomInt(screenBounds.lower, screenBounds.upper), y: 0 };
                let vector = { x: randomFloat(-0.3,0.3), y: randomFloat(-5,5), z: randomFloat(-0.1,0.1)};
                let s = randomFloat(0.1,5);
                let z = randomFloat(0.2,5);
                let c = randomColor(window.animation_config.color.b, window.animation_config.color.a);
                let w = window.animation_config.weight;
                particleArray.push(new Particle(pos,vector,z,s,c,w));
            }
            setTimeout(generateRandomParticle, randomInt(window.animation_config.generatorDelay.min, window.animation_config.generatorDelay.max));
        }
        generateRandomParticle();
    }
    
    function animate(){
        if(window.animation_config.isRunning){
            ctx.clearRect(0,0, canvas.width, canvas.height);
            particleArray = particleArray.filter(particle => !particle.death);
            for(let i = 0; i < particleArray.length; i++){
                particleArray[i].update();
                particleArray[i].draw();
            }
        }
        requestAnimationFrame(animate);
    }
    
    init();
    animate();
})()

computeStyles()