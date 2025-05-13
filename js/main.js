import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let object;
const objToRender = 'foot';

let controls;

const loader = new GLTFLoader();

loader.load(
  `./models/${objToRender}/scene.gltf`,
  (gltf) => {
    object = gltf.scene;
    console.log("Model loaded:", object); // Should show Group or Mesh
    
    // Then try adding your foot model
    object.scale.set(0.5, 0.5, 0.5);
    scene.add(object);

    addHotspots();
    
    // Debug camera position
    camera.position.z = 5;
    console.log("Camera position:", camera.position);
    
    // Debug rendering
    renderer.render(scene, camera);
  },
  undefined,
  (error) => console.error("Loading error:", error)
);

// ADDED: Click listener for hotspots
window.addEventListener('click', onClick, false);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

const hotspotsData = [
  {
    name: "Ankle",
    info: "blah blah blah",
    position: new THREE.Vector3(0, -0.7, -0.3)
  },
  {
    name: "Ankle Conditions", 
    info: "We treat ankle conditions such as sprains and fractures, sinus tarsi syndrome, ankle arthritis, posterior tibial tendon dysfunction, tarsal coalition, total ankle joint replacement, Achilles tendon ruptures, anterior tibial tendonitis, peroneal tendonitis, and chronic Achilles tendinosis. The best ankle surgeon in Los Angeles is here to help you!",
    position: new THREE.Vector3(0, -0.2, 0.2)
  },
  {
    name: "Heel Conditions",
    info: "We address plantar fasciitis, Achilles tendonitis, general heel pain, chronic Achilles tendinosis, retrocalcaneal exostosis (heel spurs), and tarsal tunnel syndrome. If you’re looking for the best foot surgeon in Los Angeles or the best Achilles tendonitis treatment in Los Angeles, we have you covered!",
    position: new THREE.Vector3(0, 0.5, -0.2)
  }
];

function addHotspots() {
  if (!object) return;

  const hotspotGroup = new THREE.Group();
  hotspotGroup.name = "hotspots";
  scene.add(hotspotGroup);

  hotspotsData.forEach((hotspot) => {
    // Main sphere (visible part)
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x47B1E9, // White base
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(hotspot.position);
    
    // Add glowing outline
    const outlineGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: hotspot.color || 0x47B1E9,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outline.position.copy(hotspot.position);
    
    // Store hotspot data
    sphere.userData = { 
      isHotspot: true,
      name: hotspot.name,
      info: hotspot.info,
      baseColor: hotspot.color || 0x47B1E9
    };
    
    // Add pulsing animation
    function createPulseAnimation(mesh) {
      let scale = 1;
      return () => {
        scale = 0.9 + Math.sin(Date.now() * 0.005) * 0.2;
        mesh.scale.set(scale, scale, scale);
      };
    }
    
    hotspotGroup.add(sphere);
    hotspotGroup.add(outline);
    
    // Add to animation loop
    const animatePulse = createPulseAnimation(sphere);
    function animate() {
      animatePulse();
      requestAnimationFrame(animate);
    }
    animate();
  });
}

// ADDED: Raycasting for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltipContent = document.getElementById('tooltipContent');

function onClick(event) {
  // Calculate mouse position
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Debug: Log all intersected objects
  const intersects = raycaster.intersectObjects(scene.children);
  console.log("Intersected objects:", intersects);

  // Check for hotspot intersections
  for (const intersect of intersects) {
    console.log("Intersected object data:", intersect.object.userData);
    if (intersect.object.userData.isHotspot) {
      console.log("Hotspot clicked:", intersect.object.userData.name);
      showTooltip(intersect.object.userData);
      return;
    }
  }

  // Hide tooltip if clicking elsewhere
  hideTooltip();
}

function showTooltip(hotspot) {
  const tooltip = document.getElementById('tooltipContainer');
  
  tooltip.innerHTML = `
    <h3 style="color: #47B1E9; font-weight: 400 !important; 
    font-size: 22px; margin-top: 0; font-family: 'TT Commons Pro', sans-serif;">
    ${hotspot.name}
    </h3>
    <p style="font-size: 14px; font-family: 'TT Commons Pro', sans-serif;">${hotspot.info}</p>
    <button class="see-all-btn">See All ${hotspot.name}</button>
  `;
  
  tooltip.style.display = "block";
  tooltip.style.visibility = "visible";
  tooltip.style.opacity = "1";
  
  console.log("Tooltip should now be visible. Current styles:", {
    display: tooltip.style.display,
    visibility: tooltip.style.visibility,
    opacity: tooltip.style.opacity
  });
}

function hideTooltip() {
  // Reset all hotspots
  scene.traverse((obj) => {
    if (obj.userData.isHotspot) {
      obj.material.color.setHex(obj.userData.baseColor);
      obj.material.opacity = 0.8;
    }
  });
  
  tooltipContent.style.display = "none";
}

function updateHotspotPositions() {
    document.querySelectorAll('.hotspot').forEach(domElement => {
        const index = domElement.dataset.index;
        const hotspot = hotspotsData[index];
        const vector = hotspot.position.clone();
        
        // Convert 3D position to 2D screen position
        vector.project(camera);
        const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
        const y = (vector.y * -0.5 + 0.5) * renderer.domElement.clientHeight;
        
        domElement.style.left = `${x}px`;
        domElement.style.top = `${y}px`;
    });
}

// Improved lighting
const topLight = new THREE.DirectionalLight(0xffffff, 4);
topLight.position.set(1, 1, 1); 
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Brighter ambient
scene.add(ambientLight);

// Initialize OrbitControls
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;          // Smooth rotation
controls.dampingFactor = 0.05;         // Rotation friction
controls.enableZoom = false;           // No zooming

window.addEventListener("resize", () => {
    camera.aspect = (window.innerWidth * 0.4) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.4, window.innerHeight);
});

document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateHotspotPositions();
    renderer.render(scene, camera);
}

camera.position.z = 3;
animate();