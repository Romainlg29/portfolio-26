import {
	CurveModifier,
	OrbitControls,
	useHelper,
	type CurveModifierProps,
	type CurveModifierRef,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import { useMemo, useRef, type FC } from "react";
import {
	CatmullRomCurve3,
	type DirectionalLight,
	DirectionalLightHelper,
	Vector3,
} from "three";

const lights_options = {
	helper: false,
};

type ShootingStarProps = {
	curve: CatmullRomCurve3;
	children: CurveModifierProps["children"];
};

const ShootingStar: FC<ShootingStarProps> = ({ curve, children }) => {
	const ref = useRef<CurveModifierRef>(null);

	useFrame(() => {
		if (ref.current) {
			// Move continuously along the curve
			ref.current.moveAlongCurve(0.001);

			// Move along the curve using the scrollbar
			ref.current.uniforms.pathOffset.value += 0.001;
		}
	});

	return (
		<CurveModifier ref={ref} curve={curve}>
			{children}
		</CurveModifier>
	);
};

const Lights = () => {
	const { helper } = useControls("Lights", lights_options);

	// Create a reference for the directional light
	const directionalLightRef = useRef<DirectionalLight>(null!);

	// Use the helper to visualize the directional light
	useHelper(helper && directionalLightRef, DirectionalLightHelper, 1, "red");

	return (
		<>
			<ambientLight intensity={0.5} />
			<directionalLight
				ref={directionalLightRef}
				position={[5, 5, 5]}
				intensity={1}
				castShadow
			/>
		</>
	);
};

const Index = () => {
	const { performance } = useControls("Performance", {
		performance: false,
	});

	const curve = useMemo(
		() =>
			new CatmullRomCurve3([
				new Vector3(-10, 0, 10),
				new Vector3(-5, 5, 5),
				new Vector3(0, 0, 0),
				new Vector3(5, -5, 5),
				new Vector3(10, 0, 10),
			]),
		[],
	);

	return (
		<div className="w-dvw h-dvh flex bg-black">
			<Canvas shadows className="w-full h-full">
				<OrbitControls />

				<Lights />

				<EffectComposer>
					<Bloom intensity={100} />
				</EffectComposer>

				<ShootingStar curve={curve}>
					<mesh>
						<sphereGeometry args={[0.1, 16, 16]} />
						<meshStandardMaterial
							color="white"
							emissive="white"
							emissiveIntensity={20}
							toneMapped={false}
						/>
					</mesh>
				</ShootingStar>

				{performance ? <Perf position="top-left" /> : null}
			</Canvas>
		</div>
	);
};

export const Route = createLazyFileRoute("/experiences/shooting-star")({
	component: Index,
});
