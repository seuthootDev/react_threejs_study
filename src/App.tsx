import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { AnimationMixer, TextureLoader, PlaneGeometry, MeshStandardMaterial, Mesh } from 'three';

interface PlayerProps {
  onGameOver: () => void;
  position: [number, number, number];
  setPosition: React.Dispatch<React.SetStateAction<[number, number, number]>>;
}

function Player({ onGameOver, position, setPosition }: PlayerProps) {
  const { scene, animations } = useGLTF('/models/player/cac.gltf');
  const mixer = useRef<AnimationMixer | null>(null);

  useEffect(() => {
    mixer.current = new AnimationMixer(scene);
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
    if (mixer.current) mixer.current.update(delta);
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
  }, [setPosition]);

  return (
    <>
      <primitive object={scene} position={position} rotation={[0, Math.PI, 0]} />
    </>
  );
}

interface ObstacleProps {
  position: [number, number, number];
  resetObstacle: () => void;
}

function Obstacle({ position, resetObstacle }: ObstacleProps) {
  const geometry = new PlaneGeometry(50, 50);
  const material = new MeshStandardMaterial({ color: 'blue' });
  const meshRef = useRef<Mesh | null>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z += 5;
      if (meshRef.current.position.z >= 400) {
        resetObstacle(); // 장애물 위치를 초기화하는 함수 호출
      }
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} position={position} />;
}

function Road() {
  const roadTexture = new TextureLoader().load('/models/objects/path.jpg');
  const geometry = new PlaneGeometry(1000, 1000);
  const material = new MeshStandardMaterial({ map: roadTexture });
  const meshRefs = useRef<Array<Mesh | null>>(Array(3).fill(null));

  useFrame(() => {
    meshRefs.current.forEach((mesh) => {
      if (mesh) {
        mesh.position.z += 5;
        if (mesh.position.z >= 1000) {
          mesh.position.z = -1000;
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
  const [position, setPosition] = useState<[number, number, number]>([0, 90, 300]);
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);

  // 장애물 위치를 관리하는 상태
  const [obstacles, setObstacles] = useState<Array<[number, number, number]>>(
    Array.from({ length: 20 }, () => [
      Math.random() * 800 - 400,
      Math.random() * 90 + 30,
      Math.random() * -500 - 1000,
    ])
  );

  const handleGameOver = () => {
    setGameOver(true);
    alert('Game Over!');
    setTimeout(() => {
      setGameOver(false);
    }, 2000);
  };

  const resetObstacle = (index: number) => {
    setObstacles((prev) => {
      const newObstacles = [...prev];
      newObstacles[index] = [
        Math.random() * 800 - 400,
        Math.random() * 90 + 30,
        Math.random() * -500 - 1000,
      ];
      return newObstacles;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        let [x, y, z] = prev;
        if (isMovingLeft) {
          x = Math.min(x - 5, 400);
        } else if (isMovingRight) {
          x = Math.max(x + 5, -400);
        }
        return [x, y, z];
      });
    }, 100); // 100ms마다 위치 업데이트

    return () => clearInterval(interval); // 클린업
  }, [isMovingLeft, isMovingRight]);

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
        <Player onGameOver={handleGameOver} position={position} setPosition={setPosition} />
        <Road />
        {obstacles.map((obstaclePosition, index) => (
          <Obstacle
            key={index}
            position={obstaclePosition}
            resetObstacle={() => resetObstacle(index)} // 장애물 초기화 함수 전달
          />
        ))}
        <OrbitControls />
      </Canvas>
      <div className="controls">
        <button
          className="control-button"
          onMouseDown={() => setIsMovingLeft(true)}
          onMouseUp={() => setIsMovingLeft(false)}
          onTouchStart={() => setIsMovingLeft(true)}
          onTouchEnd={() => setIsMovingLeft(false)}
        >
          ←
        </button>
        <button
          className="control-button"
          onMouseDown={() => setIsMovingRight(true)}
          onMouseUp={() => setIsMovingRight(false)}
          onTouchStart={() => setIsMovingRight(true)}
          onTouchEnd={() => setIsMovingRight(false)}
        >
          →
        </button>
      </div>
      {gameOver && <div className="game-over">Game Over!</div>}
    </div>
  );
}

export default App;
