let canvas;

let fbo;
let effect;

var ratio = Math.sqrt(2);
var resx = 1400;
var resy = 1000;

var globalseed = Math.floor(fxrand() * 1000000);

var vertexShader = `
  // our vertex data
attribute vec3 aPosition;
attribute vec2 aTexCoord;

// lets get texcoords just for fun! 
varying vec2 vTexCoord;

void main() {
  // copy the texcoords
  vTexCoord = aTexCoord;

  // copy the position data into a vec4, using 1.0 as the w component
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

  // send the vertex information on to the fragment shader
  gl_Position = positionVec4;
}
`;

var fragmentShader1 = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float seed;
uniform vec3 c1;
uniform vec3 c2;
varying vec2 vTexCoord;


float randomNoise(vec2 p) {
  return fract(16791.414*sin(7.*p.x+p.y*73.41));
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float power(float p, float g) {
    if (p < 0.5)
        return 0.5 * pow(2.*p, g);
    else
        return 1. - 0.5 * pow(2.*(1. - p), g);
}


void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv = uv/2.;
    //uv.y = 1. - uv.y;

    float x = uv.x;
    float y = uv.y;

    float f = `;

var fragmentShader2 = `

    //f = power(abs(f-.5), 8.);
    f = .5 + .5*sin(f*13.);
    vec3 rgb = hsv2rgb(vec3(mod(f, 1.0), 1., 1.));

    rgb = mix(c1, c2, f);

    rgb += abs(randomNoise(uv)*.1);

    rgb.r = mod(rgb.r, 1.0);
    rgb.g = mod(rgb.g, 1.0);

    //vec3 rgb = hsv2rgb(vec3(0., 0., f));
    //rgb.r = f;
    //rgb.g = mod(f*1.3, 1.);
    //rgb.b = .5;
    gl_FragColor = vec4(rgb.r, rgb.g, rgb.b, 1.);
}
`

var fragmentShader;

function preload(){
}

function setupShaders(){
    var det = 8;
    var nx = (resx - 293) / det;
    var ny = (resy - 293) / det;
    var dw = nx * det;
    var dh = ny * det;

    var rx = floor(random(nx * 3)) * 0;
    var ry = floor(random(ny * 3)) * 0;
    var scan = random(nx / 10, nx / 2);
    scan = nx * 1.;

    var comp = getComposition();

    fragmentShader = fragmentShader1 + comp + ';\n' + fragmentShader2;
    //print(fragmentShader)

    print(comp);
}

function getCompositionImpl() {
    var rulelevel = 8;
    var s = 'sqrt((x-0.5)*(x-0.5))';
    var rules = [];
    for (var k = 0; k < 15; k++) {
        var r1 = random(1, 10);
        var r2 = random(1, 10);
        var r3 = random(.1, 3.);
        var r4 = random(.1, 3.);
        var r5 = round(random(3, 10))*1.000001;
        var r6 = round(random(3, 10)) * 1.000001;
        var r7 = random(3, 10);
        var r8 = random(2, 100);
        var r9 = random(2, 100);
        var trules = [
            `(mod(x, y))`,
            `(mod(y, x))`,
            `(x+y+u_time*0.0003)`,
            `(x*y+u_time*0.0003)`,
            `(1.-x+u_time*0.0003)`,
            `(1.-y+u_time*0.0003)`,
            `(.5 + .5*sin(${r1}*x + u_time*0.003))`,
            `(.5 + .5*sin(${r2}*y + u_time*0.003))`,
            `(pow(x, ${r3})+u_time*0.0003)`,
            `(pow(y, ${r4}))`,
            `(1.-x+u_time*0.0003)`,
            `(1.-y+u_time*0.0003)`,
            `(1./y)`,
            `(1./x)`,
            //`(fbm(vec2(x*11. + u_time*0.0003, x*1. + u_time*0.0003)))`,
            //`(fbm(vec2(y*11. + u_time*0.0003, y*1. + u_time*0.0003)))`,
        ]
        var trul2es = [
            `(x+y)`,
            `(x*y)`,
            `(fbm(vec2(x*${r7} + u_time*0.0003, y*${r4} + u_time*0.0003+${r5})))`,
        ]
       
        rules = rules.concat(trules);
    }

    for (var k = 0; k < rulelevel; k++) {
        var rrules = rules;
        var ns = '';
        for (var i = 0; i < s.length; i++) {
            if (s[i] == 'x' || s[i] == 'y') {
                var chc = floor(random(rrules.length));
                while (!rrules[chc].includes(s[i])) {
                    chc = floor(random(rrules.length));
                }
                ns += rrules[chc]
            }
            else {
                ns += s[i];
            }
        }
        s = ns;
    }

    return s;
}

function getComposition() {
    var avgr = 0;
    var avgd = 0;
    var maxd = 0;
    var sum = 0;
    zas = true;
    var comp = '';
    //while((maxd < .2 || avgd < .2 || avgr < .2) || zas || sum == 0){
    while (sum < .1 || maxd < .01 || isNaN(maxd)) {
        zas = false;
        comp = getCompositionImpl();
        return comp;
        var vals = [];
        maxd = 0;
        var nn = 5;
        for (var j = 0; j < nn; j++) {
            for (var i = 0; i < round(nn * resx / resy); i++) {
                var X = ((i) % nn + 1) / nn;
                var Y = ((j) % nn + 1) / nn * resy / resx;
                //rez = (eval(comp) + 0.)%1;

                rez = round(eval(comp) * 100);
                if (isNaN(rez))
                    zas = true;
                vals.push(rez);
            }
        }
        sum = 0;
        for (var k = 0; k < vals.length; k++) {
            if (!isNaN(vals[k]) && isFinite(vals[k]))
                sum += vals[k];
        }
        avgr = sum / vals.length;

        var sumd = 0;
        for (var k = 0; k < vals.length; k++) {
            sumd += abs(vals[k] - avgr);
            maxd = max(maxd, abs(vals[k] - avgr));
        }
        avgd = sumd / vals.length;
        //print('hello')

    }
    return comp;
}

function setup() {
    pixelDensity(2);
    var or = innerWidth / innerHeight;
    var cr = resx / resy;
    var cw, ch;

    if (or > cr) {
        ch = innerHeight - 293;
        cw = round(ch * cr);
    }
    else {
        cw = innerWidth - 293;
        ch = round(cw / cr);
    }

    cw = innerWidth;
    ch = innerHeight;
    resx = cw;
    resy = ch;

    canvas = createCanvas(cw, ch, WEBGL);
    canvas.id('maincanvas');


    imageMode(CENTER);
    randomSeed(globalseed);
    noiseSeed(round(globalseed + 123.1341));

    setupShaders();
    effect = createShader(vertexShader, fragmentShader);

    print('fxhash:', fxhash);

    imageMode(CENTER);
    rectMode(CENTER);
    colorMode(RGB, 1);

    fbo = new p5Fbo({ renderer: canvas, width: resx * 2, height: resy * 2 });

    dodo();
    dodo();
    fxpreview();
    noLoop();
}
var cc1;
var cc2;

function draw(){
    dodo();
}


function dodo() {
    background(1);

    var h1 = noise(18.953);
    var h2 = (h1+0.5+.1*(-.5+2*noise(99.531)))%1;
    cc1 = map2(h1);
    cc1 = saturatecol(cc1, -0.3*power(noise(12.345), 3));
    cc1 = brightencol(cc1, +0.3*power(noise(23.45631), 3));

    cc2 = map2(h2);
    cc2 = saturatecol(cc2, +0.3*power(noise(831.33231), 3));
    cc2 = brightencol(cc2, -0.8*power(noise(292.555), 3));

    effect.setUniform('u_resolution', [resx, resy]);
    effect.setUniform('u_time', mouseX);
    effect.setUniform('seed', 12.314 + globalseed * 12.123);
    effect.setUniform('c1', cc1);
    effect.setUniform('c2', cc2);

    fbo.begin();
    clear();
    shader(effect);
    quad(-1, -1, 1, -1, 1, 1, -1, 1);
    fbo.end();
    fbo.draw(0, 0, width, height);

}

function map(v, v1, v2, v3, v4){
    return (v-v1)/(v2-v1)*(v4-v3)+v3;
}

function windowResized(){

    cw = innerWidth;
    ch = innerHeight;
    resx = cw;
    resy = ch;

    resizeCanvas(cw, ch);
}

function mouseClicked(){
}

function keyPressed(){
}

function power(p, g) {
    if (p < 0.5)
        return 0.5 * Math.pow(2*p, g);
    else
        return 1 - 0.5 * Math.pow(2*(1 - p), g);
}
