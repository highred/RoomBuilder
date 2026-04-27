import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BuilderItem, RoomBuilder, SavedAsset, SavedRoom, storeImportedModelFile } from "./roomScene";

window.addEventListener("error", (event) => {
  showStartupError(event.error?.stack || event.message || "Unknown startup error");
});
window.addEventListener("unhandledrejection", (event) => {
  showStartupError(event.reason?.stack || String(event.reason || "Unknown async error"));
});

function showStartupError(message: string) {
  console.error(message);
  let panel = document.querySelector<HTMLElement>("#startupError");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "startupError";
    panel.style.cssText = "position:fixed;left:340px;right:20px;bottom:20px;z-index:9999;max-height:38vh;overflow:auto;background:#2b1414;color:#fff;padding:14px;border-radius:8px;font:12px/1.4 monospace;white-space:pre-wrap;box-shadow:0 18px 40px rgba(0,0,0,.28)";
    document.body.append(panel);
  }
  panel.textContent = message;
}

type ExportDirectoryHandle = {
  name: string;
  queryPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (options?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<ExportDirectoryHandle>;
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("Scene canvas not found");
const app = document.querySelector<HTMLElement>("#app");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#d9d5c5");
scene.fog = null;

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(9.8, 8.4, 10.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.screenSpacePanning = true;
controls.minDistance = 4.2;
controls.maxDistance = 34;
controls.maxPolarAngle = Math.PI * 0.52;
controls.mouseButtons = {
  LEFT: undefined as any,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.ROTATE,
};
controls.target.set(0, 1.25, -0.15);
controls.autoRotate = false;
controls.autoRotateSpeed = 0.7;

const builder = new RoomBuilder(scene);
const sharedRoom = readSharedRoomFromHash();
const readOnlyMode = !!sharedRoom;
if (readOnlyMode) document.body.classList.add("readonly-share");
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let dragging = false;
let didDrag = false;
let draggingBuildingRoomId: string | null = null;
let buildingDidDrag = false;
let buildingPointerStart = { x: 0, y: 0 };
let boxSelecting = false;
let boxDidDrag = false;
let boxStart = { x: 0, y: 0 };
const selectionMarquee = document.createElement("div");
selectionMarquee.className = "selection-marquee hidden";
document.body.append(selectionMarquee);
let lastMouseMove = performance.now();
let focusTween: {
  start: number;
  duration: number;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
} | null = null;

const zoomIn = document.querySelector<HTMLButtonElement>("#zoomIn");
const zoomOut = document.querySelector<HTMLButtonElement>("#zoomOut");
const resetView = document.querySelector<HTMLButtonElement>("#resetView");
const autoOrbit = document.querySelector<HTMLButtonElement>("#autoOrbit");
const selectedName = document.querySelector<HTMLElement>("#selectedName");
const selectedMeta = document.querySelector<HTMLElement>("#selectedMeta");
const selectionPanel = document.querySelector<HTMLElement>("#selectionPanel");
const assetGrid = document.querySelector<HTMLElement>("#assetGrid");
const assetPrompt = document.querySelector<HTMLInputElement>("#assetPrompt");
const modelImport = document.querySelector<HTMLInputElement>("#modelImport");
const rotationInput = document.querySelector<HTMLInputElement>("#rotationInput");
const colorInput = document.querySelector<HTMLInputElement>("#colorInput");
const roomName = document.querySelector<HTMLInputElement>("#roomName");
const roomWidth = document.querySelector<HTMLInputElement>("#roomWidth");
const roomDepth = document.querySelector<HTMLInputElement>("#roomDepth");
const roomList = document.querySelector<HTMLElement>("#roomList");
const buildingRoomList = document.querySelector<HTMLElement>("#buildingRoomList");
const connectedRooms = document.querySelector<HTMLElement>("#connectedRooms");
const status = document.querySelector<HTMLElement>("#status");
const perfFps = document.querySelector<HTMLElement>("#perfFps");
const perfItems = document.querySelector<HTMLElement>("#perfItems");
const perfDraws = document.querySelector<HTMLElement>("#perfDraws");
const perfTris = document.querySelector<HTMLElement>("#perfTris");
const perfHud = document.querySelector<HTMLElement>("#perfHud");
const sunAzimuth = document.querySelector<HTMLInputElement>("#sunAzimuth");
const sunElevation = document.querySelector<HTMLInputElement>("#sunElevation");
const sunIntensity = document.querySelector<HTMLInputElement>("#sunIntensity");
const interiorLight = document.querySelector<HTMLInputElement>("#interiorLight");
const roofMode = document.querySelector<HTMLInputElement>("#roofMode");
let exportDirectoryHandle: ExportDirectoryHandle | null = null;
let smoothedFps = 60;
let lastFrameTime = performance.now();
let lastPerfUpdate = 0;
let currentPixelRatio = Math.min(window.devicePixelRatio, 1.5);
let shadowQuality: "high" | "low" = "high";
renderer.setPixelRatio(currentPixelRatio);

function dolly(amount: number) {
  const direction = new THREE.Vector3()
    .subVectors(camera.position, controls.target)
    .normalize();
  camera.position.addScaledVector(direction, amount);
  controls.update();
}

zoomIn?.addEventListener("click", () => dolly(-0.9));
zoomOut?.addEventListener("click", () => dolly(1.6));
resetView?.addEventListener("click", () => {
  camera.position.set(9.8, 8.4, 10.2);
  controls.target.set(0, 1.25, -0.15);
  controls.update();
});
autoOrbit?.addEventListener("click", () => {
  controls.autoRotate = !controls.autoRotate;
  autoOrbit.classList.toggle("active", controls.autoRotate);
  lastMouseMove = performance.now();
  app?.classList.remove("ui-hidden");
});

document.querySelectorAll<HTMLButtonElement>("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    if (readOnlyMode) return;
    const added = builder.add(button.dataset.add as any, { x: 0, z: 0 });
    flash(added ? `Added ${button.textContent?.trim()}` : `Item cap reached (${builder.getMaxItems()})`);
  });
});

