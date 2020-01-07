"use strict";

const KEY_UP = 38, KEY_LEFT = 37, KEY_DOWN = 40, KEY_RIGHT = 39, KEY_SHIFT = 16;

let ctx = canvas.getContext("2d");

let renderer = new WireframeRender(ctx);
let fpsDate = Date.now();
let timer = Date.now();
let timerRender = 0;
let timerSim = 0;
let data = JSON.parse(loadText("./example/models.json"));
let models = {};
for (let key in data) {
  models[key] = createModel(data[key]);
}
let angle = 0;
let k = []
let resulution = 2;
renderer.setFOV(45);
renderer.setSize(canvas.width / resulution, canvas.height / resulution);
for (let i = 0; i < 256; i++)k[i] = 0;
window.addEventListener("keydown", (e) => { k[e.keyCode] = 1; console.log(e.keyCode); });
window.addEventListener("keyup", (e) => { k[e.keyCode] = 0 });
window.addEventListener("mousemove", (e) => {
  if (e.buttons === 1) {
    let { camRot } = renderer;
    camRot.x -= e.movementY / 2;
    camRot.y += e.movementX / 2;
  }
});
window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderer.setViewport(0, 0, canvas.width, canvas.height);
  renderer.setSize(canvas.width / resulution, canvas.height / resulution);
  ctx.imageSmoothingEnabled = false;
}
window.onresize();

function createModel(input) {
  let size = 1;
  let drawDist = input.drawDist;
  let vertices = [];
  let indices = [];
  for (let i = 0; i < input.vertices.length; i += 3) {
    vertices.push({ x: input.vertices[i + 0], y: input.vertices[i + 1], z: input.vertices[i + 2] })
  }
  for (let i1 = 0; i1 < input.lines.length; i1 ++) {
    let data = input.lines[i1];
    let type = data[0];
    switch (type) {
      case 0:
        for (let i2 = 1; i2 < data.length; i2 += 2) {
          indices.push(data[i2 + 0]);
          indices.push(data[i2 + 1]);
        }
        break;
      case 1:
        for (let i2 = 1; i2 < data.length-1; i2 += 1) {
          indices.push(data[i2 + 0]);
          indices.push(data[i2 + 1]);
        }
        break;
      case 2:
        for (let i2 = 2; i2 < data.length; i2 += 1) {
          indices.push(data[1 + 0]);
          indices.push(data[i2 + 1]);
        }
        break;
    }
  }
  return renderer.fixMesh({
    size,
    drawDist,
    vertices,
    indices,
  });
}
function loadText(path) {
  let request = new XMLHttpRequest();
  request.open("GET", path, false);
  request.send(null)
  return request.responseText;
}

