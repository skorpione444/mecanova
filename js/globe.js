// Vanilla JavaScript implementation of Aceternity UI Globe component
// Adapted from React version for use in plain HTML

class GlobeComponent {
  constructor(containerId, config = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    // Default configuration with new color palette
    this.config = {
      pointSize: 3,
      globeColor: "#111318", // Globe Base
      showAtmosphere: true,
      atmosphereColor: "rgba(209,213,219,0.25)", // Glow
      atmosphereAltitude: 0.15,
      emissive: "#111318",
      emissiveIntensity: 0.1,
      shininess: 0.9,
      polygonColor: "#8C8F93", // Cool gray land mass
      ambientLight: "#ffffff",
      directionalLeftLight: "#ffffff",
      directionalTopLight: "#ffffff",
      pointLight: "#ffffff",
      arcTime: 2000,
      arcLength: 0.9,
      rings: 1,
      maxRings: 3,
      initialPosition: { lat: 23, lng: -99 }, // Mexico (matching current Mapbox center)
      autoRotate: true,
      autoRotateSpeed: 0.3,
      ...config
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globe = null;
    this.arcs = [];
    this.animationId = null;
    
    this.init();
  }

  async init() {
    // Wait for scripts to be available (they're loaded in HTML)
    await this.waitForScripts();
    
    // Initialize Three.js scene
    this.setupScene();
    
    // Create globe
    this.createGlobe();
    
    // Add arcs if data provided
    if (this.config.data && this.config.data.length > 0) {
      this.addArcs(this.config.data);
    }
    
    // Start animation
    this.animate();
    
    // Fade in after a short delay
    setTimeout(() => {
      this.container.style.opacity = '1';
      if (window.triggerHeroFadeIn) {
        window.triggerHeroFadeIn();
      }
    }, 100);
  }

  waitForScripts() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      const GlobeClass = this.getGlobeClass();
      if (window.THREE && GlobeClass) {
        this.GlobeClass = GlobeClass;
        resolve();
        return;
      }

      // Wait for scripts to load (they're in HTML head)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      const checkInterval = setInterval(() => {
        attempts++;
        const GlobeClass = this.getGlobeClass();
        if (window.THREE && GlobeClass) {
          this.GlobeClass = GlobeClass;
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          // Log available globals for debugging
          console.log('Available window properties:', Object.keys(window).filter(k => 
            k.toLowerCase().includes('globe') || k.toLowerCase().includes('three')));
          reject(new Error('Timeout waiting for Three.js and Globe to load. THREE: ' + 
            (window.THREE ? 'yes' : 'no') + ', Globe: ' + (GlobeClass ? 'yes' : 'no')));
        }
      }, 100);
    });
  }

  getGlobeClass() {
    // three-globe from unpkg might expose as Globe or ThreeGlobe
    // Check all possible global names
    if (window.Globe && typeof window.Globe === 'function') return window.Globe;
    if (window.ThreeGlobe && typeof window.ThreeGlobe === 'function') return window.ThreeGlobe;
    if (window.threeGlobe && typeof window.threeGlobe === 'function') return window.threeGlobe;
    // Some builds attach to THREE
    if (window.THREE && window.THREE.Globe && typeof window.THREE.Globe === 'function') {
      return window.THREE.Globe;
    }
    // Try accessing via THREE namespace (some builds do this)
    if (window.THREE && typeof window.THREE.Globe !== 'undefined') {
      return window.THREE.Globe;
    }
    return null;
  }

  setupScene() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0B0D); // Background: #0A0B0D

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const { lat, lng } = this.config.initialPosition;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    this.camera.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    this.camera.position.y = 200 * Math.cos(phi);
    this.camera.position.z = 200 * Math.sin(phi) * Math.sin(theta);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(
      new THREE.Color(this.config.ambientLight),
      0.6
    );
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(
      new THREE.Color(this.config.directionalLeftLight),
      0.8
    );
    directionalLight1.position.set(-1, 0, 0);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(
      new THREE.Color(this.config.directionalTopLight),
      0.8
    );
    directionalLight2.position.set(0, 1, 0);
    this.scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(
      new THREE.Color(this.config.pointLight),
      1
    );
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  createGlobe() {
    // Create globe instance using the loaded Globe class
    const GlobeConstructor = this.GlobeClass || this.getGlobeClass();
    if (!GlobeConstructor) {
      console.error('Globe constructor not found. Available globals:', {
        Globe: typeof window.Globe,
        ThreeGlobe: typeof window.ThreeGlobe,
        threeGlobe: typeof window.threeGlobe,
        THREE: typeof window.THREE,
        'THREE.Globe': window.THREE && typeof window.THREE.Globe
      });
      throw new Error('Globe constructor not available. Make sure three-globe is loaded.');
    }
    this.globe = new GlobeConstructor();
    
    // Set globe appearance - use a dark earth texture for subtle detail
    // Using a dark/night earth texture that matches the dark theme
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(this.config.globeColor),
      emissive: new THREE.Color(this.config.emissive),
      emissiveIntensity: this.config.emissiveIntensity,
      shininess: this.config.shininess,
    });
    
    // Use a dark earth texture (night view) or skip for solid color
    // For a darker look, we can skip the texture and use just the material
    // Or use a dark earth texture: '//unpkg.com/three-globe/example/img/earth-night.jpg'
    this.globe.globeMaterial(globeMaterial);
    // Optionally add a subtle dark texture:
    // this.globe.globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg');
    
    // Configure polygon styling for countries - dark grey areas with darker silver borders
    this.globe
      .polygonAltitude(0.01)
      .polygonCapColor(() => 'rgba(15, 15, 15, 0.95)') // Dark grey fill
      .polygonSideColor(() => 'rgba(15, 15, 15, 0.8)') // Dark grey sides
      .polygonStrokeColor(() => '#6B7280'); // Even darker silver borders

    // Load country borders/polygons
    // Load GeoJSON data for countries
    this.loadCountryData();

    // Set empty points and rings initially
    this.globe.pointsData([]);
    this.globe.ringsData([]);

    // Configure atmosphere if enabled
    if (this.config.showAtmosphere) {
      this.globe.atmosphereColor(this.config.atmosphereColor);
      this.globe.atmosphereAltitude(this.config.atmosphereAltitude);
    }

    this.scene.add(this.globe);
  }

  loadCountryData() {
    // Load country boundaries from a GeoJSON file
    // Using a public GeoJSON file with country boundaries
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(data => {
        // three-globe expects features array from GeoJSON
        if (data.features) {
          this.globe.polygonsData(data.features);
        } else if (Array.isArray(data)) {
          this.globe.polygonsData(data);
        } else {
          // If it's TopoJSON, we might need to transform it
          console.warn('Country data format not recognized, trying alternative...');
          this.loadAlternativeCountryData();
        }
      })
      .catch(err => {
        console.warn('Failed to load country data from primary source:', err);
        this.loadAlternativeCountryData();
      });
  }

  loadAlternativeCountryData() {
    // Alternative: Try loading from a different source
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        // TopoJSON format - three-globe can handle TopoJSON directly
        if (data.objects && data.objects.countries) {
          // This is TopoJSON, three-globe should handle it
          this.globe.polygonsData(data);
        } else if (data.features) {
          this.globe.polygonsData(data.features);
        } else {
          console.warn('Could not parse country data format');
        }
      })
      .catch(err => {
        console.error('Failed to load country data:', err);
      });
  }

  addArcs(data) {
    // Set all arcs at once
    this.arcs = data;
    
    this.globe
      .arcsData(this.arcs)
      .arcStartLat(d => d.startLat)
      .arcStartLng(d => d.startLng)
      .arcEndLat(d => d.endLat)
      .arcEndLng(d => d.endLng)
      .arcColor(d => d.color || '#D1D5DB') // Soft silver connection arcs
      .arcAltitude(d => d.arcAlt || 0.1)
      .arcDashLength(this.config.arcLength)
      .arcDashGap(1 - this.config.arcLength)
      .arcDashAnimateTime(this.config.arcTime);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Auto-rotate
    if (this.config.autoRotate) {
      this.globe.rotation.y += this.config.autoRotateSpeed * 0.01;
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.container && this.renderer) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Export for use in HTML (attach to window for non-module access)
window.GlobeComponent = GlobeComponent;