document.querySelector<HTMLButtonElement>("#duplicate")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  const before = builder.getItemCount();
  builder.duplicateSelected();
  flash(builder.getItemCount() > before ? "Duplicated selected item" : `Item cap reached (${builder.getMaxItems()})`);
});

document.querySelector<HTMLButtonElement>("#savePrefab")?.addEventListener("click", () => {
  builder.saveSelectedAsAsset();
  flash("Made selected asset permanent");
});

document.querySelector<HTMLButtonElement>("#deleteItem")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  builder.deleteSelected();
  flash("Removed selected item");
});

document.querySelector<HTMLButtonElement>("#rotateLeft")?.addEventListener("click", () => builder.rotateSelected(-Math.PI / 8));
document.querySelector<HTMLButtonElement>("#rotateRight")?.addEventListener("click", () => builder.rotateSelected(Math.PI / 8));
document.querySelector<HTMLButtonElement>("#scaleDown")?.addEventListener("click", () => builder.scaleSelected(-0.1));
document.querySelector<HTMLButtonElement>("#scaleUp")?.addEventListener("click", () => builder.scaleSelected(0.1));
document.querySelector<HTMLButtonElement>("#heightDown")?.addEventListener("click", () => builder.moveSelectedVertical(-0.1));
document.querySelector<HTMLButtonElement>("#heightUp")?.addEventListener("click", () => builder.moveSelectedVertical(0.1));
document.querySelector<HTMLButtonElement>("#heightFineDown")?.addEventListener("click", () => builder.moveSelectedVertical(-0.01));
document.querySelector<HTMLButtonElement>("#heightFineUp")?.addEventListener("click", () => builder.moveSelectedVertical(0.01));
document.querySelector<HTMLButtonElement>("#snapSurface")?.addEventListener("click", () => {
  builder.snapSelectedToSurface();
  flash("Snapped selected item to the nearest surface");
});
document.querySelector<HTMLButtonElement>("#nudgeLeft")?.addEventListener("click", () => builder.nudgeSelected(-0.05, 0));
document.querySelector<HTMLButtonElement>("#nudgeRight")?.addEventListener("click", () => builder.nudgeSelected(0.05, 0));
document.querySelector<HTMLButtonElement>("#nudgeBack")?.addEventListener("click", () => builder.nudgeSelected(0, -0.05));
document.querySelector<HTMLButtonElement>("#nudgeForward")?.addEventListener("click", () => builder.nudgeSelected(0, 0.05));
document.querySelector<HTMLButtonElement>("#rotateMinusOne")?.addEventListener("click", () => builder.rotateSelected(THREE.MathUtils.degToRad(-1)));
document.querySelector<HTMLButtonElement>("#rotatePlusOne")?.addEventListener("click", () => builder.rotateSelected(THREE.MathUtils.degToRad(1)));
document.querySelector<HTMLButtonElement>("#snapRotation")?.addEventListener("click", () => {
  builder.snapSelectedRotationToRightAngle();
  flash("Snapped rotation to 90 degrees");
});
rotationInput?.addEventListener("change", () => {
  builder.setSelectedRotationDegrees(Number(rotationInput.value));
});
colorInput?.addEventListener("input", () => {
  if (readOnlyMode) return;
  builder.setSelectedTint(colorInput.value);
});
document.querySelector<HTMLButtonElement>("#saveRoom")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  const saved = builder.saveCurrentRoom(roomName?.value ?? "");
  if (saved) {
    if (roomName) roomName.value = saved.name;
    renderRoomList(builder.getSavedRooms());
    renderBuildingRoomList(builder.getSavedRooms());
    renderConnectedRooms();
    flash(`Updated ${saved.name}`);
  } else {
    flash("Room saved in this browser");
  }
});
document.querySelector<HTMLButtonElement>("#saveNamedRoom")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  const saved = builder.saveNamedRoom(roomName?.value ?? "");
  if (roomName) roomName.value = saved.name;
  renderRoomList(builder.getSavedRooms());
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  flash(`Saved ${saved.name}`);
});
document.querySelector<HTMLButtonElement>("#newRoom")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  const size = builder.newRoom();
  restoreShadowMode();
  if (roomName) roomName.value = "";
  renderRoomSize();
  renderCurrentRoomName();
  renderLightingControls();
  renderRoomList(builder.getSavedRooms());
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  flash(`New ${size.widthFeet} x ${size.depthFeet} ft room ready`);
});
document.querySelector<HTMLButtonElement>("#showBuilding")?.addEventListener("click", () => {
  builder.showBuildingOverview(builder.getSavedRooms());
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  zoomToBuildingView();
  flash("Building outline enabled");
});
document.querySelector<HTMLButtonElement>("#hideBuilding")?.addEventListener("click", () => {
  builder.hideBuildingOverview();
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  flash("Returned to active room");
});
document.querySelector<HTMLButtonElement>("#refreshBuilding")?.addEventListener("click", () => {
  builder.showBuildingOverview(builder.getSavedRooms());
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  flash("Floorplan refreshed");
});
document.querySelector<HTMLButtonElement>("#connectRoom")?.addEventListener("click", () => {
  const selected = builder.getSelectedBuildingRoomIds();
  if (selected.length < 2) {
    flash("Select at least two room outlines");
    return;
  }
  forEachSelectedRoomPair(selected, (a, b) => builder.connectBuildingRooms(a, b));
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  flash("Selected rooms connected");
});
document.querySelector<HTMLButtonElement>("#disconnectRoom")?.addEventListener("click", () => {
  const selected = builder.getSelectedBuildingRoomIds();
  if (selected.length < 2) {
    flash("Select at least two connected room outlines");
    return;
  }
  forEachSelectedRoomPair(selected, (a, b) => builder.disconnectBuildingRooms(a, b));
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  flash("Selected room connections removed");
});
document.querySelector<HTMLButtonElement>("#clearConnections")?.addEventListener("click", () => {
  builder.clearBuildingConnections();
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  flash("All room connections cleared");
});
document.querySelector<HTMLButtonElement>("#rotateRoomLeft")?.addEventListener("click", () => {
  rotateSelectedBuildingRooms(-90);
});
document.querySelector<HTMLButtonElement>("#rotateRoomRight")?.addEventListener("click", () => {
  rotateSelectedBuildingRooms(90);
});
document.querySelector<HTMLButtonElement>("#copyShareLink")?.addEventListener("click", async () => {
  const room = builder.exportRoom(roomName?.value ?? "Shared room");
  const url = `${window.location.origin}${window.location.pathname}#share=${encodeSharePayload(room)}`;
  await navigator.clipboard.writeText(url);
  flash(window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "Copied link. Host the app publicly before sending it."
    : "Copied read-only room link");
});
document.querySelector<HTMLButtonElement>("#setExportFolder")?.addEventListener("click", async () => {
  await chooseExportFolder();
});
document.querySelector<HTMLButtonElement>("#exportScreenshot")?.addEventListener("click", () => {
  controls.update();
  renderer.render(scene, camera);
  renderer.domElement.toBlob((blob: Blob | null) => {
    if (!blob) {
      flash("Screenshot export failed");
      return;
    }
    const fileName = `${fileSafeName(roomName?.value.trim() || "room")}-screenshot.png`;
    void saveExportFile(blob, fileName);
  }, "image/png");
});
document.querySelector<HTMLButtonElement>("#exportOrbitClip")?.addEventListener("click", async () => {
  await exportOrbitClip();
});
document.querySelector<HTMLButtonElement>("#exportRoomData")?.addEventListener("click", () => {
  const room = builder.exportRoom(roomName?.value ?? "Exported room");
  const blob = new Blob([JSON.stringify(room, null, 2)], { type: "application/json" });
  const fileName = `${fileSafeName(room.name)}.json`;
  void saveExportFile(blob, fileName);
});
document.querySelector<HTMLButtonElement>("#addBenchmarkItems")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  const added = addBenchmarkItems();
  flash(added ? `Added ${added} benchmark items` : `Item cap reached (${builder.getMaxItems()})`);
});
document.querySelector<HTMLButtonElement>("#togglePerfHud")?.addEventListener("click", () => {
  perfHud?.classList.toggle("hidden");
});
[sunAzimuth, sunElevation, sunIntensity, interiorLight, roofMode].forEach((input) => {
  input?.addEventListener("input", () => {
    builder.setLighting({
      azimuth: Number(sunAzimuth?.value),
      elevation: Number(sunElevation?.value),
      intensity: Number(sunIntensity?.value),
      interior: Number(interiorLight?.value),
      roof: !!roofMode?.checked,
    });
  });
});
document.querySelector<HTMLButtonElement>("#randomRoom")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  builder.randomizeRoom();
  renderRoomSize();
  renderLightingControls();
  flash("Generated a new room shell");
});
document.querySelector<HTMLButtonElement>("#applyRoomSize")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  const size = builder.setRoomSize(Number(roomWidth?.value), Number(roomDepth?.value));
  renderRoomSize();
  flash(`Room resized to ${size.widthFeet} x ${size.depthFeet} ft`);
});
document.querySelector<HTMLButtonElement>("#undoRoom")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  if (builder.undo()) {
    restoreShadowMode();
    renderRoomSize();
    renderCurrentRoomName();
    renderLightingControls();
    flash("Undid last change");
  } else {
    flash("Nothing to undo");
  }
});
document.querySelector<HTMLButtonElement>("#resetDemo")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  builder.resetDemo();
  restoreShadowMode();
  renderLightingControls();
  flash("Demo room restored");
});
document.querySelector<HTMLButtonElement>("#clearRoom")?.addEventListener("click", () => {
  if (readOnlyMode) return;
  builder.clearRoom();
  flash("Room cleared");
});
document.querySelector<HTMLButtonElement>("#generateAsset")?.addEventListener("click", async () => {
  if (readOnlyMode) return;
  await generatePromptAsset();
});
assetPrompt?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  if (readOnlyMode) return;
  void generatePromptAsset();
});
modelImport?.addEventListener("change", async () => {
  if (readOnlyMode) return;
  await importModelFile();
});

