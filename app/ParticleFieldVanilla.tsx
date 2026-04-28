'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

export default function ParticleFieldVanilla() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId: number;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let htmlRenderer: any;
    let htmlDiv: HTMLDivElement;
    let tvMesh: THREE.Mesh;
    let screenMesh: THREE.Mesh;
    let floorMesh: THREE.Mesh;
    let ambientLight: THREE.AmbientLight;
    let spotLight: THREE.SpotLight;
    let controls: OrbitControls;
    let composer: EffectComposer;

    async function init() {
      // Import html-in-canvas modules
      const [{ installHtmlInCanvasPolyfill }, { ThreeHTMLRenderer }] = await Promise.all([
        import('three-html-render/polyfill'),
        import('three-html-render/renderer')
      ]);

      // Install polyfill
      installHtmlInCanvasPolyfill();

      // Create scene
      scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 6, 30);

      // Create camera
      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 2, -5);

      // Create WebGL renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // CRITICAL: Add layoutsubtree attribute BEFORE appending
      renderer.domElement.setAttribute('layoutsubtree', '');
      
      // Set FLIP_Y for HTML textures
      const gl = renderer.getContext() as WebGLRenderingContext;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      
      containerRef.current!.appendChild(renderer.domElement);

      // Create HTML renderer and connect AFTER canvas is in DOM
      htmlRenderer = new ThreeHTMLRenderer();
      htmlRenderer.connect(renderer.domElement, camera, renderer);
      
      console.log('HTML Renderer connected, canvas has layoutsubtree:', 
        renderer.domElement.hasAttribute('layoutsubtree'));

      // Minimal ambient to keep silhouettes readable
      ambientLight = new THREE.AmbientLight(0x111111, 0.35);
      scene.add(ambientLight);


      // Floor plane to suggest an infinite surface
      const floorGeometry = new THREE.PlaneGeometry(50, 50, 50, 50);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1c1c1c,
        roughness: 0.9,
        metalness: 0.0,
        depthWrite: false,
      });
      floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = 0;
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);

      // Subject cube
      const tvGeometry = new THREE.BoxGeometry(2, 2, 2);
      const tvMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.0,
      });
      tvMesh = new THREE.Mesh(tvGeometry, tvMaterial);
      tvMesh.position.set(0, 1, -8);
      tvMesh.castShadow = true;
      scene.add(tvMesh);

      spotLight = new THREE.SpotLight(0xffffff, 2.4, 40, Math.PI / 7, 0.2, 0.7);
      spotLight.position.set(0, 7, -8);
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.set(1024, 1024);
      spotLight.shadow.bias = -0.0002;
      spotLight.target = tvMesh;
      scene.add(spotLight);
      scene.add(spotLight.target);

      // Create HTML element - match the examples (no box-sizing!)
      htmlDiv = document.createElement('div');
      htmlDiv.style.cssText = `
        width: 400px;
        height: 400px;
        padding: 10px;
        background: rgba(5, 5, 5, 0.92);
        color: #eaeaea;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        overflow: auto;
      `;
      htmlDiv.innerHTML = `
        <h2 style="margin: 0 0 10px 0; color: #8fb3ff; font-size: 16px;">A Vision</h2>
        <div style="font-size: 12px; line-height: 1.5; color: #d6d6d6;">
          <p style="margin: 0 0 10px 0;">"A vision I had in my sleep last night - as distinguished from a dream which is mere sorting and cataloguing of the day's events by the subconscious. This was a vision, fresh and clear as a mountain stream - the mind revealing itself to itself. In my vision, I was on the veranda of a vast estate, a palazzo of some fantastic proportion. There seemed to emanate from it a light from within - this gleaming radiant marble. I had known this place. I had in fact been born and raised there. This was my first return, a reunion with the deepest wellsprings of my being. Wandering about, I was happy that the house had been immaculately maintained. There had been added a number of additional rooms, but in a way it blended so seamlessly with the original construction, one would never detect any difference. Returning to the house's grand foyer, there came a knock at the door. My son was standing there. He was happy and care-free, clearly living a life of deep harmony and joy. We embraced - a warm and loving embrace, nothing withheld. We were in this moment one. My vision ended. I awoke with a tremendous of optimism and confidence in you and your future. That was my vision; it was of you. I'm so glad to have had this opportunity to share it with you. I wish you nothing but the very best, always."</p>
        </div>
        <div style="margin: 12px 0 0 0; padding: 0 15%;">
          <img src="/content/briggs.jpg" alt="Briggs" style="display: block; width: 100%; height: auto;">
        </div>
        <div style="margin: 12px 0 0 0; padding: 0 10%;">
          <a href="https://vimeo.com/1187123557" target="_blank" rel="noopener" style="text-decoration: none;">
            <div style="width: 100%; background: #111; border: 1px solid #2b2b2b; padding: 14px; box-sizing: border-box;">
              <div style="font-size: 12px; color: #cfcfcf; margin: 0 0 8px 0;">Watch the video on Vimeo</div>
              <div style="display: inline-block; padding: 6px 10px; background: #2d6bff; color: #fff; font-size: 12px;">Play</div>
            </div>
          </a>
        </div>
      `;
      
      // CRITICAL: Add HTML element INSIDE the canvas, not to body
      renderer.domElement.appendChild(htmlDiv);
      
      // Set explicit dimensions in JavaScript (like the official example does)
      htmlDiv.style.width = '400px';
      htmlDiv.style.height = '400px';

      // Create screen plane - match the example ratio
      const planeGeometry = new THREE.PlaneGeometry(2, 2);
      
      // Explicitly set bounding box to match plane size
      planeGeometry.boundingBox = new THREE.Box3(
        new THREE.Vector3(-1, -1, 0),
        new THREE.Vector3(1, 1, 0)
      );
      
      // Create a basic material - the polyfill will replace it with the HTML texture
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
      screenMesh = new THREE.Mesh(planeGeometry, planeMaterial);
      screenMesh.position.set(0, 1, -6.98);
      screenMesh.rotation.y = Math.PI;
      scene.add(screenMesh);

      // CRITICAL: Register the HTML element with the mesh using ThreeHTMLRenderer
      htmlRenderer.addObject(htmlDiv, screenMesh);



      // Add OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 1.5;
      controls.maxDistance = 18;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(0, 1, -8);
      
      // Setup postprocessing with enhanced bloom
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      
      const bloomEffect = new BloomEffect({
        intensity: 2.0,
        luminanceThreshold: 0.15,
        luminanceSmoothing: 0.9,
      });
      composer.addPass(new EffectPass(camera, bloomEffect));
      
      // Disable controls when interacting with HTML elements
      htmlDiv.addEventListener('pointerenter', () => {
        controls.enabled = false;
      });
      htmlDiv.addEventListener('pointerleave', () => {
        controls.enabled = true;
      });

      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        
        // Update HTML overlay renderer on resize
        if (htmlRenderer && htmlRenderer.overlayRenderer) {
          htmlRenderer.overlayRenderer.update();
        }
      };
      window.addEventListener('resize', handleResize);

      // Animation loop
      function animate() {
        animationFrameId = requestAnimationFrame(animate);

        // Update controls
        controls.update();

        // Update HTML renderer - pass the scene so it can find meshes with .element
        if (htmlRenderer) {
          try {
            htmlRenderer.update(scene);
          } catch (e: any) {
            // Log errors to see what's happening
            if (e.message && !e.message.includes('no snapshot')) {
              console.error('HTML renderer error:', e.message);
            }
          }
        }

        // Render scene with postprocessing
        composer.render();
      }

      animate();

      // Store cleanup function
      cleanupRef.current = () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        
        if (controls) {
          controls.dispose();
        }
        
        if (composer) {
          composer.dispose();
        }
        
        if (htmlRenderer) {
          htmlRenderer.disconnect();
        }
        
        if (htmlDiv && htmlDiv.parentNode) {
          htmlDiv.parentNode.removeChild(htmlDiv);
        }
        
        if (renderer) {
          renderer.dispose();
          containerRef.current?.removeChild(renderer.domElement);
        }
        
        if (floorMesh) {
          floorMesh.geometry.dispose();
          (floorMesh.material as THREE.Material).dispose();
          scene.remove(floorMesh);
        }

        if (tvMesh) {
          tvMesh.geometry.dispose();
          (tvMesh.material as THREE.Material).dispose();
          scene.remove(tvMesh);
        }

        if (screenMesh) {
          screenMesh.geometry.dispose();
          (screenMesh.material as THREE.Material).dispose();
          scene.remove(screenMesh);
        }

        if (ambientLight) {
          scene.remove(ambientLight);
        }

        if (spotLight) {
          scene.remove(spotLight);
        }
      };
    }

    init().catch(console.error);

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: '#000',
      }}
    />
  );
}
