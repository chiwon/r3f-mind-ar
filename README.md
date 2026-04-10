# r3f-mind-ar

MindAR image tracking components for [React Three Fiber](https://r3f.docs.pmnd.rs/).

Drop AR marker tracking into your R3F scene with a few components — no manual Three.js setup required.

## Features

- Image-based AR marker tracking powered by [MindAR](https://github.com/hiukim/mind-ar-js)
- Declarative R3F components (`<ARView>`, `<ARAnchor>`)
- TypeScript first with full type definitions
- `useFrame`-synced matrix updates with smooth lerp interpolation
- Lightweight — no extra state management dependencies
- Imperative API via ref (`startTracking`, `stopTracking`, `switchCamera`)

## Install

```bash
npm install r3f-mind-ar @react-three/fiber three
```

### Peer dependencies

- `react` >= 18
- `react-dom` >= 18
- `@react-three/fiber` >= 9
- `three` >= 0.137

## Quick Start

```tsx
import { ARView, ARAnchor } from 'r3f-mind-ar';

function App() {
  return (
    <ARView imageTargets="/targets.mind" maxTrack={1}>
      <ambientLight intensity={0.7} />

      <ARAnchor
        target={0}
        onAnchorFound={() => console.log('Found!')}
        onAnchorLost={() => console.log('Lost')}
      >
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshNormalMaterial />
        </mesh>
      </ARAnchor>
    </ARView>
  );
}
```

### Generating `.mind` target files

Use the [MindAR Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile) to convert your target images into `.mind` files.

## API

### `<ARView>`

R3F `<Canvas>` wrapper with built-in AR tracking.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageTargets` | `string` | *required* | URL to the `.mind` target file |
| `maxTrack` | `number` | `1` | Max simultaneous targets |
| `autoplay` | `boolean` | `true` | Auto-start tracking |
| `filterMinCF` | `number \| null` | `null` | One Euro Filter min cutoff |
| `filterBeta` | `number \| null` | `null` | One Euro Filter beta |
| `warmupTolerance` | `number \| null` | `null` | Frames before showing target |
| `missTolerance` | `number \| null` | `null` | Frames before hiding lost target |
| `flipUserCamera` | `boolean` | `false` | Use front camera |
| `onReady` | `() => void` | — | Called when tracking is ready |
| `onError` | `(err: Error) => void` | — | Called on error |

Ref methods: `startTracking()`, `stopTracking()`, `switchCamera()`

### `<ARAnchor>`

Attaches children to a tracked image target.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `target` | `number` | `0` | Target index in the `.mind` file |
| `lerp` | `number` | `1` | Smoothing factor (0–1). Lower = smoother, higher = snappier |
| `onAnchorFound` | `() => void` | — | Called when target is detected |
| `onAnchorLost` | `() => void` | — | Called when target is lost |

Also accepts all `<group>` props.

### `useAR()` hook

Access AR state from any child component inside `<ARView>`.

```tsx
import { useAR } from 'r3f-mind-ar';

function MyComponent() {
  const { isTracking, isReady, anchors, stopTracking } = useAR();
  // ...
}
```

### `<ARProvider>`

If you need to use your own `<Canvas>`, use `<ARProvider>` directly:

```tsx
import { Canvas } from '@react-three/fiber';
import { ARProvider, ARAnchor } from 'r3f-mind-ar';

<Canvas>
  <ARProvider imageTargets="/targets.mind">
    <ARAnchor target={0}>
      <mesh />
    </ARAnchor>
  </ARProvider>
</Canvas>
```

## Examples

Live demos (mobile-friendly, camera required):

| Example | Description |
|---------|-------------|
| [Basic](https://chiwon.github.io/r3f-mind-ar/examples/basic/) | Place a 3D model on a tracked image target with smooth lerp |
| [Video Texture](https://chiwon.github.io/r3f-mind-ar/examples/video-texture/) | Glowing atom trails orbiting the model using Trail + Bloom |

Each demo includes a downloadable AR target card on the start screen.

Run locally:

```bash
cd examples/basic
npm install
npm run dev
```

Open on a device with a camera (or use a webcam) and point at your target image.

## Credits

- [MindAR](https://github.com/hiukim/mind-ar-js) by HiuKim Yuen — the AR engine
- Inspired by [react-three-mind](https://github.com/tommasoturchi/react-three-mind) by Tommaso Turchi

## License

MIT