builder.onSelectionChange = renderSelection;
builder.onAssetLibraryChange = renderAssetLibrary;
if (sharedRoom) {
  builder.loadRoomData(sharedRoom);
  if (roomName) roomName.value = sharedRoom.name;
  renderLightingControls();
  flash("Read-only shared room loaded");
}
renderSelection(builder.selectedItem);
renderAssetLibrary(builder.getAssets());
renderRoomList(builder.getSavedRooms());
renderBuildingRoomList(builder.getSavedRooms());
renderConnectedRooms();
renderRoomSize();
renderCurrentRoomName();
renderLightingControls();
void restoreExportFolder();

renderer.domElement.addEventListener("pointerdown", (event: PointerEvent) => {
  if (readOnlyMode) return;
  if (event.button !== 0) return;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  if (builder.isBuildingMode()) {
    const roomHits = raycaster.intersectObjects(builder.getBuildingObjects(), true);
    if (roomHits.length) {
      const roomId = builder.getBuildingRoomIdFromObject(roomHits[0].object);
      if (roomId) {
        draggingBuildingRoomId = roomId;
        buildingDidDrag = false;
        buildingPointerStart = { x: event.clientX, y: event.clientY };
        controls.enabled = false;
        renderer.domElement.setPointerCapture(event.pointerId);
        return;
      }
    }
  }
  const hits = raycaster.intersectObjects(builder.getDraggableObjects(), true);
  if (hits.length) {
    builder.selectFromObject(hits[0].object);
    dragging = true;
    didDrag = false;
    controls.enabled = false;
    renderer.domElement.setPointerCapture(event.pointerId);
  } else {
    boxSelecting = true;
    boxDidDrag = false;
    boxStart = { x: event.clientX, y: event.clientY };
    updateSelectionMarquee(event.clientX, event.clientY);
    controls.enabled = false;
    renderer.domElement.setPointerCapture(event.pointerId);
  }
});

