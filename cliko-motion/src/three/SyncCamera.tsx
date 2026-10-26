// Recopie la caméra calculée (lib/camera) dans la caméra R3F, avant chaque rendu de frame.
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import { cameraPose } from "../lib/camera";

export const SyncCamera: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const p = cameraPose(frame);
    camera.position.copy(p.pos);
    camera.quaternion.copy(p.quat);
    camera.fov = p.fov;
    camera.near = 0.05;
    camera.far = 400;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }, [frame, camera]);
  return null;
};
