import React, { useRef, useEffect } from 'react';
import './App.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { AnimationMixer, TextureLoader, PlaneGeometry, MeshStandardMaterial, Mesh } from 'three';

// GLTF 모델을 불러오는 컴포넌트
function Player() {
  const { scene, animations } = useGLTF('/models/player/cac.gltf'); // GLTF 파일 경로
  const mixer = useRef<AnimationMixer | null>(null); // AnimationMixer 타입으로 useRef 초기화

  useEffect(() => {
    // 애니메이션 믹서 설정
    mixer.current = new AnimationMixer(scene);

    // 애니메이션 클립을 믹서에 추가하고 재생
    if (mixer.current) {
      animations.forEach((clip) => {
        if (mixer.current) { // mixer.current가 null이 아닌지 확인
          mixer.current.clipAction(clip).play();
        }
      });
    }

    return () => {
      mixer.current = null; // 컴포넌트 언마운트 시 믹서 정리
    };
  }, [animations, scene]);

  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta); // 애니메이션 업데이트
  });

  // Y축 위치 조정
  return <primitive object={scene} position={[0, 0.5, 0]} />;
}

// 이미지로 길을 만드는 컴포넌트
function Road() {
  const roadTexture = new TextureLoader().load('/models/objects/path.jpg'); // 이미지 경로

  // PlaneGeometry를 생성하여 길을 만듭니다.
  const geometry = new PlaneGeometry(1000, 1000); // 크기를 조절할 수 있습니다.
  const material = new MeshStandardMaterial({ map: roadTexture });
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]}>
      {/* PlaneGeometry는 기본적으로 XY 평면을 따라 있으므로, Y축을 -90도 회전시켜야 바닥에 놓이게 됩니다. */}
    </mesh>
  );
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My Three.js App</h1>
      </header>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[-1, 1, 1]} intensity={0.5} />
        <Player /> {/* GLTF 모델 컴포넌트 추가 */}
        <Road /> {/* 길을 만드는 컴포넌트 추가 */}
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default App;