renderer.domElement.addEventListener("dblclick", (event: MouseEvent) => {
  if (event.button !== 0) return;
  updatePointer(event as PointerEvent);
  raycaster.setFromCamera(pointer, camera);
  if (builder.isBuildingMode()) {
    const roomHits = raycaster.intersectObjects(builder.getBuildingObjects(), true);
    if (roomHits.length) {
      const roomId = builder.getBuildingRoomIdFromObject(roomHits[0].object);
      if (roomId) {
        builder.toggleBuildingRoomSelection(roomId);
        renderBuildingRoomList(builder.getSavedRooms());
      }
      return;
    }
  }
  const hits = raycaster.intersectObjects(builder.getDraggableObjects(), true);
  if (!hits.length) return;
  builder.selectFromObject(hits[0].object);
  centerCameraOnSelection();
});

renderer.domElement.addEventListener("contextmenu", (event: MouseEvent) => {
  event.preventDefault();
});

renderer.domElement.addEventListener("pointermove", (event: PointerEvent) => {
  lastMouseMove = performance.now();
  app?.classList.remove("ui-hidden");
  if (draggingBuildingRoomId) {
    const distance = Math.hypot(event.clientX - buildingPointerStart.x, event.clientY - buildingPointerStart.y);
    buildingDidDrag = buildingDidDrag || distance > 4;
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const point = builder.getBuildingFloorPoint(raycaster);
    if (point) builder.moveBuildingRoom(draggingBuildingRoomId, { x: point.x, z: point.z });
    return;
  }
  if (boxSelecting) {
    const distance = Math.hypot(event.clientX - boxStart.x, event.clientY - boxStart.y);
    boxDidDrag = boxDidDrag || distance > 5;
    updateSelectionMarquee(event.clientX, event.clientY);
    return;
  }
  if (!dragging) return;
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);
  const point = builder.getFloorPoint(raycaster);
  if (!point) return;
  if (!didDrag) builder.beginUndoStep();
  builder.moveSelected({ x: point.x, z: point.z });
  didDrag = true;
});

window.addEventListener("mousemove", () => {
  lastMouseMove = performance.now();
  app?.classList.remove("ui-hidden");
});

renderer.domElement.addEventListener("pointerup", (event: PointerEvent) => {
  if (draggingBuildingRoomId) {
    renderer.domElement.releasePointerCapture(event.pointerId);
    controls.enabled = true;
    const roomId = draggingBuildingRoomId;
    draggingBuildingRoomId = null;
    renderBuildingRoomList(builder.getSavedRooms());
    if (buildingDidDrag) {
      flash("Room placement saved");
    } else {
      builder.toggleBuildingRoomSelection(roomId);
      renderBuildingRoomList(builder.getSavedRooms());
      flash("Room outline selection updated");
    }
    return;
  }
  if (boxSelecting) {
    renderer.domElement.releasePointerCapture(event.pointerId);
    controls.enabled = true;
    boxSelecting = false;
    selectionMarquee.classList.add("hidden");
    if (boxDidDrag) {
      const rect = marqueeRect(boxStart.x, boxStart.y, event.clientX, event.clientY);
      const count = builder.selectInScreenRect(camera, rect, renderer.domElement.getBoundingClientRect());
      flash(count ? `Selected ${count} item${count === 1 ? "" : "s"}` : "No items in selection");
    } else {
      builder.select(null);
    }
    return;
  }
  if (dragging) {
    renderer.domElement.releasePointerCapture(event.pointerId);
    controls.enabled = true;
    dragging = false;
    if (didDrag) {
      builder.persist();
      flash("Item moved and snapped to grid");
    }
  }
});

