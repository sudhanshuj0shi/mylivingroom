import { palette } from '../../world/palette'
import { BlossomCluster } from './BlossomCluster'

type Props = {
  position: [number, number, number]
  seed?: number
}

/** A terracotta pot holding a bougainvillea bush. About 1.1m tall overall. */
export function FlowerPot({ position, seed = 1 }: Props) {
  return (
    <group position={position}>
      {/* Pot: a cylinder that is wider at the top than the bottom. */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.2, 0.5, 24]} />
        <meshStandardMaterial color={palette.redOxide} roughness={0.9} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.035, 8, 24]} />
        <meshStandardMaterial color={palette.redOxide} roughness={0.9} />
      </mesh>
      <BlossomCluster position={[0, 0.72, 0]} radius={0.42} seed={seed} />
    </group>
  )
}
