import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { AnimationMixer, TextureLoader, PlaneGeometry, MeshStandardMaterial, Mesh } from 'three';

// GLTF 모델을 불러오는 컴포넌트
interface PlayerProps {
  onGameOver: () => void; // onGameOver prop의 타입 정의
}

function Player({ onGameOver }: PlayerProps) {
  const { scene, animations } = useGLTF('/models/player/cac.gltf'); // GLTF 파일 경로
  const mixer = useRef<AnimationMixer | null>(null);
  const [position, setPosition] = useState([0, 90, 300]);

  useEffect(() => {
    mixer.current = new AnimationMixer(scene);
    
    // 애니메이션 클립을 믹서에 추가하고 재생
    animations.forEach((clip) => {
      if (mixer.current) { 
        mixer.current.clipAction(clip).play();
      }
    });

    return () => {
      mixer.current = null;
    };
  }, [animations, scene]);

  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta); // 애니메이션 업데이트
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPosition((prev) => {
        let [x, y, z] = prev;
        switch (event.key) {
          case 'ArrowLeft':
            x = Math.min(x - 5, 400);
            break;
          case 'ArrowRight':
            x = Math.max(x + 5, -400);
            break;
          default:
            return prev;
        }
        return [x, y, z];
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <primitive object={scene} position={position} rotation={[0, Math.PI, 0]} />;
}

// 장애물 컴포넌트
function Obstacle({ position }: { position: [number, number, number] }) {
  const geometry = new PlaneGeometry(50, 50); // 장애물 크기
  const material = new MeshStandardMaterial({ color: 'blue' });
  const meshRef = useRef<Mesh | null>(null); // 단일 메쉬 참조

  // 장애물이 매 프레임마다 뒤로 이동하도록 설정
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z += 5; // 장애물 뒤로 이동
      if (meshRef.current.position.z >= 400) {
        meshRef.current.position.y = Math.random() * 90 +30
        meshRef.current.position.z = Math.random() * -500 - 500;
        meshRef.current.position.x = Math.random() * 800 - 400; // 랜덤 X 위치 설정
      }
    }
    
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} position={position} />;
}

// 이미지로 길을 만드는 컴포넌트
function Road() {
  const roadTexture = new TextureLoader().load('/models/objects/path.jpg'); // 이미지 경로
  const geometry = new PlaneGeometry(1000, 1000);
  const material = new MeshStandardMaterial({ map: roadTexture });
  const meshRefs = useRef<Array<Mesh | null>>(Array(3).fill(null));

  useFrame(() => {
    meshRefs.current.forEach((mesh, index) => {
      if (mesh) {
        mesh.position.z += 5; // 길을 뒤로 이동
        if (mesh.position.z >= 1000) {
          mesh.position.z = -1000; // 다시 앞으로 위치시키기
        }
      }
    });
  });

  return (
    <>
      {meshRefs.current.map((_, i) => (
        <mesh
          ref={(el) => (meshRefs.current[i] = el)}
          key={i}
          geometry={geometry}
          material={material}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 1000 * i]}
        />
      ))}
    </>
  );
}

function App() {
  const [gameOver, setGameOver] = useState(false);

  const handleGameOver = () => {
    setGameOver(true);
    alert('Game Over!'); // 게임 오버 메시지
    setTimeout(() => {
      setGameOver(false);
    }, 2000); // 2초 후 초기화
  };

  // 장애물 생성
  const obstacles: [number, number, number][] = Array.from({ length: 20 }, () => [
    Math.random() * 800 - 400, // -400에서 400 사이의 랜덤 X 위치
    Math.random() * 90 +30 ,                        // Y는 고정
    Math.random() * -500 - 1000 // 500에서 1000 사이의 랜덤 Z 위치
  ]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Three.js App</h1>
      </header>
      <Canvas
        camera={{
          position: [0, 300, 600],
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[-1, 1, 1]} intensity={0.5} />
        <Player onGameOver={handleGameOver} />
        <Road />
        {obstacles.map((position, index) => (
          <Obstacle key={index} position={position} />
        ))}
        <OrbitControls />
      </Canvas>
      {gameOver && <div className="game-over">Game Over!</div>}
    </div>
  );
}

export default App;