window.addEventListener("keydown", (event) => {
  if (readOnlyMode) return;
  const target = event.target as HTMLElement | null;
  if (target?.tagName === "INPUT") return;
  if (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    if (builder.undo()) {
      restoreShadowMode();
      renderRoomSize();
      renderCurrentRoomName();
      renderLightingControls();
      flash("Undid last change");
    } else {
      flash("Nothing to undo");
    }
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") builder.deleteSelected();
  if (event.key.toLowerCase() === "d" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    builder.duplicateSelected();
    return;
  }
  if (event.key === "[" || event.key.toLowerCase() === "q") builder.rotateSelected(-Math.PI / 8);
  if (event.key === "]" || event.key.toLowerCase() === "e") builder.rotateSelected(Math.PI / 8);
  if (event.key.toLowerCase() === "a") builder.nudgeSelected(-0.05, 0);
  if (event.key.toLowerCase() === "d") builder.nudgeSelected(0.05, 0);
  if (event.key.toLowerCase() === "w") builder.nudgeSelected(0, -0.05);
  if (event.key.toLowerCase() === "s") builder.nudgeSelected(0, 0.05);
  if (event.key === "PageUp") builder.moveSelectedVertical(0.1);
  if (event.key === "PageDown") builder.moveSelectedVertical(-0.1);
  if (event.key === "ArrowUp" && event.shiftKey) builder.moveSelectedVertical(0.01);
  if (event.key === "ArrowDown" && event.shiftKey) builder.moveSelectedVertical(-0.01);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(currentPixelRatio);
});

renderer.domElement.addEventListener("webglcontextlost", (event: Event) => {
  event.preventDefault();
});

const clock = new THREE.Clock();
function tick() {
  const now = performance.now();
  const frameFps = 1000 / Math.max(1, now - lastFrameTime);
  lastFrameTime = now;
  smoothedFps = smoothedFps * 0.92 + frameFps * 0.08;
  const elapsed = clock.getElapsedTime();
  builder.update(elapsed, camera.position);
  if (focusTween) {
    const t = Math.min(1, (now - focusTween.start) / focusTween.duration);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(focusTween.fromPosition, focusTween.toPosition, eased);
    controls.target.lerpVectors(focusTween.fromTarget, focusTween.toTarget, eased);
    if (t >= 1) focusTween = null;
  }
  controls.update();
  if (controls.autoRotate && performance.now() - lastMouseMove > 1450) {
    app?.classList.add("ui-hidden");
  }
  renderer.render(scene, camera);
  if (now - lastPerfUpdate > 500) {
    updatePerformanceStats();
    lastPerfUpdate = now;
  }
  requestAnimationFrame(tick);
}

tick();

function updatePointer(event: PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function marqueeRect(x1: number, y1: number, x2: number, y2: number) {
  return new DOMRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
}

function updateSelectionMarquee(x: number, y: number) {
  const rect = marqueeRect(boxStart.x, boxStart.y, x, y);
  selectionMarquee.style.left = `${rect.left}px`;
  selectionMarquee.style.top = `${rect.top}px`;
  selectionMarquee.style.width = `${rect.width}px`;
  selectionMarquee.style.height = `${rect.height}px`;
  selectionMarquee.classList.toggle("hidden", rect.width < 5 && rect.height < 5);
}

function centerCameraOnSelection() {
  const center = builder.getSelectedCenter();
  if (!center) return;
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const minDistance = 5.2;
  if (offset.length() < minDistance) offset.setLength(minDistance);
  focusTween = {
    start: performance.now(),
    duration: 520,
    fromTarget: controls.target.clone(),
    toTarget: center.clone().add(new THREE.Vector3(0, 0.35, 0)),
    fromPosition: camera.position.clone(),
    toPosition: center.clone().add(offset),
  };
  flash("Camera centered on selection");
}

function zoomToBuildingView() {
  focusTween = {
    start: performance.now(),
    duration: 640,
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3(0, 0.45, 0),
    fromPosition: camera.position.clone(),
    toPosition: new THREE.Vector3(13.5, 14.5, 13.5),
  };
}

function zoomToRoomView() {
  focusTween = {
    start: performance.now(),
    duration: 720,
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3(0, 1.25, -0.15),
    fromPosition: camera.position.clone(),
    toPosition: new THREE.Vector3(9.8, 8.4, 10.2),
  };
}

function forEachSelectedRoomPair(roomIds: string[], action: (a: string, b: string) => void) {
  for (let i = 0; i < roomIds.length; i += 1) {
    for (let j = i + 1; j < roomIds.length; j += 1) action(roomIds[i], roomIds[j]);
  }
}

function rotateSelectedBuildingRooms(deltaDegrees: number) {
  const selected = builder.getSelectedBuildingRoomIds();
  if (!selected.length) {
    flash("Select a room outline first");
    return;
  }
  for (const id of selected) builder.rotateBuildingRoom(id, deltaDegrees);
  renderBuildingRoomList(builder.getSavedRooms());
  flash("Selected room outline rotated");
}

function enterRoom(roomId: string) {
  const room = builder.getSavedRooms().find((entry) => entry.id === roomId);
  const loaded = builder.loadNamedRoom(roomId);
  if (!loaded) return;
  if (builder.isBuildingMode()) builder.hideBuildingOverview();
  if (roomName) roomName.value = loaded.name;
  restoreShadowMode();
  renderRoomSize();
  renderLightingControls();
  renderRoomList(builder.getSavedRooms());
  renderBuildingRoomList(builder.getSavedRooms());
  renderConnectedRooms();
  zoomToRoomView();
  flash(`Entered ${room?.name ?? loaded.name}`);
}

function renderConnectedRooms() {
  if (!connectedRooms) return;
  connectedRooms.innerHTML = "";
  if (builder.isBuildingMode()) {
    connectedRooms.classList.add("hidden");
    return;
  }
  const current = builder.getCurrentRoomId();
  const connectedIds = current ? builder.getConnectedRoomIds(current) : [];
  const rooms = builder.getSavedRooms().filter((room) => connectedIds.includes(room.id));
  connectedRooms.classList.toggle("hidden", rooms.length === 0);
  for (const room of rooms) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = room.name || "Connected room";
    button.title = `Enter ${room.name || "room"}`;
    button.addEventListener("click", () => enterRoom(room.id));
    connectedRooms.append(button);
  }
}

function renderSelection(item: BuilderItem | null) {
  if (!selectedName || !selectedMeta) return;
  const selectionCount = builder.getSelectionCount();
  selectionPanel?.classList.toggle("hidden", selectionCount === 0);
  selectedName.textContent = selectionCount > 1 ? `${selectionCount} items selected` : item ? item.name : "Nothing selected";
  if (rotationInput) {
    rotationInput.value = item ? String(((Math.round(THREE.MathUtils.radToDeg(item.rotation)) % 360) + 360) % 360) : "0";
  }
  if (colorInput) colorInput.value = item?.tint && item.tint.startsWith("#") ? item.tint : "#78938a";
  selectedMeta.textContent = item
    ? `${item.kind} | x ${item.position.x.toFixed(2)}, z ${item.position.z.toFixed(2)} | height ${(item.elevation ?? 0).toFixed(2)} | rot ${((Math.round(THREE.MathUtils.radToDeg(item.rotation)) % 360) + 360) % 360} deg | scale ${item.scale.toFixed(1)}`
    : "Click an item, then drag it across the grid.";
}

function renderAssetLibrary(assets: SavedAsset[]) {
  if (!assetGrid) return;
  assetGrid.innerHTML = "";
  if (!assets.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Generated or saved permanent assets will appear here.";
    assetGrid.append(empty);
    return;
  }
  for (const asset of assets) {
    const tile = document.createElement("div");
    tile.className = "asset-tile";
    const place = document.createElement("button");
    place.className = "asset-place";
    place.type = "button";
    place.innerHTML = asset.imageData
      ? `<img src="${asset.imageData}" alt=""><span>${asset.name}</span>`
      : asset.kind === "importedModel"
        ? `<b>3D</b><span>${asset.name}</span>`
      : `<b>${asset.kind.slice(0, 2).toUpperCase()}</b><span>${asset.name}</span>`;
    place.addEventListener("click", () => {
      builder.addFromAsset(asset.id);
      flash(`Placed ${asset.name}`);
    });
    const remove = document.createElement("button");
    remove.className = "asset-delete";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      builder.deleteAsset(asset.id);
      flash(`Deleted ${asset.name}`);
    });
    const edit = document.createElement("button");
    edit.className = "asset-delete";
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      tile.classList.add("editing");
      input.focus();
      input.select();
    });
    const input = document.createElement("input");
    input.className = "asset-rename";
    input.type = "text";
    input.value = asset.name;
    const commitRename = () => {
      const nextName = input.value.trim();
      tile.classList.remove("editing");
      if (!nextName || nextName === asset.name) return;
      builder.renameAsset(asset.id, nextName);
      flash(`Renamed ${nextName}`);
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") commitRename();
      if (event.key === "Escape") {
        input.value = asset.name;
        tile.classList.remove("editing");
      }
    });
    input.addEventListener("blur", commitRename);
    const row = document.createElement("div");
    row.className = "asset-actions";
    row.append(edit, remove);
    tile.append(place, input, row);
    assetGrid.append(tile);
  }
}