function updateCam() {

  //if (camRot.x <= 90) camRot.x = 0;
  //if (camRot.x < 180) camRot.x = 180;

  let { camRot, camSin, camCos, camPos } = renderer;
  if (camRot.y >= 360) camRot.y -= 360;
  if (camRot.y < 0) camRot.y += 360;

  if (camRot.z >= 360) camRot.z -= 360;
  if (camRot.z < 0) camRot.z += 360;

  camSin.x = Math.sin(camRot.x * 3.14159265 / 180), camCos.x = Math.cos(camRot.x * 3.14159265 / 180);
  camSin.y = Math.sin(camRot.y * 3.14159265 / 180), camCos.y = Math.cos(camRot.y * 3.14159265 / 180);
  camSin.z = Math.sin(camRot.z * 3.14159265 / 180), camCos.z = Math.cos(camRot.z * 3.14159265 / 180);
  if (k[KEY_LEFT] === 1 || k[KEY_UP] === 1 || k[KEY_RIGHT] === 1 || k[KEY_DOWN] === 1) {

    let speed =8;

    if (k[KEY_SHIFT] === 1) speed *= 8;

    //Y
    let yv = camRot.x / 180;
    if (yv > 1) yv = 1 - (yv - 1);
    if (yv < 0.5) yv = 1 - (1 - yv * 2);
    else yv = 1 - ((yv - 0.5) * 2);
    if (camRot.x > 180) yv = -yv;
    if (k[KEY_UP] === 1) camPos.y -= yv * speed;
    else if (k[KEY_DOWN] === 1) camPos.y += yv * speed;
    if (yv < 0) yv = -yv; yv = 1 - yv;
    // Z
    let zv = camRot.y / 180;
    if (zv > 1) zv = 1 - (zv - 1);
    if (zv < 0.5) zv = 1 - zv * 2;
    else zv = (1 - zv - 0.5) * 2;
    if (k[KEY_UP] === 1) camPos.z -= (zv * speed) * yv;
    else if (k[KEY_DOWN] === 1) camPos.z += (zv * speed) * yv;
    if (k[KEY_RIGHT] === 1) camPos.x -= zv * speed;
    else if (k[KEY_LEFT] === 1) camPos.x += zv * speed;

    //X
    let xv = camRot.y / 180;
    if (xv > 1) xv = 1 - (xv - 1);
    if (xv < 0.5) xv = 1 - (1 - xv * 2);
    else xv = 1 - ((xv - 0.5) * 2);
    if (camRot.y > 180) xv = -xv;
    if (k[KEY_UP] === 1) camPos.x -= (xv * speed) * yv;
    else if (k[KEY_DOWN] === 1) camPos.x += (xv * speed) * yv;
    if (k[KEY_RIGHT] === 1) camPos.z += xv * speed;
    else if (k[KEY_LEFT] === 1) camPos.z -= xv * speed;
    

  }


}
let objects = [];
for (let i = 0; i < 10000; i++) {
  objects.push({
    model: models.tree,
    center: new Vec3(0, 0, 0),
    rotation: new Vec3(Math.random() * 5, Math.random() * 360, Math.random() * 0),
    location: new Vec3(Math.random() * 100000 - 50000, 0, Math.random() * 100000 - 50000),
    color: { r: Math.random() * 50, g: Math.random() * 50 + 50, b: Math.random(50) },
    scale: Math.random() * 2 + 1,
  })
}
for (let i = 0; i < 20; i++) {
  objects.push({
    model: models.house,
    center: new Vec3(0, 0, 0),
    rotation: new Vec3(0, Math.random() * 360, 0),
    location: new Vec3(Math.random() * 100000 - 50000, 0, Math.random() * 100000 - 50000),
    color: { r: Math.random() * 20 + 90, g: Math.random() * 20 + 90, b: Math.random() * 20 + 90 },
    scale: 1,
  })
}
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderer.startScene(); {

    
    let size = 100000
    
    for (let i = -size; i <= size; i += 1000) {
      if (i % 10000 === 0)
        renderer.color = { r: 25, g: 75, b: 0 };
      else
        renderer.color = { r: 10, g: 25, b: 0 };
      renderer.drawLine(new Vec3(i, -1, -size), new Vec3(i, -1, size));
      renderer.drawLine(new Vec3(-size, -1, i), new Vec3(size, -1, i));
    }

    for (let i = -size; i <= size; i += 10000) {
      if (i % 100000 === 0)
        renderer.color = { r: 255, g: 255, b: 255 };
      else
        renderer.color = { r: 100, g: 100, b: 255 };
      renderer.drawLine(new Vec3(i, 20000, -size), new Vec3(i, 20000, size));
      renderer.drawLine(new Vec3(-size, 20000, i), new Vec3(size, 20000, i));
    }

    renderer.color = {r:0,g:255,b:255};
    renderer.drawMesh(models.cube, new Vec3(0, 0, 0), new Vec3(angle * 2, angle, 0), new Vec3(2, 2, 2));
    renderer.color = {r:0,g:255,b:0};
    renderer.drawMesh(models.cube, new Vec3(0, 0, 0), new Vec3(angle * 2, angle, 0), new Vec3(-2, -2, -2));

    renderer.color = {r:100,g:100,b:100};
    renderer.drawMesh(models.house, new Vec3(0, 0, 0), new Vec3(0, 66, 0), new Vec3(-180, 0, 470));
    renderer.drawMesh(models.runway, new Vec3(0, 0, 0), new Vec3(0, -25, 0), new Vec3(500, 0, 270));
    renderer.drawMesh(models.tower, new Vec3(0, 0, 0), new Vec3(0, -15, 0), new Vec3(700, 0, 1570));

    for (let i = 0; i < objects.length; i++) {
      renderer.color = objects[i].color;
      renderer.drawMesh(objects[i].model, objects[i].center, objects[i].rotation, objects[i].location, objects[i].scale);
    }

    renderer.color = {r:0,g:0,b:255};
    renderer.drawMesh(models.plane, new Vec3(0, 0, 0), new Vec3(-2, -25, 0), new Vec3(-200, -50, -1270));
    renderer.drawMesh(models.plane, new Vec3(0, 0, 0), new Vec3(-2, -100, 0), new Vec3(14200, 3000, 24270));

  }
  //ctx.imageSmoothingEnabled = false;
  renderer.endScene();

  ctx.strokeStyle = "#0f0";
  ctx.font = "12px consolas ";
  ctx.strokeText("FPS = " + ((1000 / (Date.now() - fpsDate)) | 0), 10, 12, 200);
  ctx.strokeText("time = " + (((Date.now() - fpsDate) | 0) - 10) + "ms", 10, 12 * 2, 200);
  //ctx.strokeText("speedY = " + (planeSpeed.y / 100) + "m/s", 10, 12 * 3, 200);
  fpsDate = Date.now();
}
function main() {
  let time = Date.now() - timer;
  timer = Date.now()
  timerSim += time;
  timerRender += time;
  while (timerSim > 10) {
    timerSim -= 10;
    updateCam();
    angle += 0.5;
  }
  if (timerRender > 10) {
    timerRender = 0;
    render();
  }
  setTimeout(main, 5);
}