function renderRoomList(rooms: SavedRoom[]) {
  if (!roomList) return;
  roomList.innerHTML = "";
  if (!rooms.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Named saved rooms will appear here.";
    roomList.append(empty);
    return;
  }
  for (const room of rooms) {
    if (!room?.id) continue;
    const isConnected = builder.getConnectedRoomIds().includes(room.id);
    const isSelected = builder.getSelectedBuildingRoomIds().includes(room.id);
    const row = document.createElement("div");
    row.className = "room-row";
    const button = document.createElement("button");
    button.className = "room-tile";
    button.classList.toggle("active", isSelected || (!builder.isBuildingMode() && room.id === builder.getCurrentRoomId()));
    button.type = "button";
    button.innerHTML = `<span>${room.name}</span><small>${new Date(room.savedAt).toLocaleDateString()}</small>`;
    button.addEventListener("click", () => {
      const loaded = builder.loadNamedRoom(room.id);
      if (loaded && roomName) roomName.value = loaded.name;
      restoreShadowMode();
      renderRoomSize();
      renderLightingControls();
      renderRoomList(builder.getSavedRooms());
      renderBuildingRoomList(builder.getSavedRooms());
      renderConnectedRooms();
      flash(`Loaded ${room.name}`);
    });
    const remove = document.createElement("button");
    remove.className = "room-delete";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      if (readOnlyMode) return;
      builder.deleteRoom(room.id);
      renderCurrentRoomName();
      renderRoomList(builder.getSavedRooms());
      renderBuildingRoomList(builder.getSavedRooms());
      renderConnectedRooms();
      builder.refreshBuildingOverview(builder.getSavedRooms());
      flash(`Deleted ${room.name}`);
    });
    row.append(button, remove);
    roomList.append(row);
  }
}

function renderBuildingRoomList(rooms: SavedRoom[]) {
  if (!buildingRoomList) return;
  buildingRoomList.innerHTML = "";
  if (!rooms.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Save rooms first, then use this as a building navigator.";
    buildingRoomList.append(empty);
    return;
  }
  for (const room of rooms) {
    if (!room?.id) continue;
    const isConnected = builder.getConnectedRoomIds().includes(room.id);
    const row = document.createElement("div");
    row.className = "room-row";
    const button = document.createElement("button");
    button.className = "room-tile";
    button.classList.toggle("active", room.id === builder.getCurrentRoomId());
    button.type = "button";
    button.innerHTML = `<span>${room.name || "Unnamed room"}</span><small>${isConnected ? "Connected | Enter" : `Not connected | ${room.items?.length ?? 0} assets`}</small>`;
    button.addEventListener("click", () => {
      if (readOnlyMode) return;
      if (builder.isBuildingMode()) {
        builder.toggleBuildingRoomSelection(room.id);
        renderBuildingRoomList(builder.getSavedRooms());
        flash(`${isSelected ? "Deselected" : "Selected"} ${room.name || "room"}`);
      } else if (isConnected) {
        enterRoom(room.id);
      } else {
        flash("Open Building Layout to connect rooms");
      }
    });
    row.append(button);
    buildingRoomList.append(row);
  }
}

function renderRoomSize() {
  const size = builder.getRoomSize();
  if (roomWidth) roomWidth.value = String(size.widthFeet);
  if (roomDepth) roomDepth.value = String(size.depthFeet);
}

function renderCurrentRoomName() {
  const current = builder.getSavedRooms().find((room) => room.id === builder.getCurrentRoomId());
  if (roomName) roomName.value = current?.name ?? "";
}

function renderLightingControls() {
  const lighting = builder.getLighting();
  if (sunAzimuth) sunAzimuth.value = String(lighting.azimuth);
  if (sunElevation) sunElevation.value = String(lighting.elevation);
  if (sunIntensity) sunIntensity.value = String(lighting.intensity);
  if (interiorLight) interiorLight.value = String(lighting.interior);
  if (roofMode) roofMode.checked = !!lighting.roof;
}

function flash(message: string) {
  if (!status) return;
  status.textContent = message;
  status.classList.add("show");
  window.setTimeout(() => status.classList.remove("show"), 1300);
}

function updatePerformanceStats() {
  const info = renderer.info.render;
  tuneRenderQuality(info.calls);
  const fpsText = String(Math.round(smoothedFps));
  const itemText = `${builder.getItemCount()}/${builder.getMaxItems()}`;
  const drawText = String(info.calls);
  const triText = info.triangles >= 1000 ? `${(info.triangles / 1000).toFixed(1)}k` : String(info.triangles);
  if (perfFps) perfFps.textContent = fpsText;
  if (perfItems) perfItems.textContent = itemText;
  if (perfDraws) perfDraws.textContent = drawText;
  if (perfTris) perfTris.textContent = triText;
  if (perfHud) perfHud.textContent = `FPS ${fpsText} | Items ${itemText} | Draws ${drawText}`;
}

function tuneRenderQuality(drawCalls: number) {
  const maxRatio = Math.min(window.devicePixelRatio, 1.5);
  if ((smoothedFps < 30 || drawCalls > 520) && currentPixelRatio > 1) {
    currentPixelRatio = Math.max(1, currentPixelRatio - 0.25);
    renderer.setPixelRatio(currentPixelRatio);
  } else if (smoothedFps > 50 && drawCalls < 360 && currentPixelRatio < maxRatio) {
    currentPixelRatio = Math.min(maxRatio, currentPixelRatio + 0.25);
    renderer.setPixelRatio(currentPixelRatio);
  }

  if ((smoothedFps < 26 || drawCalls > 760) && shadowQuality !== "low") {
    shadowQuality = "low";
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMap.needsUpdate = true;
  } else if (smoothedFps > 52 && drawCalls < 520 && shadowQuality === "low") {
    shadowQuality = "high";
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = true;
  }
}

function restoreShadowMode() {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = shadowQuality === "high" ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
  scene.traverse((object: any) => {
    if (object instanceof THREE.Mesh) object.castShadow = object.userData.canCastShadow !== false;
  });
  renderer.shadowMap.needsUpdate = true;
}

function addBenchmarkItems() {
  const kinds = [
    "taskChair",
    "monitor",
    "keyboard",
    "mouse",
    "cup",
    "smallPlant",
    "notebook",
    "bookStack",
    "dataKiosk",
    "labBench",
  ];
  let added = 0;
  const start = builder.getItemCount();
  for (let i = 0; i < 25; i += 1) {
    const column = i % 5;
    const row = Math.floor(i / 5);
    const item = builder.add(kinds[i % kinds.length] as any, {
      x: -3 + column * 0.75,
      z: -2 + row * 0.75,
    });
    if (!item) break;
    added += 1;
  }
  if (added && builder.getItemCount() === start + added) updatePerformanceStats();
  return added;
}

async function generatePromptAsset() {
  const prompt = assetPrompt?.value.trim() ?? "";
  if (!prompt) {
    flash("Type a prompt first");
    return;
  }
  flash("Thinking through the shape...");
  await new Promise((resolve) => window.setTimeout(resolve, 850));
  const generated = builder.generateFromPrompt(prompt);
  if (generated) {
    flash("Generated temporary asset. Use Make Permanent to save it.");
  } else {
    flash(`Item cap reached (${builder.getMaxItems()})`);
  }
}

async function importModelFile() {
  const file = modelImport?.files?.[0];
  if (!file) return;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["glb", "gltf", "obj", "stl"].includes(extension)) {
    flash("Use GLB, GLTF, OBJ, or STL");
    if (modelImport) modelImport.value = "";
    return;
  }
  flash("Importing 3D model...");
  const stored = await storeImportedModelFile(file);
  const imported = builder.importModelAsset(stored.modelUrl, stored.fileName, stored.modelFormat, stored.modelKey);
  if (imported) flash("Imported model. Use Make Permanent to save it.");
  else flash(`Item cap reached (${builder.getMaxItems()})`);
  if (modelImport) modelImport.value = "";
}

function encodeSharePayload(room: SavedRoom) {
  const json = JSON.stringify(room);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function readSharedRoomFromHash(): SavedRoom | null {
  const match = window.location.hash.match(/^#share=(.+)$/);
  if (!match) return null;
  try {
    const normalized = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const room = JSON.parse(new TextDecoder().decode(bytes)) as SavedRoom;
    return room?.items && room?.style ? room : null;
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

async function saveExportFile(blob: Blob, fileName: string) {
  if (exportDirectoryHandle && await ensureExportPermission()) {
    try {
      const fileHandle = await exportDirectoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      flash(`Saved ${fileName} to ${exportDirectoryHandle.name}`);
      return;
    } catch {
      flash("Folder save failed; using browser download");
    }
  }
  downloadBlob(blob, fileName);
  flash(`Downloaded ${fileName}`);
}

async function chooseExportFolder() {
  if (!window.showDirectoryPicker) {
    flash("Folder picker is not available; exports will download normally");
    return;
  }
  try {
    exportDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    await saveExportDirectoryHandle(exportDirectoryHandle);
    flash(`Export folder set to ${exportDirectoryHandle.name}`);
  } catch {
    flash("Export folder was not changed");
  }
}

async function ensureExportPermission() {
  if (!exportDirectoryHandle) return false;
  const options = { mode: "readwrite" as const };
  if (await exportDirectoryHandle.queryPermission?.(options) === "granted") return true;
  return await exportDirectoryHandle.requestPermission?.(options) === "granted";
}

async function restoreExportFolder() {
  exportDirectoryHandle = await loadExportDirectoryHandle();
  if (!exportDirectoryHandle) return;
  const permission = await exportDirectoryHandle.queryPermission?.({ mode: "readwrite" });
  if (permission === "granted") flash(`Export folder: ${exportDirectoryHandle.name}`);
}

async function openExportDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("iso-office-builder-export-settings", 1);
    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore("settings", { keyPath: "key" });
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function saveExportDirectoryHandle(handle: ExportDirectoryHandle) {
  const db = await openExportDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put({ key: "exportDirectory", handle });
    tx.addEventListener("complete", () => resolve());
    tx.addEventListener("error", () => reject(tx.error));
  });
}

async function loadExportDirectoryHandle() {
  try {
    const db = await openExportDb();
    return await new Promise<ExportDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction("settings", "readonly");
      const request = tx.objectStore("settings").get("exportDirectory");
      request.addEventListener("success", () => resolve(request.result?.handle ?? null));
      request.addEventListener("error", () => reject(request.error));
    });
  } catch {
    return null;
  }
}

function fileSafeName(name: string) {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "room";
}

async function exportOrbitClip() {
  if (!("MediaRecorder" in window) || !renderer.domElement.captureStream) {
    flash("Orbit video export is not supported in this browser");
    return;
  }
  flash("Recording orbit clip...");
  const previousOrbit = controls.autoRotate;
  const previousSpeed = controls.autoRotateSpeed;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.1;
  const stream = renderer.domElement.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  const finished = new Promise<void>((resolve) => recorder.addEventListener("stop", () => resolve(), { once: true }));
  recorder.start();
  await new Promise((resolve) => window.setTimeout(resolve, 6000));
  recorder.stop();
  await finished;
  controls.autoRotate = previousOrbit;
  controls.autoRotateSpeed = previousSpeed;
  const fileName = `${fileSafeName(roomName?.value.trim() || "room")}-orbit.webm`;
  await saveExportFile(new Blob(chunks, { type: "video/webm" }), fileName);
}
