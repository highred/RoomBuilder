import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

type Vec2 = { x: number; z: number };
type WallSide = "back" | "front" | "left" | "right";
type AssetKind =
  | "chair"
  | "stool"
  | "loungeChair"
  | "desk"
  | "lDesk"
  | "cornerDesk"
  | "dataKiosk"
  | "cmmWorkstation"
  | "standingDesk"
  | "receptionDesk"
  | "workbench"
  | "officeDesk"
  | "taskChair"
  | "wheeledChair"
  | "tallChair"
  | "armChair"
  | "recliner"
  | "kitchenChair"
  | "draftingChair"
  | "conferenceTable"
  | "credenza"
  | "rollingCart"
  | "labBench"
  | "lightedLabBench"
  | "balanceScale"
  | "analyticalBalance"
  | "ulM"
  | "cmm"
  | "surfacePlate"
  | "calibrationWeights"
  | "microscope"
  | "oscilloscope"
  | "caliperSet"
  | "toolChest"
  | "bed"
  | "nightstand"
  | "dresser"
  | "wardrobe"
  | "vanity"
  | "bedsideLamp"
  | "diningTable"
  | "diningChair"
  | "barStool"
  | "buffet"
  | "pendantLight"
  | "kitchenIsland"
  | "stove"
  | "fridge"
  | "sink"
  | "cabinetCounter"
  | "microwave"
  | "toaster"
  | "bathtub"
  | "toilet"
  | "bathroomSink"
  | "shower"
  | "mirror"
  | "towelRack"
  | "tvStand"
  | "wallTv"
  | "standTv"
  | "television"
  | "bookshelf"
  | "fireplace"
  | "mediaConsole"
  | "sectional"
  | "beanBag"
  | "monitor"
  | "laptop"
  | "tablet"
  | "keyboard"
  | "mouse"
  | "cup"
  | "pencilCup"
  | "notebook"
  | "fileTray"
  | "headphones"
  | "speaker"
  | "deskFan"
  | "paperPile"
  | "bookStack"
  | "deskLamp"
  | "floorLamp"
  | "phone"
  | "printer"
  | "trashBin"
  | "coatRack"
  | "plant"
  | "smallPlant"
  | "planterBox"
  | "sofa"
  | "ottoman"
  | "coffeeTable"
  | "sideTable"
  | "rug"
  | "shelf"
  | "wallShelf"
  | "aquariumShelf"
  | "lizardEnclosure"
  | "catSitting"
  | "catSleeping"
  | "catStretching"
  | "catLoaf"
  | "switch"
  | "thermostat"
  | "fireCanister"
  | "exitSign"
  | "safetySign"
  | "cabinet"
  | "storageCube"
  | "whiteboard"
  | "bulletinBoard"
  | "acousticPanel"
  | "wallArt"
  | "clock"
  | "projector"
  | "window"
  | "door"
  | "divider"
  | "image"
  | "importedModel"
  | "aiModel";

export type BuilderItem = {
  id: string;
  name: string;
  kind: AssetKind;
  position: Vec2;
  elevation: number;
  rotation: number;
  scale: number;
  imageData?: string;
  prompt?: string;
  generatedSeed?: number;
  tint?: string;
  modelData?: string;
  modelKey?: string;
  modelFormat?: string;
  fileName?: string;
};

export type SavedAsset = {
  id: string;
  name: string;
  kind: AssetKind;
  item?: BuilderItem;
  imageData?: string;
  prompt?: string;
  modelData?: string;
  modelKey?: string;
  modelFormat?: string;
};

export type RoomStyle = {
  id: string;
  widthFeet: number;
  depthFeet: number;
  wallA: string;
  wallB: string;
  wallC: string;
  wallD: string;
  accent: string;
  floor: string;
  trim: string;
  windowStyle: "grid" | "wide" | "tall";
  windows: Array<{ wall: WallSide; offset: number; width: number; height: number }>;
  door: { wall: WallSide; offset: number; color: string };
  lighting: { azimuth: number; elevation: number; intensity: number; interior: number; roof: boolean };
  background: string;
};

export type SavedRoom = {
  id: string;
  name: string;
  savedAt: number;
  items: BuilderItem[];
  style: RoomStyle;
};

type MonitorFeed = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: any;
  variant: "ops" | "motion" | "terminal";
  lastUpdate: number;
  phase: number;
};

const STORAGE_SCENE = "iso-office-builder-scene-v3";
const STORAGE_ASSETS = "iso-office-builder-assets-v1";
const STORAGE_ROOMS = "iso-office-builder-rooms-v1";
const GRID = 0.5;
const FINE_GRID = 0.05;
const HEIGHT_GRID = 0.1;
const FEET_TO_UNITS = 0.5;
const DEFAULT_WIDTH_FEET = 20;
const DEFAULT_DEPTH_FEET = 15;
const MAX_PLACEABLE_ITEMS = 250;

const stackableKinds = new Set<AssetKind>([
  "monitor",
  "laptop",
  "keyboard",
  "mouse",
  "cup",
  "pencilCup",
  "notebook",
  "fileTray",
  "headphones",
  "speaker",
  "deskFan",
  "paperPile",
  "bookStack",
  "deskLamp",
  "phone",
  "tablet",
  "printer",
  "microwave",
  "toaster",
  "balanceScale",
  "analyticalBalance",
  "calibrationWeights",
  "microscope",
  "oscilloscope",
  "caliperSet",
  "plant",
  "smallPlant",
  "catSitting",
  "catSleeping",
  "catStretching",
  "catLoaf",
  "fireCanister",
  "wallArt",
  "clock",
  "aiModel",
]);

const wallMountedKinds = new Set<AssetKind>([
  "window",
  "door",
  "whiteboard",
  "wallArt",
  "clock",
  "bulletinBoard",
  "acousticPanel",
  "projector",
  "mirror",
  "towelRack",
  "wallTv",
  "wallShelf",
  "switch",
  "thermostat",
  "fireCanister",
  "exitSign",
  "safetySign",
]);

const shellObjectKinds = new Set<AssetKind>(["window", "door"]);

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: "#e4d6b6", roughness: 0.68 }),
  floorDark: new THREE.MeshStandardMaterial({ color: "#283229", roughness: 0.72 }),
  white: new THREE.MeshStandardMaterial({ color: "#f5f2e9", roughness: 0.48 }),
  wood: new THREE.MeshStandardMaterial({ color: "#c89558", roughness: 0.52 }),
  paleWood: new THREE.MeshStandardMaterial({ color: "#dcb878", roughness: 0.5 }),
  darkWood: new THREE.MeshStandardMaterial({ color: "#51301d", roughness: 0.56 }),
  black: new THREE.MeshStandardMaterial({ color: "#171817", roughness: 0.5, metalness: 0.1 }),
  metal: new THREE.MeshStandardMaterial({ color: "#696b66", roughness: 0.26, metalness: 0.75 }),
  leaf: new THREE.MeshStandardMaterial({ color: "#73ad42", roughness: 0.54, side: THREE.DoubleSide }),
  paper: new THREE.MeshStandardMaterial({ color: "#f7f4ea", roughness: 0.66 }),
  orange: new THREE.MeshStandardMaterial({ color: "#d8873d", roughness: 0.5 }),
  blue: new THREE.MeshStandardMaterial({ color: "#446b7d", roughness: 0.48 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#d9f2ff",
    roughness: 0.04,
    transparent: true,
    opacity: 0.3,
    transmission: 0.2,
  }),
};

export class RoomBuilder {
  readonly scene: any;
  private readonly items = new Map<string, BuilderItem>();
  private readonly groups = new Map<string, any>();
  private readonly feeds: MonitorFeed[] = [];
  private readonly animated: any[] = [];
  private readonly floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly selectionBox = new THREE.BoxHelper(new THREE.Group(), "#8ef0c0");
  private readonly gridHelper: any;
  private readonly wallGroups = new Map<WallSide, any>();
  private readonly wallVisibility = new Map<WallSide, number>([
    ["back", 1],
    ["left", 1],
    ["front", 0],
    ["right", 0],
  ]);
  private shellGroup = new THREE.Group();
  private sunlightGroup = new THREE.Group();
  private sunLight?: any;
  private hemiLight?: any;
  private rimLight?: any;
  private roomStyle = createRoomStyle();
  private selectedId: string | null = null;
  private currentRoomId: string | null = null;
  private assetLibrary: SavedAsset[] = [];
  private undoStack: Array<{ items: BuilderItem[]; style: RoomStyle; currentRoomId: string | null }> = [];
  onSelectionChange?: (item: BuilderItem | null) => void;
  onAssetLibraryChange?: (assets: SavedAsset[]) => void;

  constructor(scene: any) {
    this.scene = scene;
    this.selectionBox.visible = false;
    this.selectionBox.material.depthTest = false;
    this.selectionBox.renderOrder = 10;
    this.gridHelper = new THREE.GridHelper(10, 20, "#7fa07a", "#7fa07a");
    this.gridHelper.position.y = 0.018;
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.18;

    this.addLighting();
    this.addRoomShell();
    this.scene.add(this.gridHelper, this.selectionBox);
    this.assetLibrary = loadAssets();
    this.loadScene();
  }

  get selectedItem() {
    return this.selectedId ? this.items.get(this.selectedId) ?? null : null;
  }

  getAssets() {
    return [...this.assetLibrary];
  }

  getSavedRooms() {
    return loadRooms();
  }

  deleteRoom(id: string) {
    const rooms = loadRooms().filter((room) => room.id !== id);
    saveRooms(rooms);
    if (this.currentRoomId === id) {
      this.currentRoomId = null;
      this.persist();
    }
    return rooms;
  }

  getCurrentRoomId() {
    return this.currentRoomId;
  }

  getRoomSize() {
    return {
      widthFeet: this.roomStyle.widthFeet,
      depthFeet: this.roomStyle.depthFeet,
    };
  }

  getLighting() {
    return structuredClone(this.roomStyle.lighting);
  }

  setLighting(next: Partial<RoomStyle["lighting"]>) {
    this.roomStyle.lighting = normalizeLighting({ ...this.roomStyle.lighting, ...next });
    this.updateLighting();
    this.persist();
    return this.getLighting();
  }

  getItemCount() {
    return [...this.items.values()].filter((item) => !shellObjectKinds.has(item.kind)).length;
  }

  getMaxItems() {
    return MAX_PLACEABLE_ITEMS;
  }

  exportRoom(name = "Shared room"): SavedRoom {
    return {
      id: this.currentRoomId ?? crypto.randomUUID(),
      name: name.trim() || "Shared room",
      savedAt: Date.now(),
      items: [...this.items.values()].map((item) => serializeItem(item)),
      style: structuredClone(this.roomStyle),
    };
  }

  loadRoomData(room: SavedRoom) {
    this.pushUndo();
    this.clearRoomContents();
    this.roomStyle = normalizeRoomStyle(room.style);
    this.currentRoomId = room.id ?? null;
    this.rebuildRoomShell();
    for (const item of room.items ?? []) this.putItem(item);
    this.persist();
    return room;
  }

  getDraggableObjects() {
    return [...this.groups.values()].filter((group) => group.visible && group.userData.pickable !== false);
  }

  add(kind: AssetKind, position = { x: 0, z: 0 }, imageData?: string, name?: string) {
    if (!shellObjectKinds.has(kind) && !this.canAddItem()) return null;
    this.pushUndo();
    const startPosition = wallMountedKinds.has(kind) ? { x: -2.5, z: -3.72 } : position;
    const item: BuilderItem = {
      id: crypto.randomUUID(),
      name: name ?? defaultName(kind),
      kind,
      position: snapForKind(kind, startPosition),
      elevation: 0,
      rotation: 0,
      scale: 1,
      imageData,
    };
    this.applyWallSnap(item);
    item.elevation = this.resolveElevation(item, item.position);
    this.putItem(item);
    this.select(item.id);
    this.persist();
    return item;
  }

  generateFromPrompt(prompt: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return null;
    if (!this.canAddItem()) return null;
    this.pushUndo();
    const item: BuilderItem = {
      id: crypto.randomUUID(),
      name: titleFromPrompt(cleanPrompt),
      kind: "aiModel",
      position: { x: 0.25, z: -0.25 },
      elevation: 0,
      rotation: 0,
      scale: 1,
      prompt: cleanPrompt,
      generatedSeed: Date.now() + Math.floor(Math.random() * 100000),
      tint: colorFromPrompt(cleanPrompt),
    };
    item.elevation = this.resolveElevation(item, item.position);
    this.putItem(item);
    this.select(item.id);
    this.persist();
    return item;
  }

  addFromAsset(assetId: string) {
    const asset = this.assetLibrary.find((entry) => entry.id === assetId);
    if (!asset) return null;
    if (asset.item) {
      if (!this.canAddItem()) return null;
      this.pushUndo();
      const source = asset.item;
      const item: BuilderItem = {
        ...structuredClone(source),
        id: crypto.randomUUID(),
        position: snapForKind(source.kind, { x: source.position.x + 0.25, z: source.position.z + 0.25 }),
        elevation: source.elevation ?? 0,
        name: asset.name,
      };
      this.applyWallSnap(item);
      item.elevation = this.resolveElevation(item, item.position);
      this.putItem(item);
      this.select(item.id);
      this.persist();
      return item;
    }
    if (asset.kind === "importedModel" && (asset.modelKey || asset.modelData)) {
      return this.importModelAsset(asset.modelData ?? "", asset.name, asset.modelFormat ?? "glb", asset.modelKey);
    }
    return this.add(asset.kind, { x: 0.5, z: 0.5 }, asset.imageData, asset.name);
  }

  importModelAsset(modelData: string, fileName: string, modelFormat: string, modelKey?: string) {
    if (!this.canAddItem()) return null;
    this.pushUndo();
    const item: BuilderItem = {
      id: crypto.randomUUID(),
      name: fileName.replace(/\.[^.]+$/, "") || "Imported model",
      kind: "importedModel",
      position: { x: 0.4, z: 0.4 },
      elevation: 0,
      rotation: 0,
      scale: 1,
      modelData,
      modelKey,
      modelFormat,
      fileName,
    };
    this.putItem(item);
    this.select(item.id);
    this.persist();
    return item;
  }

  saveSelectedAsAsset() {
    const selected = this.selectedItem;
    if (!selected) return;
    const asset: SavedAsset = {
      id: crypto.randomUUID(),
      name: `${selected.name} copy`,
      kind: selected.kind,
      item: serializeItem(selected),
      imageData: selected.imageData,
      prompt: selected.prompt,
      modelKey: selected.modelKey,
      modelFormat: selected.modelFormat,
    };
    this.assetLibrary = [asset, ...this.assetLibrary].slice(0, 24);
    saveAssets(this.assetLibrary);
    this.onAssetLibraryChange?.(this.getAssets());
  }

  deleteAsset(assetId: string) {
    this.assetLibrary = this.assetLibrary.filter((asset) => asset.id !== assetId);
    saveAssets(this.assetLibrary);
    this.onAssetLibraryChange?.(this.getAssets());
  }

  renameAsset(assetId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.assetLibrary = this.assetLibrary.map((asset) => {
      if (asset.id !== assetId) return asset;
      return {
        ...asset,
        name: trimmed,
        item: asset.item ? { ...asset.item, name: trimmed } : asset.item,
      };
    });
    saveAssets(this.assetLibrary);
    this.onAssetLibraryChange?.(this.getAssets());
  }

  duplicateSelected() {
    const selected = this.selectedItem;
    if (!selected) return;
    if (!this.canAddItem()) return;
    this.pushUndo();
    const item: BuilderItem = {
      ...structuredClone(selected),
      id: crypto.randomUUID(),
      position: snapForKind(selected.kind, {
        x: selected.position.x + 0.25,
        z: selected.position.z + 0.25,
      }),
      elevation: selected.elevation ?? 0,
      name: selected.name,
    };
    this.applyWallSnap(item);
    item.elevation = this.resolveElevation(item, item.position);
    this.putItem(item);
    this.select(item.id);
    this.persist();
  }

  deleteSelected() {
    if (!this.selectedId) return;
    this.pushUndo();
    const group = this.groups.get(this.selectedId);
    if (group) this.scene.remove(group);
    this.groups.delete(this.selectedId);
    this.items.delete(this.selectedId);
    this.selectedId = null;
    this.selectionBox.visible = false;
    this.onSelectionChange?.(null);
    this.persist();
  }

  clearRoom() {
    this.pushUndo();
    this.clearRoomContents();
    this.persist();
  }

  newRoom() {
    this.pushUndo();
    this.clearRoomContents();
    this.currentRoomId = null;
    this.roomStyle = createRoomStyle(this.roomStyle.widthFeet, this.roomStyle.depthFeet);
    this.rebuildRoomShell();
    this.seedShellObjectsFromStyle(false);
    this.persist();
    return this.getRoomSize();
  }

  private clearRoomContents() {
    for (const group of this.groups.values()) this.scene.remove(group);
    this.groups.clear();
    this.items.clear();
    this.feeds.length = 0;
    this.animated.length = 0;
    this.selectedId = null;
    this.selectionBox.visible = false;
    this.onSelectionChange?.(null);
  }

  resetDemo() {
    this.pushUndo();
    this.clearRoomContents();
    for (const item of demoItems()) this.putItem(item);
    this.seedShellObjectsFromStyle(false);
    this.persist();
  }

  saveNamedRoom(name: string) {
    const trimmed = name.trim() || `Room ${new Date().toLocaleTimeString()}`;
    const rooms = loadRooms();
    const room: SavedRoom = {
      id: crypto.randomUUID(),
      name: trimmed,
      savedAt: Date.now(),
      items: [...this.items.values()].map((item) => serializeItem(item)),
      style: structuredClone(this.roomStyle),
    };
    const nextRooms = [room, ...rooms].slice(0, 24);
    saveRooms(nextRooms);
    this.currentRoomId = room.id;
    this.persist();
    return room;
  }

  saveCurrentRoom(name = "") {
    if (!this.currentRoomId) {
      return this.createSavedRoom(name);
    }
    const rooms = loadRooms();
    const current = rooms.find((entry) => entry.id === this.currentRoomId);
    const room: SavedRoom = {
      id: this.currentRoomId,
      name: name.trim() || current?.name || `Room ${new Date().toLocaleTimeString()}`,
      savedAt: Date.now(),
      items: [...this.items.values()].map((item) => serializeItem(item)),
      style: structuredClone(this.roomStyle),
    };
    saveRooms([room, ...rooms.filter((entry) => entry.id !== this.currentRoomId)].slice(0, 24));
    this.persist();
    return room;
  }

  private createSavedRoom(name: string) {
    const trimmed = name.trim() || `Room ${new Date().toLocaleTimeString()}`;
    const rooms = loadRooms();
    const room: SavedRoom = {
      id: crypto.randomUUID(),
      name: trimmed,
      savedAt: Date.now(),
      items: [...this.items.values()].map((item) => serializeItem(item)),
      style: structuredClone(this.roomStyle),
    };
    saveRooms([room, ...rooms].slice(0, 24));
    this.currentRoomId = room.id;
    this.persist();
    return room;
  }

  loadNamedRoom(id: string) {
    const room = loadRooms().find((entry) => entry.id === id);
    if (!room) return null;
    this.pushUndo();
    this.clearRoomContents();
    this.roomStyle = normalizeRoomStyle(room.style);
    this.rebuildRoomShell();
    for (const item of room.items) this.putItem(item);
    this.currentRoomId = room.id;
    this.persist();
    return room;
  }

  randomizeRoom() {
    this.pushUndo();
    this.roomStyle = createRoomStyle(this.roomStyle.widthFeet, this.roomStyle.depthFeet);
    this.removeShellObjects();
    this.rebuildRoomShell();
    this.seedShellObjectsFromStyle(false);
    this.persist();
    return this.roomStyle;
  }

  setRoomSize(widthFeet: number, depthFeet: number) {
    this.pushUndo();
    const nextWidth = Math.round(Math.min(40, Math.max(6, widthFeet)) * 10) / 10;
    const nextDepth = Math.round(Math.min(40, Math.max(6, depthFeet)) * 10) / 10;
    this.roomStyle = createRoomStyle(nextWidth, nextDepth);
    this.removeShellObjects();
    for (const item of this.items.values()) {
      item.position = this.clampToCurrentRoom(item.position);
      this.applyWallSnap(item);
      const group = this.groups.get(item.id);
      if (group) {
        group.position.x = item.position.x;
        group.position.z = item.position.z;
        group.rotation.y = item.rotation;
      }
    }
    this.rebuildRoomShell();
    this.seedShellObjectsFromStyle(false);
    this.persist();
    return this.getRoomSize();
  }

  select(id: string | null) {
    this.selectedId = id;
    const item = this.selectedItem;
    this.selectionBox.visible = !!id;
    this.refreshSelectionBox();
    this.onSelectionChange?.(item ? structuredClone(item) : null);
  }

  selectFromObject(object: any) {
    let cursor = object;
    while (cursor) {
      if (cursor.userData?.builderId) {
        this.select(cursor.userData.builderId);
        return cursor.userData.builderId as string;
      }
      cursor = cursor.parent;
    }
    this.select(null);
    return null;
  }

  beginUndoStep() {
    this.pushUndo();
  }

  undo() {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return false;
    this.restoreSnapshot(snapshot);
    return true;
  }

  moveSelected(position: Vec2) {
    const item = this.selectedItem;
    if (!item) return;
    const previous = cloneTransform(item);
    const carried = this.getCarriedItems(item);
    item.position = this.clampToCurrentRoom(snapForKind(item.kind, position));
    this.applyWallSnap(item);
    item.elevation = this.resolveElevation(item, item.position);
    const group = this.groups.get(item.id);
    if (group) {
      group.position.x = item.position.x;
      group.position.y = item.elevation;
      group.position.z = item.position.z;
    }
    this.moveCarriedItems(previous, item, carried);
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
  }

  nudgeSelected(dx: number, dz: number) {
    const item = this.selectedItem;
    if (!item) return;
    this.pushUndo();
    const previous = cloneTransform(item);
    const carried = this.getCarriedItems(item);
    item.position = this.clampToCurrentRoom(snapForKind(item.kind, {
      x: item.position.x + dx,
      z: item.position.z + dz,
    }));
    this.applyWallSnap(item);
    item.elevation = this.resolveElevation(item, item.position);
    const group = this.groups.get(item.id);
    if (group) {
      group.position.x = item.position.x;
      group.position.y = item.elevation;
      group.position.z = item.position.z;
    }
    this.moveCarriedItems(previous, item, carried);
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
    this.persist();
  }

  moveSelectedVertical(delta: number) {
    const item = this.selectedItem;
    if (!item) return;
    this.pushUndo();
    const previous = cloneTransform(item);
    const carried = this.getCarriedItems(item);
    item.elevation = Math.min(2.6, Math.max(0, snapFineHeight((item.elevation ?? 0) + delta)));
    const group = this.groups.get(item.id);
    if (group) group.position.y = item.elevation;
    this.moveCarriedItems(previous, item, carried);
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
    this.persist();
  }

  snapSelectedToSurface() {
    const item = this.selectedItem;
    if (!item) return;
    this.pushUndo();
    item.elevation = this.resolveElevation(item, item.position);
    const group = this.groups.get(item.id);
    if (group) group.position.y = item.elevation;
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
    this.persist();
  }

  rotateSelected(delta: number) {
    const item = this.selectedItem;
    if (!item) return;
    this.pushUndo();
    item.rotation += delta;
    const group = this.groups.get(item.id);
    if (group) group.rotation.y = item.rotation;
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
    this.persist();
  }

  setSelectedRotationDegrees(degrees: number) {
    const item = this.selectedItem;
    if (!item) return;
    this.pushUndo();
    item.rotation = THREE.MathUtils.degToRad(normalizeDegrees(degrees));
    const group = this.groups.get(item.id);
    if (group) group.rotation.y = item.rotation;
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
    this.persist();
  }

  snapSelectedRotationToRightAngle() {
    const item = this.selectedItem;
    if (!item) return;
    const degrees = THREE.MathUtils.radToDeg(item.rotation);
    this.setSelectedRotationDegrees(Math.round(degrees / 90) * 90);
  }

  scaleSelected(delta: number) {
    const item = this.selectedItem;
    if (!item) return;
    this.pushUndo();
    item.scale = Math.min(4, Math.max(0.45, item.scale + delta));
    const group = this.groups.get(item.id);
    if (group) group.scale.setScalar(item.scale);
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
    this.persist();
  }

  setSelectedTint(color: string) {
    const item = this.selectedItem;
    if (!item) return;
    this.pushUndo();
    item.tint = color;
    const oldGroup = this.groups.get(item.id);
    if (oldGroup) this.scene.remove(oldGroup);
    const group = createItemGroup(item, this.feeds);
    applyObjectTint(group, item.tint);
    group.position.set(item.position.x, item.elevation, item.position.z);
    group.rotation.y = item.rotation;
    group.scale.setScalar(item.scale);
    group.userData.builderId = item.id;
    group.traverse((child: any) => {
      child.userData.builderId = item.id;
      if (child instanceof THREE.Mesh) {
        child.castShadow = shouldCastShadow(item.kind);
        child.userData.canCastShadow = child.castShadow;
        child.receiveShadow = item.kind !== "window";
      }
    });
    this.groups.set(item.id, group);
    this.scene.add(group);
    this.refreshSelectionBox();
    this.onSelectionChange?.(structuredClone(item));
    this.persist();
  }

  persist() {
    const payload = JSON.stringify({
      items: [...this.items.values()].map((item) => serializeItem(item)),
      style: this.roomStyle,
      currentRoomId: this.currentRoomId,
    });
    localStorage.setItem(STORAGE_SCENE, payload);
  }

  update(time: number, cameraPosition?: any) {
    for (const feed of this.feeds) {
      if (time - feed.lastUpdate < 0.09 + feed.phase) continue;
      drawFeed(feed, time);
      feed.lastUpdate = time;
      feed.texture.needsUpdate = true;
    }
    this.animated.forEach((object, index) => {
      object.position.y += Math.sin(time * 1.2 + index) * 0.0007;
      object.rotation.y += Math.sin(time + index) * 0.0009;
    });
    if (cameraPosition) this.updateWallVisibility(cameraPosition);
  }

  getFloorPoint(raycaster: any) {
    const point = new THREE.Vector3();
    return raycaster.ray.intersectPlane(this.floorPlane, point) ? point : null;
  }

  private loadScene() {
    const raw = localStorage.getItem(STORAGE_SCENE);
    const saved = raw ? safeParse<BuilderItem[] | { items: BuilderItem[]; style?: RoomStyle; currentRoomId?: string | null }>(raw) : null;
    const source = Array.isArray(saved) ? saved : saved?.items;
    if (!Array.isArray(saved) && saved?.style) {
      this.roomStyle = normalizeRoomStyle(saved.style);
      this.currentRoomId = saved.currentRoomId ?? null;
      this.rebuildRoomShell();
    }
    const items = source?.length ? source : demoItems();
    for (const item of items) this.putItem(item);
    if (![...this.items.values()].some((item) => shellObjectKinds.has(item.kind))) {
      this.seedShellObjectsFromStyle(false);
    }
  }

  private putItem(item: BuilderItem) {
    const normalized = {
      ...item,
      id: item.id || crypto.randomUUID(),
      position: this.clampToCurrentRoom(snapForKind(item.kind, item.position)),
      elevation: snapHeight(item.elevation ?? 0),
      scale: item.scale || 1,
      rotation: item.rotation || 0,
    };
    this.applyWallSnap(normalized);
    const group = createItemGroup(normalized, this.feeds);
    if (normalized.tint) applyObjectTint(group, normalized.tint);
    group.position.set(normalized.position.x, normalized.elevation, normalized.position.z);
    group.rotation.y = normalized.rotation;
    group.scale.setScalar(normalized.scale);
    group.userData.builderId = normalized.id;
    group.traverse((child: any) => {
      child.userData.builderId = normalized.id;
      if (child instanceof THREE.Mesh) {
        child.castShadow = shouldCastShadow(normalized.kind);
        child.userData.canCastShadow = child.castShadow;
        child.receiveShadow = normalized.kind !== "window";
      }
    });
    this.items.set(normalized.id, normalized);
    this.groups.set(normalized.id, group);
    this.scene.add(group);
  }

  private canAddItem() {
    return this.getItemCount() < MAX_PLACEABLE_ITEMS;
  }

  private pushUndo() {
    this.undoStack.push({
      items: [...this.items.values()].map((item) => serializeItem(item)),
      style: structuredClone(this.roomStyle),
      currentRoomId: this.currentRoomId,
    });
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  private restoreSnapshot(snapshot: { items: BuilderItem[]; style: RoomStyle; currentRoomId: string | null }) {
    this.clearRoomContents();
    this.roomStyle = normalizeRoomStyle(snapshot.style);
    this.currentRoomId = snapshot.currentRoomId;
    this.rebuildRoomShell();
    for (const item of snapshot.items) this.putItem(item);
    this.persist();
  }

  private removeShellObjects() {
    for (const item of [...this.items.values()]) {
      if (!shellObjectKinds.has(item.kind)) continue;
      const group = this.groups.get(item.id);
      if (group) this.scene.remove(group);
      this.groups.delete(item.id);
      this.items.delete(item.id);
    }
  }

  private seedShellObjectsFromStyle(persist = true) {
    const metrics = roomMetrics(this.roomStyle);
    const doorItem = item(
      "door",
      "Door",
      wallPositionForSide(this.roomStyle.door.wall, this.roomStyle.door.offset, metrics).x,
      wallPositionForSide(this.roomStyle.door.wall, this.roomStyle.door.offset, metrics).z,
      0,
      this.roomStyle.door.color,
      0.95,
    );
    this.putItem(doorItem);
    for (const config of this.roomStyle.windows) {
      this.putItem(item(
        "window",
        "Window",
        wallPositionForSide(config.wall, config.offset, metrics).x,
        wallPositionForSide(config.wall, config.offset, metrics).z,
        0,
        undefined,
        1.35,
      ));
    }
    if (persist) this.persist();
  }

  private resolveElevation(item: BuilderItem, position: Vec2) {
    if (wallMountedKinds.has(item.kind)) return Math.min(2.3, Math.max(0.4, snapHeight(item.elevation || 1.15)));
    if (!stackableKinds.has(item.kind)) return snapHeight(item.elevation ?? 0);
    let best = 0;
    for (const candidate of this.items.values()) {
      if (candidate.id === item.id) continue;
      const surfaces = getSurfaces(candidate);
      for (const surface of surfaces) {
        if (pointOnSurface(position, candidate, surface)) {
          best = Math.max(best, (candidate.elevation ?? 0) + surface.y * (candidate.scale || 1));
        }
      }
    }
    const minY = getItemLocalBounds(item).minY * (item.scale || 1);
    return snapFineHeight(best - minY);
  }

  private getCarriedItems(support: BuilderItem) {
    const carried: BuilderItem[] = [];
    const surfaces = getSurfaces(support);
    if (!surfaces.length) return carried;
    for (const item of this.items.values()) {
      if (item.id === support.id || wallMountedKinds.has(item.kind)) continue;
      for (const surface of surfaces) {
        const surfaceY = (support.elevation ?? 0) + surface.y * (support.scale || 1);
        const itemBottom = (item.elevation ?? 0) + getItemLocalBounds(item).minY * (item.scale || 1);
        if (Math.abs(itemBottom - surfaceY) <= 0.08 && pointOnSurface(item.position, support, surface)) {
          carried.push(item);
          break;
        }
      }
    }
    return carried;
  }

  private moveCarriedItems(previous: BuilderItem, current: BuilderItem, carried: BuilderItem[]) {
    if (!carried.length) return;
    const dx = current.position.x - previous.position.x;
    const dz = current.position.z - previous.position.z;
    const dy = (current.elevation ?? 0) - (previous.elevation ?? 0);
    for (const item of carried) {
      item.position = this.clampToCurrentRoom(snapForKind(item.kind, {
        x: item.position.x + dx,
        z: item.position.z + dz,
      }));
      item.elevation = snapFineHeight((item.elevation ?? 0) + dy);
      const group = this.groups.get(item.id);
      if (group) {
        group.position.x = item.position.x;
        group.position.y = item.elevation;
        group.position.z = item.position.z;
      }
    }
  }

  private applyWallSnap(item: BuilderItem) {
    if (!wallMountedKinds.has(item.kind)) return;
    const metrics = roomMetrics(this.roomStyle);
    const distances: Array<{ side: WallSide; distance: number }> = [
      { side: "left", distance: Math.abs(item.position.x - metrics.leftSnapX) },
      { side: "right", distance: Math.abs(item.position.x - metrics.rightSnapX) },
      { side: "back", distance: Math.abs(item.position.z - metrics.backSnapZ) },
      { side: "front", distance: Math.abs(item.position.z - metrics.frontSnapZ) },
    ];
    const nearest = distances.sort((a, b) => a.distance - b.distance)[0].side;
    if (nearest === "left") {
      item.position.x = metrics.leftSnapX;
      item.position.z = Math.min(metrics.maxZ, Math.max(metrics.minZ, snapForKind(item.kind, item.position).z));
      item.rotation = Math.PI / 2;
    } else if (nearest === "right") {
      item.position.x = metrics.rightSnapX;
      item.position.z = Math.min(metrics.maxZ, Math.max(metrics.minZ, snapForKind(item.kind, item.position).z));
      item.rotation = -Math.PI / 2;
    } else if (nearest === "front") {
      item.position.z = metrics.frontSnapZ;
      item.position.x = Math.min(metrics.maxX, Math.max(metrics.minX, snapForKind(item.kind, item.position).x));
      item.rotation = Math.PI;
    } else {
      item.position.z = metrics.backSnapZ;
      item.position.x = Math.min(metrics.maxX, Math.max(metrics.minX, snapForKind(item.kind, item.position).x));
      item.rotation = 0;
    }
    item.elevation = item.elevation || (item.kind === "door" ? 0.95 : 1.15);
  }

  private clampToCurrentRoom(position: Vec2): Vec2 {
    const metrics = roomMetrics(this.roomStyle);
    return {
      x: Math.min(metrics.maxX, Math.max(metrics.minX, position.x)),
      z: Math.min(metrics.maxZ, Math.max(metrics.minZ, position.z)),
    };
  }

  private updateWallVisibility(cameraPosition: any) {
    const metrics = roomMetrics(this.roomStyle);
    const targets = new Map<WallSide, number>([
      ["back", cameraPosition.z > metrics.backZ ? 1 : 0],
      ["front", cameraPosition.z < metrics.frontZ ? 1 : 0],
      ["left", cameraPosition.x > metrics.leftX ? 1 : 0],
      ["right", cameraPosition.x < metrics.rightX ? 1 : 0],
    ]);
    for (const [side, group] of this.wallGroups) {
      const current = this.wallVisibility.get(side) ?? 0;
      const next = THREE.MathUtils.lerp(current, targets.get(side) ?? 0, 0.075);
      const forceInitial = group.userData.wallOpacity === undefined;
      if (!forceInitial && Math.abs(next - current) < 0.002) continue;
      this.wallVisibility.set(side, next);
      group.userData.wallOpacity = next;
      group.position.y = THREE.MathUtils.lerp(-3.1, 0, next);
      group.visible = next > 0.025;
      setObjectOpacity(group, next);
    }
    for (const item of this.items.values()) {
      if (!wallMountedKinds.has(item.kind)) continue;
      const side = wallSideForItem(item, metrics);
      const opacity = this.wallVisibility.get(side) ?? 0;
      const group = this.groups.get(item.id);
      if (!group) continue;
      if (Math.abs((group.userData.wallOpacity ?? -1) - opacity) < 0.002) continue;
      group.userData.wallOpacity = opacity;
      group.visible = opacity > 0.025;
      group.userData.pickable = opacity > 0.35;
      setObjectOpacity(group, opacity);
    }
  }

  private refreshSelectionBox() {
    if (!this.selectedId) return;
    const group = this.groups.get(this.selectedId);
    if (!group) return;
    this.selectionBox.setFromObject(group);
    this.selectionBox.visible = true;
  }

  private addLighting() {
    this.hemiLight = new THREE.HemisphereLight("#fff8df", "#667063", 1.7);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight("#fff0cc", 3.3);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1536, 1536);
    this.sunLight.shadow.camera.left = -8;
    this.sunLight.shadow.camera.right = 8;
    this.sunLight.shadow.camera.top = 8;
    this.sunLight.shadow.camera.bottom = -8;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 28;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight("#b8dcff", 0.9);
    this.rimLight.position.set(-5, 4, -3);
    this.scene.add(this.rimLight);
    this.scene.add(this.sunlightGroup);
    this.updateLighting();
  }

  private addRoomShell() {
    this.scene.background = new THREE.Color(this.roomStyle.background);
    this.scene.fog = new THREE.Fog(this.roomStyle.background, 13, 36);
    this.shellGroup = new THREE.Group();
    this.scene.add(this.shellGroup);
    this.buildRoomShell(this.shellGroup, this.roomStyle);
  }

  private rebuildRoomShell() {
    this.scene.remove(this.shellGroup);
    this.sunlightGroup.clear();
    this.addRoomShell();
  }

  private buildRoomShell(target: any, style: RoomStyle) {
    const metrics = roomMetrics(style);
    this.wallGroups.clear();
    this.gridHelper.scale.set(metrics.width / 10, 1, metrics.depth / 10);

    const floor = box(metrics.width, 0.18, metrics.depth, new THREE.MeshStandardMaterial({ color: style.floor, roughness: 0.68 }));
    floor.position.y = -0.09;
    floor.receiveShadow = true;
    target.add(floor);

    const slab = box(metrics.width + 0.4, 0.08, metrics.depth + 0.4, materials.floorDark);
    slab.position.y = -0.22;
    target.add(slab);

    const leftGroup = createWallGroup(target, this.wallGroups, "left");
    const leftWall = box(0.18, 4.2, metrics.depth, wallMaterial(style.wallA));
    leftWall.position.set(metrics.leftX, 2, 0);
    leftGroup.add(leftWall);

    const backGroup = createWallGroup(target, this.wallGroups, "back");
    const backWall = box(metrics.width + 0.1, 4.2, 0.18, wallMaterial(style.wallB));
    backWall.position.set(0, 2, metrics.backZ);
    backGroup.add(backWall);

    const rightGroup = createWallGroup(target, this.wallGroups, "right");
    const rightWall = box(0.18, 4.2, metrics.depth, wallMaterial(style.wallC));
    rightWall.position.set(metrics.rightX, 2, 0);
    rightGroup.add(rightWall);

    const frontGroup = createWallGroup(target, this.wallGroups, "front");
    const frontWall = box(metrics.width + 0.1, 4.2, 0.18, wallMaterial(style.wallD));
    frontWall.position.set(0, 2, metrics.frontZ);
    frontGroup.add(frontWall);

    const accentWall = box(0.08, 3.4, 2.35, new THREE.MeshStandardMaterial({ color: style.accent, roughness: 0.64 }));
    accentWall.position.set(metrics.leftSnapX - 0.04, 1.72, style.door.wall === "left" ? metrics.maxZ - 1.2 : metrics.minZ + 1.2);
    leftGroup.add(accentWall);

    addFloorGridLines(target, style);
    this.updateSunPatches();
  }

  private updateLighting() {
    const lighting = this.roomStyle.lighting;
    if (this.sunLight) {
      const azimuth = THREE.MathUtils.degToRad(lighting.azimuth);
      const elevation = THREE.MathUtils.degToRad(lighting.elevation);
      const radius = 11;
      this.sunLight.position.set(
        Math.sin(azimuth) * Math.cos(elevation) * radius,
        Math.sin(elevation) * radius,
        Math.cos(azimuth) * Math.cos(elevation) * radius,
      );
      this.sunLight.intensity = lighting.roof ? 0 : lighting.intensity;
      this.sunLight.target.position.set(0, 0, 0);
      this.scene.add(this.sunLight.target);
    }
    if (this.hemiLight) this.hemiLight.intensity = (lighting.roof ? 0.42 : 0.75) + lighting.interior * 0.55;
    if (this.rimLight) this.rimLight.intensity = 0.35 + lighting.interior * 0.25;
    this.updateSunPatches();
  }

  private updateSunPatches() {
    if (!this.sunlightGroup) return;
    this.sunlightGroup.clear();
    const lighting = this.roomStyle.lighting;
    const metrics = roomMetrics(this.roomStyle);
    const material = new THREE.MeshBasicMaterial({
      color: "#fff1b6",
      transparent: true,
      opacity: Math.min(0.32, Math.max(0.08, lighting.intensity * 0.08)),
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const sunDir = new THREE.Vector2(
      Math.sin(THREE.MathUtils.degToRad(lighting.azimuth)),
      Math.cos(THREE.MathUtils.degToRad(lighting.azimuth)),
    );
    for (const config of this.roomStyle.windows) {
      const pos = wallPositionForSide(config.wall, config.offset, metrics);
      const inward = inwardVectorForWall(config.wall);
      const alignment = Math.max(0, inward.x * sunDir.x + inward.z * sunDir.y);
      if (alignment < 0.12) continue;
      const width = config.wall === "left" || config.wall === "right" ? config.height * 0.5 : config.width;
      const depth = 1.15 + alignment * 1.9;
      const patch = roundedBox(width, 0.012, depth, 0.02, material.clone());
      patch.position.set(
        pos.x + inward.x * (0.75 + depth * 0.25),
        0.022,
        pos.z + inward.z * (0.75 + depth * 0.25),
      );
      patch.rotation.y = wallRotation(config.wall);
      patch.userData.noCastShadow = true;
      patch.receiveShadow = false;
      patch.castShadow = false;
      this.sunlightGroup.add(patch);
      const windowLight = new THREE.SpotLight("#fff1b6", lighting.intensity * (0.22 + alignment * 0.45), 4.8, Math.PI / 4.5, 0.55, 1.4);
      windowLight.position.set(pos.x - inward.x * 0.08, 1.35, pos.z - inward.z * 0.08);
      windowLight.target.position.set(
        pos.x + inward.x * (1.1 + depth * 0.32),
        0.08,
        pos.z + inward.z * (1.1 + depth * 0.32),
      );
      windowLight.castShadow = true;
      windowLight.shadow.mapSize.set(256, 256);
      this.sunlightGroup.add(windowLight, windowLight.target);
    }
  }
}

function createWallGroup(target: any, wallGroups: Map<WallSide, any>, side: WallSide) {
  const group = new THREE.Group();
  group.userData.wallSide = side;
  wallGroups.set(side, group);
  target.add(group);
  return group;
}

function createItemGroup(item: BuilderItem, feeds: MonitorFeed[]) {
  if (item.kind === "chair") return makeChair(item);
  if (item.kind === "taskChair") return makeChair(item);
  if (item.kind === "wheeledChair") return makeWheeledChair(item);
  if (item.kind === "tallChair") return makeTallChair(item);
  if (item.kind === "armChair") return makeArmChair(item);
  if (item.kind === "recliner") return makeRecliner(item);
  if (item.kind === "kitchenChair") return makeKitchenChair(item);
  if (item.kind === "draftingChair") return makeDraftingChair(item);
  if (item.kind === "stool") return makeStool(item);
  if (item.kind === "loungeChair") return makeLoungeChair(item);
  if (item.kind === "desk") return makeDesk(item);
  if (item.kind === "lDesk") return makeLDesk(item);
  if (item.kind === "cornerDesk") return makeCornerDesk(item);
  if (item.kind === "dataKiosk") return makeDataKiosk(item);
  if (item.kind === "cmmWorkstation") return makeCmmWorkstation(item, feeds);
  if (item.kind === "officeDesk") return makeDesk(item);
  if (item.kind === "standingDesk") return makeStandingDesk(item);
  if (item.kind === "receptionDesk") return makeReceptionDesk(item);
  if (item.kind === "workbench") return makeWorkbench(item);
  if (item.kind === "conferenceTable") return makeConferenceTable(item);
  if (item.kind === "credenza") return makeCredenza(item);
  if (item.kind === "rollingCart") return makeRollingCart();
  if (item.kind === "labBench") return makeLabBench(item, false);
  if (item.kind === "lightedLabBench") return makeLabBench(item, true);
  if (item.kind === "balanceScale") return makeBalanceScale(item);
  if (item.kind === "analyticalBalance") return makeAnalyticalBalance(item);
  if (item.kind === "ulM") return makeULM(item);
  if (item.kind === "cmm") return makeCMM(item);
  if (item.kind === "surfacePlate") return makeSurfacePlate(item);
  if (item.kind === "calibrationWeights") return makeCalibrationWeights(item);
  if (item.kind === "microscope") return makeMicroscope(item);
  if (item.kind === "oscilloscope") return makeOscilloscope(item);
  if (item.kind === "caliperSet") return makeCaliperSet(item);
  if (item.kind === "toolChest") return makeToolChest(item);
  if (item.kind === "bed") return makeBed(item);
  if (item.kind === "nightstand") return makeNightstand(item);
  if (item.kind === "dresser") return makeDresser(item);
  if (item.kind === "wardrobe") return makeWardrobe(item);
  if (item.kind === "vanity") return makeVanity(item);
  if (item.kind === "bedsideLamp") return makeDeskLamp();
  if (item.kind === "diningTable") return makeDiningTable(item);
  if (item.kind === "diningChair") return makeDiningChair(item);
  if (item.kind === "barStool") return makeBarStool(item);
  if (item.kind === "buffet") return makeBuffet(item);
  if (item.kind === "pendantLight") return makePendantLight();
  if (item.kind === "kitchenIsland") return makeKitchenIsland(item);
  if (item.kind === "stove") return makeStove();
  if (item.kind === "fridge") return makeFridge(item);
  if (item.kind === "sink") return makeSink();
  if (item.kind === "cabinetCounter") return makeCabinetCounter(item);
  if (item.kind === "microwave") return makeMicrowave();
  if (item.kind === "toaster") return makeToaster();
  if (item.kind === "bathtub") return makeBathtub();
  if (item.kind === "toilet") return makeToilet();
  if (item.kind === "bathroomSink") return makeBathroomSink();
  if (item.kind === "shower") return makeShower();
  if (item.kind === "mirror") return makeMirror();
  if (item.kind === "towelRack") return makeTowelRack();
  if (item.kind === "tvStand") return makeTvStand(item);
  if (item.kind === "wallTv") return makeWallTelevision(feeds);
  if (item.kind === "standTv" || item.kind === "television") return makeStandTelevision(feeds);
  if (item.kind === "bookshelf") return makeBookshelf(item);
  if (item.kind === "fireplace") return makeFireplace();
  if (item.kind === "mediaConsole") return makeMediaConsole(item);
  if (item.kind === "sectional") return makeSectional(item);
  if (item.kind === "beanBag") return makeBeanBag(item);
  if (item.kind === "monitor") return makeMonitor(feeds);
  if (item.kind === "laptop") return makeLaptop();
  if (item.kind === "tablet") return makeTablet();
  if (item.kind === "keyboard") return makeKeyboard();
  if (item.kind === "mouse") return makeMouse();
  if (item.kind === "cup") return makeCup();
  if (item.kind === "pencilCup") return makePencilCup();
  if (item.kind === "notebook") return makeNotebook();
  if (item.kind === "fileTray") return makeFileTray();
  if (item.kind === "headphones") return makeHeadphones();
  if (item.kind === "speaker") return makeSpeaker();
  if (item.kind === "deskFan") return makeDeskFan();
  if (item.kind === "paperPile") return makePaperPile();
  if (item.kind === "bookStack") return makeBookStack();
  if (item.kind === "deskLamp") return makeDeskLamp();
  if (item.kind === "floorLamp") return makeFloorLamp();
  if (item.kind === "phone") return makePhone();
  if (item.kind === "printer") return makePrinter();
  if (item.kind === "trashBin") return makeTrashBin();
  if (item.kind === "coatRack") return makeCoatRack();
  if (item.kind === "plant") return makePlant();
  if (item.kind === "smallPlant") return makeSmallPlant();
  if (item.kind === "planterBox") return makePlanterBox();
  if (item.kind === "sofa") return makeSofa(item);
  if (item.kind === "ottoman") return makeOttoman(item);
  if (item.kind === "coffeeTable") return makeCoffeeTable();
  if (item.kind === "sideTable") return makeSideTable();
  if (item.kind === "rug") return makeRug(item);
  if (item.kind === "shelf") return makeShelf(item);
  if (item.kind === "wallShelf") return makeWallShelf(item);
  if (item.kind === "aquariumShelf") return makeAquariumShelf(item);
  if (item.kind === "lizardEnclosure") return makeLizardEnclosure(item);
  if (item.kind === "catSitting") return makeCat(item, "sitting", "#6f6258");
  if (item.kind === "catSleeping") return makeCat(item, "sleeping", "#2f2f2d");
  if (item.kind === "catStretching") return makeCat(item, "stretching", "#d8873d");
  if (item.kind === "catLoaf") return makeCat(item, "loaf", "#d8c7a8");
  if (item.kind === "switch") return makeSwitch();
  if (item.kind === "thermostat") return makeThermostat();
  if (item.kind === "fireCanister") return makeFireCanister();
  if (item.kind === "exitSign") return makeExitSign();
  if (item.kind === "safetySign") return makeSafetySign(item);
  if (item.kind === "cabinet") return makeCabinet();
  if (item.kind === "storageCube") return makeStorageCube();
  if (item.kind === "whiteboard") return makeWhiteboard();
  if (item.kind === "bulletinBoard") return makeBulletinBoard();
  if (item.kind === "acousticPanel") return makeAcousticPanel(item);
  if (item.kind === "wallArt") return makeWallArt(item);
  if (item.kind === "clock") return makeClock();
  if (item.kind === "projector") return makeProjector();
  if (item.kind === "window") return makeWindowObject();
  if (item.kind === "door") return makeDoorObject(item);
  if (item.kind === "importedModel") return makeImportedModel(item);
  if (item.kind === "divider") return makeDivider();
  return makeGeneratedImageModel(item);
}

function makeChair(item: BuilderItem) {
  const group = new THREE.Group();
  const upholstery = new THREE.MeshStandardMaterial({
    color: item.tint ?? "#232827",
    roughness: 0.38,
    metalness: 0.02,
  });
  const seat = roundedBox(0.78, 0.14, 0.72, 0.08, upholstery);
  seat.position.y = 0.54;
  const back = roundedBox(0.78, 0.92, 0.13, 0.08, upholstery);
  back.position.set(0, 1.03, 0.27);
  back.rotation.x = -0.2;
  const head = roundedBox(0.58, 0.2, 0.12, 0.06, upholstery);
  head.position.set(0, 1.55, 0.2);
  const stem = cylinder(0.045, 0.52, materials.metal);
  stem.position.y = 0.27;
  const base = cylinder(0.34, 0.035, materials.metal);
  base.position.y = 0.05;
  for (let i = 0; i < 5; i += 1) {
    const foot = box(0.42, 0.035, 0.055, materials.metal);
    foot.position.y = 0.07;
    foot.rotation.y = (Math.PI * 2 * i) / 5;
    foot.position.x = Math.sin(foot.rotation.y) * 0.18;
    foot.position.z = Math.cos(foot.rotation.y) * 0.18;
    group.add(foot);
  }
  group.add(seat, back, head, stem, base);
  return group;
}

function makeWheeledChair(item: BuilderItem) {
  const group = makeChair(item);
  group.scale.set(0.95, 0.95, 0.95);
  return group;
}

function makeTallChair(item: BuilderItem) {
  const group = makeChair(item);
  group.scale.set(0.9, 1.22, 0.9);
  return group;
}

function makeDraftingChair(item: BuilderItem) {
  const group = makeTallChair(item);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.018, 10, 36), materials.metal);
  ring.position.y = 0.44;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

function makeArmChair(item: BuilderItem) {
  const group = makeChair(item);
  const upholstery = new THREE.MeshStandardMaterial({ color: item.tint ?? "#2d3331", roughness: 0.42 });
  const leftArm = colorable(roundedBox(0.12, 0.16, 0.68, 0.05, upholstery));
  leftArm.position.set(-0.48, 0.67, 0);
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.48;
  group.add(leftArm, rightArm);
  return group;
}

function makeKitchenChair(item: BuilderItem) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: item.tint ?? "#d7b06d", roughness: 0.54 });
  const seat = colorable(roundedBox(0.54, 0.1, 0.5, 0.035, wood));
  seat.position.y = 0.46;
  const back = colorable(roundedBox(0.52, 0.56, 0.07, 0.035, wood));
  back.position.set(0, 0.79, 0.22);
  for (const x of [-0.22, 0.22]) {
    for (const z of [-0.18, 0.18]) {
      const leg = cylinder(0.022, 0.46, materials.darkWood);
      leg.position.set(x, 0.23, z);
      group.add(leg);
    }
  }
  group.add(seat, back);
  return group;
}

function makeRecliner(item: BuilderItem) {
  const group = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color: item.tint ?? "#746756", roughness: 0.62 });
  const seat = colorable(roundedBox(0.9, 0.26, 0.72, 0.1, fabric));
  seat.position.y = 0.34;
  const back = colorable(roundedBox(0.9, 0.78, 0.16, 0.1, fabric));
  back.position.set(0, 0.78, 0.32);
  back.rotation.x = -0.28;
  const footrest = colorable(roundedBox(0.82, 0.14, 0.48, 0.08, fabric));
  footrest.position.set(0, 0.24, -0.58);
  footrest.rotation.x = 0.18;
  const leftArm = colorable(roundedBox(0.14, 0.44, 0.78, 0.08, fabric));
  leftArm.position.set(-0.52, 0.45, 0);
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.52;
  group.add(seat, back, footrest, leftArm, rightArm);
  return group;
}

function makeStool(item: BuilderItem) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: item.tint ?? "#5f756e", roughness: 0.48 });
  const seat = cylinder(0.28, 0.12, material);
  seat.position.y = 0.54;
  for (const x of [-0.18, 0.18]) {
    for (const z of [-0.18, 0.18]) {
      const leg = cylinder(0.025, 0.5, materials.metal);
      leg.position.set(x, 0.27, z);
      group.add(leg);
    }
  }

  group.add(seat);
  return group;
}

function makeLoungeChair(item: BuilderItem) {
  const group = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color: item.tint ?? "#e7e2d6", roughness: 0.5 });
  const seat = roundedBox(0.88, 0.26, 0.78, 0.09, fabric);
  seat.position.y = 0.3;
  const back = roundedBox(0.88, 0.66, 0.14, 0.08, fabric);
  back.position.set(0, 0.7, 0.3);
  back.rotation.x = -0.22;
  const base = cylinder(0.36, 0.035, materials.metal);
  base.position.y = 0.05;
  group.add(seat, back, base);
  return group;
}

function makeDesk(item: BuilderItem) {
  const group = new THREE.Group();
  const top = roundedBox(2.2, 0.14, 1.15, 0.04, materials.wood);
  top.position.y = 0.88;
  group.add(top);
  for (const x of [-0.92, 0.92]) {
    const cabinet = roundedBox(0.48, 0.78, 0.95, 0.04, materials.white);
    cabinet.position.set(x, 0.42, 0);
    group.add(cabinet);
    for (let i = 0; i < 3; i += 1) {
      const handle = box(0.22, 0.025, 0.018, materials.metal);
      handle.position.set(x, 0.2 + i * 0.2, -0.49);
      group.add(handle);
    }
  }
  if (item.tint) {
    top.material = new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 });
  }
  return group;
}

function makeLDesk(item: BuilderItem) {
  const group = new THREE.Group();
  const topMaterial = new THREE.MeshStandardMaterial({ color: item.tint ?? "#c89558", roughness: 0.52 });
  const mainTop = colorable(roundedBox(2.35, 0.12, 0.88, 0.04, topMaterial));
  mainTop.position.set(0, 0.88, 0);
  const returnTop = colorable(roundedBox(0.88, 0.12, 1.65, 0.04, topMaterial));
  returnTop.position.set(-0.74, 0.88, 0.38);
  group.add(mainTop, returnTop);
  for (const [x, z] of [[-1.02, -0.34], [1.02, -0.34], [1.02, 0.34], [-1.02, 1.08], [-0.34, 1.08]]) {
    const leg = cylinder(0.035, 0.84, materials.metal);
    leg.position.set(x, 0.42, z);
    group.add(leg);
  }
  const drawer = roundedBox(0.42, 0.68, 0.54, 0.035, materials.white);
  drawer.position.set(0.82, 0.38, 0.16);
  group.add(drawer);
  return group;
}

function makeCornerDesk(item: BuilderItem) {
  const group = makeLDesk(item);
  const corner = colorable(roundedBox(0.9, 0.1, 0.9, 0.08, new THREE.MeshStandardMaterial({ color: item.tint ?? "#dcb878", roughness: 0.52 })));
  corner.position.set(-0.72, 0.91, -0.02);
  corner.rotation.y = Math.PI / 4;
  group.add(corner);
  return group;
}

function makeDataKiosk(item: BuilderItem) {
  const group = new THREE.Group();
  const body = colorable(roundedBox(0.78, 0.82, 0.52, 0.04, new THREE.MeshStandardMaterial({ color: item.tint ?? "#e8e2d5", roughness: 0.48 })));
  body.position.y = 0.41;
  const angledTop = colorable(roundedBox(0.86, 0.08, 0.54, 0.025, new THREE.MeshStandardMaterial({ color: item.tint ?? "#dcb878", roughness: 0.52 })));
  angledTop.position.set(0, 0.86, -0.02);
  angledTop.rotation.x = -0.14;
  const tray = roundedBox(0.6, 0.04, 0.18, 0.012, materials.black);
  tray.position.set(0, 0.9, -0.26);
  group.add(body, angledTop, tray);
  return group;
}

function makeCmmWorkstation(item: BuilderItem, feeds: MonitorFeed[]) {
  const group = makeDataKiosk(item);
  const monitor = makeMonitor(feeds);
  monitor.scale.set(0.62, 0.62, 0.62);
  monitor.position.set(0, 0.84, -0.08);
  monitor.rotation.x = -0.08;
  const keyboard = makeKeyboard();
  keyboard.position.set(0, 0.92, -0.31);
  group.add(monitor, keyboard);
  return group;
}

function makeStandingDesk(item: BuilderItem) {
  const group = new THREE.Group();
  const top = roundedBox(2.0, 0.12, 0.9, 0.04, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 }) : materials.paleWood);
  top.position.y = 1.12;
  group.add(top);
  for (const x of [-0.72, 0.72]) {
    const leg = roundedBox(0.08, 1.08, 0.08, 0.02, materials.metal);
    leg.position.set(x, 0.56, 0);
    group.add(leg);
  }
  const foot = roundedBox(1.8, 0.05, 0.28, 0.02, materials.metal);
  foot.position.y = 0.04;
  group.add(foot);
  return group;
}

function makeReceptionDesk(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(2.6, 0.92, 0.72, 0.06, materials.white);
  body.position.y = 0.46;
  const top = roundedBox(2.8, 0.12, 0.84, 0.04, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 }) : materials.paleWood);
  top.position.y = 0.98;
  const glow = roundedBox(2.2, 0.04, 0.04, 0.012, new THREE.MeshBasicMaterial({ color: "#fff5c8" }));
  glow.position.set(0, 0.68, -0.39);
  group.add(body, top, glow);
  return group;
}

function makeWorkbench(item: BuilderItem) {
  const group = new THREE.Group();
  const top = roundedBox(3.4, 0.16, 0.95, 0.04, materials.paleWood);
  top.position.y = 0.92;
  group.add(top);
  for (const x of [-1.45, 1.45]) {
    for (const z of [-0.35, 0.35]) {
      const leg = cylinder(0.04, 0.9, materials.metal);
      leg.position.set(x, 0.45, z);
      group.add(leg);
    }
  }
  if (item.tint) top.material = new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 });
  return group;
}

function makeConferenceTable(item: BuilderItem) {
  const group = new THREE.Group();
  const top = roundedBox(3.4, 0.14, 1.35, 0.08, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 }) : materials.wood);
  top.position.y = 0.78;
  const base = roundedBox(2.4, 0.58, 0.32, 0.04, materials.metal);
  base.position.y = 0.35;
  group.add(top, base);
  return group;
}

function makeCredenza(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(1.75, 0.72, 0.5, 0.05, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.55 }) : materials.wood);
  body.position.y = 0.36;
  group.add(body);
  for (let i = 0; i < 3; i += 1) {
    const drawer = roundedBox(0.48, 0.22, 0.025, 0.012, materials.white);
    drawer.position.set(-0.56 + i * 0.56, 0.4, -0.265);
    group.add(drawer);
  }
  return group;
}

function makeRollingCart() {
  const group = new THREE.Group();
  for (const y of [0.26, 0.58, 0.9]) {
    const tray = roundedBox(0.72, 0.06, 0.42, 0.03, materials.metal);
    tray.position.y = y;
    group.add(tray);
  }
  for (const x of [-0.33, 0.33]) {
    for (const z of [-0.18, 0.18]) {
      const post = cylinder(0.018, 0.88, materials.metal);
      post.position.set(x, 0.46, z);
      const wheel = cylinder(0.055, 0.025, materials.black);
      wheel.position.set(x, 0.04, z);
      group.add(post, wheel);
    }
  }
  return group;
}

function makeLabBench(item: BuilderItem, lighted: boolean) {
  const group = new THREE.Group();
  const topMaterial = new THREE.MeshStandardMaterial({ color: item.tint ?? "#2f3d3c", roughness: 0.42, metalness: 0.12 });
  const top = roundedBox(2.55, 0.12, 0.92, 0.035, topMaterial);
  top.position.y = 0.92;
  const frame = roundedBox(2.45, 0.78, 0.08, 0.02, materials.metal);
  frame.position.set(0, 0.5, 0.36);
  group.add(top, frame);
  for (const x of [-1.05, 1.05]) {
    for (const z of [-0.32, 0.32]) {
      const leg = cylinder(0.035, 0.9, materials.metal);
      leg.position.set(x, 0.45, z);
      group.add(leg);
    }
  }
  const backRail = roundedBox(2.55, 0.08, 0.08, 0.02, materials.metal);
  backRail.position.set(0, 1.42, -0.43);
  const uprightA = roundedBox(0.06, 0.95, 0.06, 0.02, materials.metal);
  uprightA.position.set(-1.16, 1.22, -0.43);
  const uprightB = uprightA.clone();
  uprightB.position.x = 1.16;
  group.add(backRail, uprightA, uprightB);
  if (lighted) {
    const lightBar = roundedBox(2.15, 0.055, 0.08, 0.02, new THREE.MeshBasicMaterial({ color: "#fff2bf" }));
    lightBar.position.set(0, 1.32, -0.38);
    const light = new THREE.RectAreaLight("#fff2bf", 1.4, 2.1, 0.3);
    light.position.set(0, 1.26, -0.2);
    light.rotation.x = -Math.PI / 2;
    group.add(lightBar, light);
  }
  return group;
}

function makeBalanceScale(item: BuilderItem) {
  const group = new THREE.Group();
  const base = roundedBox(0.56, 0.09, 0.42, 0.025, new THREE.MeshStandardMaterial({ color: item.tint ?? "#d8d6cc", roughness: 0.38 }));
  base.position.y = 0.05;
  const pan = cylinder(0.18, 0.025, materials.metal);
  pan.position.y = 0.16;
  const readout = roundedBox(0.34, 0.12, 0.035, 0.01, new THREE.MeshBasicMaterial({ color: "#16382f" }));
  readout.position.set(0, 0.12, -0.23);
  group.add(base, pan, readout);
  return group;
}

function makeAnalyticalBalance(item: BuilderItem) {
  const group = makeBalanceScale(item);
  const glassBox = roundedBox(0.58, 0.42, 0.48, 0.025, materials.glass);
  glassBox.position.y = 0.38;
  const frame = makeFrame(0.64, 0.5, 0.025, materials.metal);
  frame.position.y = 0.38;
  group.add(glassBox, frame);
  return group;
}

function makeULM(item: BuilderItem) {
  const group = new THREE.Group();
  const bed = roundedBox(1.75, 0.18, 0.55, 0.025, new THREE.MeshStandardMaterial({ color: item.tint ?? "#60706b", roughness: 0.45 }));
  bed.position.y = 0.22;
  const rail = roundedBox(1.62, 0.06, 0.06, 0.015, materials.metal);
  rail.position.y = 0.42;
  const carriage = roundedBox(0.22, 0.38, 0.46, 0.02, materials.white);
  carriage.position.set(0.3, 0.62, 0);
  const probe = cylinder(0.014, 0.36, materials.metal);
  probe.position.set(0.3, 0.35, 0);
  group.add(bed, rail, carriage, probe);
  return group;
}

function makeCMM(item: BuilderItem) {
  const group = new THREE.Group();
  const plate = makeSurfacePlate(item);
  const gantry = roundedBox(1.45, 0.08, 0.08, 0.02, materials.metal);
  gantry.position.y = 1.25;
  const leftPost = roundedBox(0.08, 1.18, 0.08, 0.02, materials.metal);
  leftPost.position.set(-0.68, 0.68, -0.36);
  const rightPost = leftPost.clone();
  rightPost.position.x = 0.68;
  const probe = cylinder(0.018, 0.5, materials.black);
  probe.position.set(0.08, 0.94, -0.36);
  group.add(plate, gantry, leftPost, rightPost, probe);
  return group;
}

function makeSurfacePlate(item: BuilderItem) {
  const group = new THREE.Group();
  const plate = roundedBox(1.45, 0.18, 0.9, 0.025, new THREE.MeshStandardMaterial({ color: item.tint ?? "#3f4648", roughness: 0.28, metalness: 0.18 }));
  plate.position.y = 0.82;
  const stand = roundedBox(1.2, 0.7, 0.68, 0.025, materials.metal);
  stand.position.y = 0.38;
  group.add(stand, plate);
  return group;
}

function makeCalibrationWeights(item: BuilderItem) {
  const group = new THREE.Group();
  const tray = roundedBox(0.58, 0.045, 0.36, 0.02, materials.black);
  tray.position.y = 0.03;
  group.add(tray);
  for (let i = 0; i < 5; i += 1) {
    const weight = cylinder(0.08 - i * 0.008, 0.14 + i * 0.025, new THREE.MeshStandardMaterial({ color: item.tint ?? "#b7b8af", roughness: 0.22, metalness: 0.82 }));
    weight.position.set(-0.22 + i * 0.11, 0.1 + i * 0.012, 0);
    const knob = cylinder(0.035, 0.035, materials.metal);
    knob.position.set(weight.position.x, weight.position.y + 0.09, 0);
    group.add(weight, knob);
  }
  return group;
}

function makeMicroscope(item: BuilderItem) {
  const group = new THREE.Group();
  const base = roundedBox(0.42, 0.06, 0.32, 0.025, materials.black);
  base.position.y = 0.04;
  const arm = cylinder(0.035, 0.48, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.45 }) : materials.metal);
  arm.position.set(0.04, 0.3, 0);
  arm.rotation.z = -0.22;
  const barrel = cylinder(0.045, 0.32, materials.black);
  barrel.position.set(0.14, 0.58, 0);
  barrel.rotation.z = -0.4;
  const stage = roundedBox(0.28, 0.025, 0.22, 0.01, materials.metal);
  stage.position.y = 0.26;
  group.add(base, arm, barrel, stage);
  return group;
}

function makeOscilloscope(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(0.64, 0.38, 0.42, 0.035, new THREE.MeshStandardMaterial({ color: item.tint ?? "#e8e2d5", roughness: 0.45 }));
  body.position.y = 0.2;
  const screen = roundedBox(0.32, 0.22, 0.025, 0.01, new THREE.MeshBasicMaterial({ color: "#16382f" }));
  screen.position.set(-0.1, 0.22, -0.225);
  group.add(body, screen);
  for (let i = 0; i < 4; i += 1) {
    const knob = cylinder(0.032, 0.018, materials.black);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.18 + (i % 2) * 0.11, 0.16 + Math.floor(i / 2) * 0.12, -0.24);
    group.add(knob);
  }
  return group;
}

function makeCaliperSet(item: BuilderItem) {
  const group = new THREE.Group();
  const rail = roundedBox(0.72, 0.025, 0.055, 0.006, new THREE.MeshStandardMaterial({ color: item.tint ?? "#c9cbc5", roughness: 0.26, metalness: 0.8 }));
  rail.position.y = 0.04;
  const jawA = roundedBox(0.035, 0.16, 0.035, 0.004, materials.metal);
  jawA.position.set(-0.25, 0.1, 0);
  const jawB = jawA.clone();
  jawB.position.x = 0.03;
  const display = roundedBox(0.16, 0.1, 0.035, 0.006, materials.black);
  display.position.set(-0.05, 0.08, 0);
  group.add(rail, jawA, jawB, display);
  return group;
}

function makeToolChest(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(0.82, 0.82, 0.48, 0.04, new THREE.MeshStandardMaterial({ color: item.tint ?? "#5f6f58", roughness: 0.45 }));
  body.position.y = 0.42;
  group.add(body);
  for (let i = 0; i < 4; i += 1) {
    const drawer = roundedBox(0.68, 0.11, 0.025, 0.008, materials.metal);
    drawer.position.set(0, 0.2 + i * 0.15, -0.255);
    group.add(drawer);
  }
  return group;
}

function makeBed(item: BuilderItem) {
  const group = new THREE.Group();
  const wood = item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 }) : materials.paleWood;
  const frame = roundedBox(2.15, 0.22, 3.0, 0.08, wood);
  frame.position.y = 0.18;
  const mattress = roundedBox(1.95, 0.3, 2.65, 0.11, materials.white);
  mattress.position.y = 0.42;
  const blanket = roundedBox(1.85, 0.08, 1.42, 0.08, new THREE.MeshStandardMaterial({ color: "#78938a", roughness: 0.62 }));
  blanket.position.set(0, 0.63, 0.46);
  const headboard = roundedBox(2.2, 1.05, 0.18, 0.08, wood);
  headboard.position.set(0, 0.65, -1.45);
  for (const x of [-0.48, 0.48]) {
    const pillow = roundedBox(0.72, 0.12, 0.42, 0.08, materials.paper);
    pillow.position.set(x, 0.65, -0.95);
    group.add(pillow);
  }
  group.add(frame, mattress, blanket, headboard);
  return group;
}

function makeNightstand(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(0.62, 0.62, 0.5, 0.05, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.55 }) : materials.wood);
  body.position.y = 0.31;
  group.add(body);
  for (const y of [0.23, 0.43]) {
    const drawer = roundedBox(0.48, 0.16, 0.025, 0.01, materials.white);
    drawer.position.set(0, y, -0.265);
    const pull = box(0.2, 0.018, 0.018, materials.metal);
    pull.position.set(0, y, -0.29);
    group.add(drawer, pull);
  }
  return group;
}

function makeDresser(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(1.45, 0.86, 0.56, 0.06, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.56 }) : materials.wood);
  body.position.y = 0.43;
  group.add(body);
  for (let row = 0; row < 3; row += 1) {
    for (const x of [-0.35, 0.35]) {
      const drawer = roundedBox(0.55, 0.18, 0.025, 0.012, materials.white);
      drawer.position.set(x, 0.22 + row * 0.22, -0.3);
      group.add(drawer);
    }
  }
  return group;
}

function makeWardrobe(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(1.2, 1.8, 0.58, 0.06, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.56 }) : materials.white);
  body.position.y = 0.9;
  const split = box(0.025, 1.55, 0.025, materials.metal);
  split.position.set(0, 0.92, -0.31);
  group.add(body, split);
  for (const x of [-0.24, 0.24]) {
    const pull = cylinder(0.018, 0.34, materials.metal);
    pull.position.set(x, 0.92, -0.34);
    pull.rotation.z = Math.PI / 2;
    group.add(pull);
  }
  return group;
}

function makeVanity(item: BuilderItem) {
  const group = makeDesk(item);
  const mirror = makeMirror();
  mirror.position.set(0, 0.95, -0.52);
  group.add(mirror);
  return group;
}

function makeDiningTable(item: BuilderItem) {
  const group = new THREE.Group();
  const material = item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 }) : materials.wood;
  const top = cylinder(0.82, 0.12, material);
  top.position.y = 0.76;
  const pedestal = cylinder(0.12, 0.7, materials.darkWood);
  pedestal.position.y = 0.38;
  const base = cylinder(0.46, 0.06, materials.darkWood);
  base.position.y = 0.05;
  group.add(top, pedestal, base);
  return group;
}

function makeDiningChair(item: BuilderItem) {
  const group = new THREE.Group();
  const wood = item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.52 }) : materials.paleWood;
  const seat = roundedBox(0.54, 0.12, 0.5, 0.04, wood);
  seat.position.y = 0.46;
  const back = roundedBox(0.54, 0.72, 0.08, 0.04, wood);
  back.position.set(0, 0.84, 0.22);
  for (const x of [-0.22, 0.22]) {
    for (const z of [-0.18, 0.18]) {
      const leg = cylinder(0.022, 0.45, materials.darkWood);
      leg.position.set(x, 0.22, z);
      group.add(leg);
    }
  }
  group.add(seat, back);
  return group;
}

function makeBarStool(item: BuilderItem) {
  const group = makeStool(item);
  group.scale.set(1.05, 1.35, 1.05);
  return group;
}

function makeBuffet(item: BuilderItem) {
  const group = makeCredenza(item);
  group.scale.set(1.25, 1.05, 1.05);
  return group;
}

function makePendantLight() {
  const group = new THREE.Group();
  const cord = cylinder(0.014, 1.1, materials.black);
  cord.position.y = 1.45;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.34, 30, 1, true), materials.darkWood);
  shade.position.y = 0.82;
  shade.rotation.x = Math.PI;
  const glow = new THREE.PointLight("#ffd59c", 1, 3, 1.8);
  glow.position.y = 0.72;
  glow.castShadow = true;
  glow.shadow.mapSize.set(256, 256);
  group.add(cord, shade, glow);
  return group;
}

function makeKitchenIsland(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(2.1, 0.82, 0.95, 0.06, materials.white);
  body.position.y = 0.41;
  const top = roundedBox(2.25, 0.12, 1.08, 0.04, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.5 }) : materials.paleWood);
  top.position.y = 0.88;
  group.add(body, top);
  for (let i = 0; i < 4; i += 1) {
    const drawer = roundedBox(0.42, 0.18, 0.025, 0.01, materials.wood);
    drawer.position.set(-0.72 + i * 0.48, 0.48, -0.5);
    group.add(drawer);
  }
  return group;
}

function makeStove() {
  const group = new THREE.Group();
  const body = roundedBox(0.82, 0.9, 0.72, 0.04, materials.white);
  body.position.y = 0.45;
  const cooktop = roundedBox(0.76, 0.035, 0.64, 0.02, materials.black);
  cooktop.position.y = 0.92;
  group.add(body, cooktop);
  for (const x of [-0.22, 0.22]) {
    for (const z of [-0.18, 0.18]) {
      const burner = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.01, 8, 24), materials.metal);
      burner.rotation.x = Math.PI / 2;
      burner.position.set(x, 0.945, z);
      group.add(burner);
    }
  }
  return group;
}

function makeFridge(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(0.9, 1.95, 0.72, 0.06, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.42 }) : materials.white);
  body.position.y = 0.98;
  const seam = box(0.82, 0.02, 0.025, materials.metal);
  seam.position.set(0, 1.22, -0.38);
  const handle = cylinder(0.018, 0.68, materials.metal);
  handle.position.set(0.34, 0.86, -0.4);
  group.add(body, seam, handle);
  return group;
}

function makeSink() {
  const group = makeCabinetCounter({ tint: "#f5f2e9" } as BuilderItem);
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.21, 0.08, 28), materials.metal);
  basin.scale.z = 0.72;
  basin.position.set(0, 0.96, -0.04);
  const faucet = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 8, 18, Math.PI), materials.metal);
  faucet.position.set(0, 1.1, -0.26);
  faucet.rotation.x = Math.PI / 2;
  group.add(basin, faucet);
  return group;
}

function makeCabinetCounter(item: BuilderItem) {
  const group = new THREE.Group();
  const body = roundedBox(1.55, 0.82, 0.62, 0.04, materials.white);
  body.position.y = 0.41;
  const top = roundedBox(1.65, 0.1, 0.68, 0.025, item.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.54 }) : materials.paleWood);
  top.position.y = 0.88;
  group.add(body, top);
  for (const x of [-0.38, 0.38]) {
    const door = roundedBox(0.5, 0.56, 0.025, 0.01, materials.wood);
    door.position.set(x, 0.42, -0.33);
    group.add(door);
  }
  return group;
}

function makeMicrowave() {
  const group = new THREE.Group();
  const body = roundedBox(0.58, 0.34, 0.42, 0.035, materials.black);
  body.position.y = 0.18;
  const door = roundedBox(0.34, 0.22, 0.025, 0.01, new THREE.MeshBasicMaterial({ color: "#23465a" }));
  door.position.set(-0.08, 0.18, -0.225);
  const panel = roundedBox(0.1, 0.24, 0.025, 0.01, materials.metal);
  panel.position.set(0.2, 0.18, -0.225);
  group.add(body, door, panel);
  return group;
}

function makeToaster() {
  const group = new THREE.Group();
  const body = roundedBox(0.38, 0.25, 0.28, 0.06, materials.metal);
  body.position.y = 0.14;
  for (const x of [-0.08, 0.08]) {
    const slot = roundedBox(0.1, 0.012, 0.2, 0.006, materials.black);
    slot.position.set(x, 0.27, 0);
    group.add(slot);
  }
  group.add(body);
  return group;
}

function makeBathtub() {
  const group = new THREE.Group();
  const tub = roundedBox(1.35, 0.48, 0.72, 0.12, materials.white);
  tub.position.y = 0.28;
  const basin = roundedBox(1.05, 0.12, 0.48, 0.08, new THREE.MeshStandardMaterial({ color: "#d9f2ff", roughness: 0.2 }));
  basin.position.y = 0.48;
  group.add(tub, basin);
  return group;
}

function makeToilet() {
  const group = new THREE.Group();
  const base = cylinder(0.24, 0.34, materials.white);
  base.position.y = 0.18;
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 10, 28), materials.white);
  seat.scale.z = 0.72;
  seat.rotation.x = Math.PI / 2;
  seat.position.y = 0.38;
  const tank = roundedBox(0.46, 0.42, 0.18, 0.04, materials.white);
  tank.position.set(0, 0.58, 0.28);
  group.add(base, seat, tank);
  return group;
}

function makeBathroomSink() {
  const group = new THREE.Group();
  const pedestal = cylinder(0.16, 0.54, materials.white);
  pedestal.position.y = 0.27;
  const basin = roundedBox(0.62, 0.16, 0.46, 0.08, materials.white);
  basin.position.y = 0.62;
  const faucet = cylinder(0.018, 0.2, materials.metal);
  faucet.position.set(0, 0.78, -0.15);
  faucet.rotation.x = Math.PI / 2;
  group.add(pedestal, basin, faucet);
  return group;
}

function makeShower() {
  const group = new THREE.Group();
  const base = roundedBox(0.9, 0.08, 0.9, 0.04, materials.white);
  base.position.y = 0.04;
  const paneA = roundedBox(0.04, 1.75, 0.9, 0.02, materials.glass);
  paneA.position.set(-0.45, 0.92, 0);
  const paneB = roundedBox(0.9, 1.75, 0.04, 0.02, materials.glass);
  paneB.position.set(0, 0.92, -0.45);
  const head = cylinder(0.075, 0.035, materials.metal);
  head.rotation.x = Math.PI / 2;
  head.position.set(0.28, 1.55, -0.42);
  group.add(base, paneA, paneB, head);
  return group;
}

function makeMirror() {
  const group = new THREE.Group();
  const frame = roundedBox(0.7, 0.82, 0.05, 0.04, materials.metal);
  frame.position.y = 0.52;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.7), new THREE.MeshBasicMaterial({ color: "#d9f2ff", side: THREE.DoubleSide }));
  glass.position.set(0, 0.52, 0.031);
  group.add(frame, glass);
  return group;
}

function makeTowelRack() {
  const group = new THREE.Group();
  const rail = cylinder(0.02, 0.72, materials.metal);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = 0.68;
  const towel = roundedBox(0.5, 0.54, 0.035, 0.025, new THREE.MeshStandardMaterial({ color: "#f1eadf", roughness: 0.82 }));
  towel.position.y = 0.43;
  group.add(rail, towel);
  return group;
}

function makeTvStand(item: BuilderItem) {
  const group = makeCredenza(item);
  group.scale.set(1.15, 0.78, 1.08);
  return group;
}

function makeWallTelevision(feeds: MonitorFeed[]) {
  const group = new THREE.Group();
  const mount = roundedBox(0.34, 0.26, 0.04, 0.018, materials.metal);
  mount.position.y = 0.72;
  const frame = roundedBox(1.35, 0.78, 0.055, 0.035, materials.black);
  frame.position.y = 0.72;
  const screen = makeScreen(1.18, 0.64, feeds);
  screen.position.set(0, 0.72, 0.036);
  group.add(mount, frame, screen);
  return group;
}

function makeStandTelevision(feeds: MonitorFeed[]) {
  const group = new THREE.Group();
  const frame = roundedBox(1.35, 0.78, 0.06, 0.035, materials.black);
  frame.position.y = 0.72;
  const screen = makeScreen(1.18, 0.64, feeds);
  screen.position.set(0, 0.72, 0.036);
  const stand = cylinder(0.035, 0.48, materials.metal);
  stand.position.y = 0.3;
  const foot = roundedBox(0.62, 0.04, 0.28, 0.025, materials.metal);
  foot.position.y = 0.05;
  group.add(frame, screen, stand, foot);
  return group;
}

function makeBookshelf(item: BuilderItem) {
  const group = makeShelf(item);
  group.scale.set(1.2, 1.35, 1.05);
  return group;
}

function makeFireplace() {
  const group = new THREE.Group();
  const surround = roundedBox(1.1, 0.9, 0.28, 0.04, new THREE.MeshStandardMaterial({ color: "#d8d6cc", roughness: 0.72 }));
  surround.position.y = 0.45;
  const firebox = roundedBox(0.72, 0.46, 0.08, 0.02, materials.black);
  firebox.position.set(0, 0.36, -0.15);
  group.add(surround, firebox);
  for (let i = 0; i < 3; i += 1) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 18), new THREE.MeshBasicMaterial({ color: ["#ffcc67", "#f0712b", "#ffdca0"][i] }));
    flame.position.set(-0.16 + i * 0.16, 0.34, -0.2);
    group.add(flame);
  }
  return group;
}

function makeMediaConsole(item: BuilderItem) {
  const group = makeCredenza(item);
  group.scale.set(1.45, 0.78, 1.05);
  return group;
}

function makeSectional(item: BuilderItem) {
  const group = new THREE.Group();
  const sofa = makeSofa(item);
  const chaise = makeSofa(item);
  chaise.scale.set(0.72, 1, 1.28);
  chaise.position.set(0.92, 0, -0.38);
  chaise.rotation.y = Math.PI / 2;
  group.add(sofa, chaise);
  return group;
}

function makeBeanBag(item: BuilderItem) {
  const bean = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 28, 16),
    new THREE.MeshStandardMaterial({ color: item.tint ?? "#446b7d", roughness: 0.82 }),
  );
  bean.scale.set(1.1, 0.48, 0.95);
  bean.position.y = 0.26;
  return bean;
}

function makeMonitor(feeds: MonitorFeed[]) {
  const group = new THREE.Group();
  const frame = roundedBox(0.82, 0.5, 0.055, 0.035, materials.black);
  frame.position.y = 0.5;
  const screen = makeScreen(0.72, 0.4, feeds);
  screen.position.set(0, 0.5, 0.034);
  const stand = cylinder(0.035, 0.35, materials.metal);
  stand.position.y = 0.22;
  const foot = roundedBox(0.42, 0.035, 0.25, 0.03, materials.metal);
  foot.position.y = 0.025;
  group.add(frame, screen, stand, foot);
  return group;
}

function makeLaptop() {
  const group = new THREE.Group();
  const base = roundedBox(0.62, 0.04, 0.42, 0.025, materials.black);
  base.position.y = 0.03;
  const screen = roundedBox(0.62, 0.42, 0.035, 0.025, materials.black);
  screen.position.set(0, 0.26, -0.21);
  screen.rotation.x = -0.26;
  const glow = new THREE.MeshBasicMaterial({ color: "#8ed7ff" });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.32), glow);
  panel.position.set(0, 0.27, -0.232);
  panel.rotation.x = -0.26;
  group.add(base, screen, panel);
  return group;
}

function makeTablet() {
  const group = new THREE.Group();
  const body = roundedBox(0.42, 0.025, 0.62, 0.03, materials.black);
  body.position.y = 0.025;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.52), new THREE.MeshBasicMaterial({ color: "#244f66" }));
  screen.rotation.x = -Math.PI / 2;
  screen.position.y = 0.041;
  group.add(body, screen);
  return group;
}

function makeKeyboard() {
  const group = new THREE.Group();
  const board = roundedBox(0.62, 0.035, 0.2, 0.02, materials.black);
  board.position.y = 0.025;
  group.add(board);
  for (let x = -0.24; x <= 0.24; x += 0.08) {
    for (let z = -0.06; z <= 0.06; z += 0.06) {
      const key = roundedBox(0.045, 0.012, 0.025, 0.004, materials.metal);
      key.position.set(x, 0.05, z);
      group.add(key);
    }
  }
  return group;
}

function makeMouse() {
  const mouse = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 10),
    new THREE.MeshStandardMaterial({ color: "#efede6", roughness: 0.36 }),
  );
  mouse.scale.set(0.72, 0.28, 1);
  mouse.position.y = 0.055;
  return mouse;
}

function makeCup() {
  const group = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.075, 0.18, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: "#f8f2e5", roughness: 0.38 }),
  );
  cup.position.y = 0.1;
  const coffee = cylinder(0.07, 0.012, new THREE.MeshStandardMaterial({ color: "#4a2b1a", roughness: 0.5 }));
  coffee.position.y = 0.195;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 10, 20, Math.PI), materials.white);
  handle.position.set(0.085, 0.11, 0);
  handle.rotation.y = Math.PI / 2;
  group.add(cup, coffee, handle);
  return group;
}

function makePencilCup() {
  const group = makeCup();
  for (let i = 0; i < 5; i += 1) {
    const pencil = cylinder(0.01, 0.34, new THREE.MeshStandardMaterial({ color: ["#d4b866", "#446b7d", "#7f9657"][i % 3], roughness: 0.4 }));
    pencil.position.set(Math.sin(i) * 0.04, 0.28, Math.cos(i) * 0.04);
    pencil.rotation.z = (i - 2) * 0.12;
    group.add(pencil);
  }
  return group;
}

function makeNotebook() {
  const group = new THREE.Group();
  const book = roundedBox(0.46, 0.035, 0.62, 0.025, materials.paper);
  book.position.y = 0.025;
  const band = roundedBox(0.035, 0.012, 0.58, 0.005, materials.black);
  band.position.set(-0.16, 0.05, 0);
  group.add(book, band);
  return group;
}

function makeFileTray() {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i += 1) {
    const tray = roundedBox(0.56, 0.035, 0.4, 0.018, materials.metal);
    tray.position.y = 0.04 + i * 0.1;
    const paper = roundedBox(0.48, 0.012, 0.32, 0.008, materials.paper);
    paper.position.y = 0.065 + i * 0.1;
    group.add(tray, paper);
  }
  return group;
}

function makeHeadphones() {
  const group = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 10, 32, Math.PI), materials.black);
  band.rotation.z = Math.PI;
  band.position.y = 0.22;
  const left = roundedBox(0.08, 0.16, 0.1, 0.03, materials.black);
  left.position.set(-0.2, 0.1, 0);
  const right = left.clone();
  right.position.x = 0.2;
  group.add(band, left, right);
  return group;
}

function makeSpeaker() {
  const group = new THREE.Group();
  const body = roundedBox(0.24, 0.42, 0.22, 0.04, materials.black);
  body.position.y = 0.22;
  const cone = cylinder(0.07, 0.012, materials.metal);
  cone.rotation.x = Math.PI / 2;
  cone.position.set(0, 0.25, 0.12);
  group.add(body, cone);
  return group;
}

function makeDeskFan() {
  const group = new THREE.Group();
  const base = cylinder(0.12, 0.035, materials.metal);
  base.position.y = 0.03;
  const stem = cylinder(0.025, 0.28, materials.metal);
  stem.position.y = 0.16;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 12, 36), materials.metal);
  ring.position.y = 0.34;
  ring.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i += 1) {
    const blade = roundedBox(0.17, 0.018, 0.055, 0.015, materials.blue);
    blade.position.y = 0.34;
    blade.rotation.z = (Math.PI * 2 * i) / 3;
    group.add(blade);
  }
  group.add(base, stem, ring);
  return group;
}

function makePaperPile() {
  const group = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const paper = roundedBox(0.46, 0.01, 0.32, 0.006, materials.paper);
    paper.position.y = 0.012 + i * 0.012;
    paper.rotation.y = (i - 2) * 0.025;
    group.add(paper);
  }
  return group;
}

function makeBookStack() {
  const group = new THREE.Group();
  const colors = ["#32495c", "#d4b866", "#ece7d9", "#8f6c4a"];
  colors.forEach((color, index) => {
    const book = roundedBox(0.48 - index * 0.035, 0.055, 0.32, 0.018, new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
    book.position.y = 0.035 + index * 0.06;
    book.rotation.y = (index - 1.5) * 0.06;
    group.add(book);
  });
  return group;
}

function makeDeskLamp() {
  const group = new THREE.Group();
  const base = cylinder(0.11, 0.035, materials.metal);
  base.position.y = 0.025;
  const arm = cylinder(0.02, 0.48, materials.darkWood);
  arm.position.set(0.08, 0.26, 0);
  arm.rotation.z = -0.42;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 28, 1, true), materials.darkWood);
  shade.position.set(0.2, 0.48, 0);
  shade.rotation.z = -0.42;
  const light = new THREE.PointLight("#ffc58d", 0.75, 2, 1.8);
  light.position.set(0.24, 0.43, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(256, 256);
  group.add(base, arm, shade, light);
  return group;
}

function makeFloorLamp() {
  const group = new THREE.Group();
  const base = cylinder(0.22, 0.035, materials.metal);
  base.position.y = 0.03;
  const stem = cylinder(0.035, 1.55, materials.metal);
  stem.position.y = 0.78;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 30, 1, true), materials.darkWood);
  shade.position.y = 1.62;
  const light = new THREE.PointLight("#ffc58d", 1.1, 3, 1.8);
  light.position.y = 1.48;
  light.castShadow = true;
  light.shadow.mapSize.set(256, 256);
  group.add(base, stem, shade, light);
  return group;
}

function makePhone() {
  const group = new THREE.Group();
  const body = roundedBox(0.24, 0.025, 0.46, 0.025, materials.black);
  body.position.y = 0.025;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.34), new THREE.MeshBasicMaterial({ color: "#1d4660" }));
  screen.position.set(0, 0.04, 0);
  screen.rotation.x = -Math.PI / 2;
  group.add(body, screen);
  return group;
}

function makePrinter() {
  const group = new THREE.Group();
  const body = roundedBox(0.62, 0.28, 0.42, 0.04, materials.white);
  body.position.y = 0.16;
  const lid = roundedBox(0.5, 0.035, 0.34, 0.02, materials.black);
  lid.position.y = 0.32;
  const paper = roundedBox(0.42, 0.012, 0.3, 0.01, materials.paper);
  paper.position.set(0, 0.34, 0.08);
  group.add(body, lid, paper);
  return group;
}

function makeTrashBin() {
  const bin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.18, 0.48, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: "#6d746c", roughness: 0.72, transparent: true, opacity: 0.92 }),
  );
  bin.position.y = 0.24;
  return bin;
}

function makeCoatRack() {
  const group = new THREE.Group();
  const stem = cylinder(0.035, 1.55, materials.darkWood);
  stem.position.y = 0.78;
  const base = cylinder(0.24, 0.035, materials.darkWood);
  base.position.y = 0.03;
  for (let i = 0; i < 4; i += 1) {
    const hook = cylinder(0.018, 0.42, materials.darkWood);
    hook.position.y = 1.35;
    hook.rotation.z = Math.PI / 2;
    hook.rotation.y = (Math.PI * 2 * i) / 4;
    group.add(hook);
  }
  group.add(stem, base);
  return group;
}

function makePlant() {
  const group = new THREE.Group();
  const pot = roundedBox(0.38, 0.32, 0.38, 0.05, materials.white);
  pot.position.y = 0.18;
  group.add(pot);
  for (let i = 0; i < 12; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), materials.leaf);
    leaf.scale.set(0.42, 2.2, 0.13);
    leaf.position.set(Math.sin(i * 1.7) * 0.13, 0.52 + Math.sin(i) * 0.04, Math.cos(i * 1.7) * 0.13);
    leaf.rotation.set(0.78, i * 0.8, Math.sin(i) * 0.7);
    group.add(leaf);
  }
  return group;
}

function makeSmallPlant() {
  const group = makePlant();
  group.scale.setScalar(0.58);
  return group;
}

function makePlanterBox() {
  const group = new THREE.Group();
  const boxPlanter = roundedBox(1.1, 0.32, 0.34, 0.04, new THREE.MeshStandardMaterial({ color: "#5f6f58", roughness: 0.72 }));
  boxPlanter.position.y = 0.16;
  group.add(boxPlanter);
  for (let i = 0; i < 9; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), materials.leaf);
    leaf.scale.set(0.55, 1.8, 0.14);
    leaf.position.set(-0.42 + i * 0.105, 0.44 + Math.sin(i) * 0.04, Math.sin(i * 1.7) * 0.08);
    leaf.rotation.set(0.7, i * 0.55, Math.sin(i) * 0.6);
    group.add(leaf);
  }
  return group;
}

function makeSofa(item: BuilderItem) {
  const group = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color: item.tint ?? "#d8873d", roughness: 0.5 });
  const seat = roundedBox(1.7, 0.36, 0.76, 0.09, fabric);
  seat.position.y = 0.36;
  const back = roundedBox(1.75, 0.72, 0.16, 0.08, fabric);
  back.position.set(0, 0.76, 0.36);
  const leftArm = roundedBox(0.16, 0.58, 0.75, 0.08, fabric);
  leftArm.position.set(-0.95, 0.56, 0);
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.95;
  group.add(seat, back, leftArm, rightArm);
  return group;
}

function makeOttoman(item: BuilderItem) {
  const ottoman = roundedBox(0.72, 0.34, 0.58, 0.09, new THREE.MeshStandardMaterial({ color: item.tint ?? "#d8873d", roughness: 0.54 }));
  ottoman.position.y = 0.18;
  return ottoman;
}

function makeCoffeeTable() {
  const group = new THREE.Group();
  const top = roundedBox(1.15, 0.08, 0.7, 0.04, materials.white);
  top.position.y = 0.42;
  group.add(top);
  for (const x of [-0.45, 0.45]) {
    for (const z of [-0.25, 0.25]) {
      const leg = cylinder(0.025, 0.4, materials.metal);
      leg.position.set(x, 0.2, z);
      group.add(leg);
    }
  }
  return group;
}

function makeSideTable() {
  const group = new THREE.Group();
  const top = cylinder(0.34, 0.06, materials.paleWood);
  top.position.y = 0.52;
  const stem = cylinder(0.04, 0.5, materials.metal);
  stem.position.y = 0.25;
  const base = cylinder(0.22, 0.035, materials.metal);
  base.position.y = 0.03;
  group.add(top, stem, base);
  return group;
}

function makeRug(item: BuilderItem) {
  const rug = roundedBox(2.25, 0.025, 1.35, 0.04, new THREE.MeshStandardMaterial({
    color: item.tint ?? "#78938a",
    roughness: 0.9,
  }));
  rug.position.y = 0.012;
  return rug;
}

function makeShelf(item?: BuilderItem) {
  const group = new THREE.Group();
  const shelfMaterial = item?.tint ? new THREE.MeshStandardMaterial({ color: item.tint, roughness: 0.54 }) : materials.wood;
  const frame = new THREE.MeshStandardMaterial({ color: item?.tint ?? "#f3eee3", roughness: 0.52 });
  for (const y of [0.28, 0.78, 1.28]) {
    const shelf = colorable(roundedBox(1.28, 0.08, 0.38, 0.03, shelfMaterial));
    shelf.position.y = y;
    group.add(shelf);
  }
  for (const x of [-0.62, 0.62]) {
    const side = colorable(roundedBox(0.08, 1.35, 0.4, 0.02, frame));
    side.position.set(x, 0.72, 0);
    group.add(side);
  }
  for (let i = 0; i < 8; i += 1) {
    const book = box(0.08, 0.36 + (i % 3) * 0.06, 0.24, new THREE.MeshStandardMaterial({ color: ["#32495c", "#d4b866", "#7f9657", "#ece7d9"][i % 4], roughness: 0.55 }));
    book.position.set(-0.44 + i * 0.12, 0.98, -0.02);
    group.add(book);
  }
  return group;
}

function makeWallShelf(item: BuilderItem) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: item.tint ?? "#dcb878", roughness: 0.52 });
  const shelf = colorable(roundedBox(1.15, 0.08, 0.34, 0.025, material));
  shelf.position.y = 0.24;
  const lip = roundedBox(1.12, 0.05, 0.05, 0.012, materials.darkWood);
  lip.position.set(0, 0.32, -0.16);
  for (const x of [-0.42, 0.42]) {
    const bracket = roundedBox(0.08, 0.32, 0.05, 0.01, materials.metal);
    bracket.position.set(x, 0.08, 0.08);
    bracket.rotation.x = -0.55;
    group.add(bracket);
  }
  group.add(shelf, lip);
  return group;
}

function makeAquariumShelf(item: BuilderItem) {
  const group = new THREE.Group();
  const shelfMat = new THREE.MeshStandardMaterial({ color: item.tint ?? "#51301d", roughness: 0.55 });
  const base = colorable(roundedBox(1.75, 0.52, 0.62, 0.04, shelfMat));
  base.position.y = 0.26;
  const tank = roundedBox(1.55, 0.72, 0.52, 0.035, materials.glass);
  tank.position.y = 0.92;
  const water = roundedBox(1.47, 0.4, 0.46, 0.02, new THREE.MeshPhysicalMaterial({
    color: "#75b8c8",
    roughness: 0.08,
    transparent: true,
    opacity: 0.48,
    transmission: 0.15,
  }));
  water.position.y = 0.82;
  const lid = roundedBox(1.62, 0.06, 0.56, 0.015, materials.black);
  lid.position.y = 1.3;
  group.add(base, tank, water, lid);
  for (let i = 0; i < 4; i += 1) {
    const fish = roundedBox(0.12, 0.045, 0.035, 0.01, new THREE.MeshBasicMaterial({ color: ["#f4a261", "#e76f51", "#2a9d8f", "#e9c46a"][i] }));
    fish.position.set(-0.55 + i * 0.34, 0.78 + Math.sin(i) * 0.12, -0.08 + (i % 2) * 0.16);
    group.add(fish);
  }
  return group;
}

function makeLizardEnclosure(item: BuilderItem) {
  const group = new THREE.Group();
  const base = colorable(roundedBox(1.55, 0.48, 0.58, 0.04, new THREE.MeshStandardMaterial({ color: item.tint ?? "#8f6c4a", roughness: 0.62 })));
  base.position.y = 0.24;
  const glassBox = roundedBox(1.42, 0.62, 0.52, 0.025, materials.glass);
  glassBox.position.y = 0.82;
  const sand = roundedBox(1.34, 0.08, 0.46, 0.02, new THREE.MeshStandardMaterial({ color: "#d6b677", roughness: 0.86 }));
  sand.position.y = 0.55;
  const branch = cylinder(0.025, 1.05, materials.darkWood);
  branch.position.set(0, 0.8, 0);
  branch.rotation.set(Math.PI / 2, 0, 0.6);
  const lizard = roundedBox(0.38, 0.055, 0.12, 0.03, new THREE.MeshStandardMaterial({ color: "#6f8c45", roughness: 0.66 }));
  lizard.position.set(-0.12, 0.6, -0.08);
  group.add(base, glassBox, sand, branch, lizard);
  return group;
}

function makeCat(item: BuilderItem, pose: "sitting" | "sleeping" | "stretching" | "loaf", fallback: string) {
  const group = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: item.tint ?? fallback, roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: "#211f1d", roughness: 0.72 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), fur);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), fur);
  const tail = cylinder(0.035, 0.48, fur);
  const earA = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 3), fur);
  const earB = earA.clone();
  const eyeA = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), dark);
  const eyeB = eyeA.clone();

  if (pose === "sitting") {
    body.scale.set(0.82, 1.15, 0.76);
    body.position.y = 0.26;
    head.position.set(0, 0.58, -0.04);
    tail.position.set(0.24, 0.22, 0.18);
    tail.rotation.z = -0.5;
  } else if (pose === "sleeping") {
    body.scale.set(1.35, 0.55, 0.92);
    body.position.y = 0.18;
    head.position.set(-0.28, 0.24, -0.08);
    tail.position.set(0.24, 0.18, 0.22);
    tail.rotation.z = Math.PI / 2;
  } else if (pose === "stretching") {
    body.scale.set(1.45, 0.48, 0.72);
    body.position.set(0.06, 0.22, 0);
    body.rotation.z = -0.18;
    head.position.set(-0.46, 0.2, -0.02);
    tail.position.set(0.52, 0.34, 0.08);
    tail.rotation.z = -0.95;
  } else {
    body.scale.set(1.0, 0.55, 0.82);
    body.position.y = 0.18;
    head.position.set(-0.06, 0.32, -0.18);
    tail.position.set(0.18, 0.2, 0.22);
    tail.rotation.z = Math.PI / 2;
  }

  earA.position.set(-0.07, head.position.y + 0.13, head.position.z - 0.02);
  earB.position.set(0.07, head.position.y + 0.13, head.position.z - 0.02);
  eyeA.position.set(-0.045, head.position.y + 0.02, head.position.z - 0.145);
  eyeB.position.set(0.045, head.position.y + 0.02, head.position.z - 0.145);
  group.add(body, head, tail, earA, earB, eyeA, eyeB);
  return group;
}

function makeSwitch() {
  const group = new THREE.Group();
  const plate = roundedBox(0.22, 0.34, 0.025, 0.01, materials.white);
  plate.position.y = 0.16;
  const toggle = roundedBox(0.055, 0.14, 0.02, 0.004, materials.metal);
  toggle.position.set(0, 0.17, 0.02);
  group.add(plate, toggle);
  return group;
}

function makeThermostat() {
  const group = new THREE.Group();
  const body = roundedBox(0.36, 0.25, 0.035, 0.018, materials.white);
  body.position.y = 0.2;
  const screen = roundedBox(0.2, 0.1, 0.012, 0.004, new THREE.MeshBasicMaterial({ color: "#7fb0a8" }));
  screen.position.set(0, 0.21, 0.025);
  group.add(body, screen);
  return group;
}

function makeFireCanister() {
  const group = new THREE.Group();
  const tank = cylinder(0.14, 0.52, new THREE.MeshStandardMaterial({ color: "#c94332", roughness: 0.42 }));
  tank.position.y = 0.3;
  const cap = cylinder(0.1, 0.055, materials.metal);
  cap.position.y = 0.59;
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.01, 8, 18, Math.PI), materials.black);
  hose.position.set(0.02, 0.52, 0.02);
  hose.rotation.x = Math.PI / 2;
  const label = roundedBox(0.16, 0.16, 0.01, 0.003, materials.paper);
  label.position.set(0, 0.33, -0.14);
  group.add(tank, cap, hose, label);
  return group;
}

function makeExitSign() {
  const group = new THREE.Group();
  const boxSign = roundedBox(0.62, 0.22, 0.045, 0.012, new THREE.MeshBasicMaterial({ color: "#1f7a4e" }));
  boxSign.position.y = 0.18;
  const letters = makeTextStrips("EXIT", 0.11, 0.2);
  letters.position.set(-0.22, 0.18, 0.028);
  group.add(boxSign, letters);
  return group;
}

function makeTextStrips(text: string, scale: number, height: number) {
  const group = new THREE.Group();
  [...text].forEach((letter, index) => {
    const width = letter === "I" ? 0.035 : 0.075;
    const mark = roundedBox(width, height, 0.01, 0.002, materials.white);
    mark.position.x = index * scale;
    group.add(mark);
  });
  return group;
}

function makeSafetySign(item: BuilderItem) {
  const group = new THREE.Group();
  const sign = roundedBox(0.58, 0.38, 0.035, 0.012, new THREE.MeshStandardMaterial({ color: item.tint ?? "#f4d35e", roughness: 0.6 }));
  sign.position.y = 0.22;
  const stripe = roundedBox(0.52, 0.06, 0.012, 0.004, materials.black);
  stripe.position.set(0, 0.29, 0.025);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.08);
  shape.lineTo(-0.09, -0.07);
  shape.lineTo(0.09, -0.07);
  shape.lineTo(0, 0.08);
  const icon = new THREE.Mesh(new THREE.ShapeGeometry(shape), materials.black);
  icon.position.set(0, 0.18, 0.028);
  group.add(sign, stripe, icon);
  return group;
}

function makeCabinet() {
  const group = new THREE.Group();
  const body = roundedBox(1.2, 0.92, 0.48, 0.05, materials.white);
  body.position.y = 0.46;
  group.add(body);
  for (let i = 0; i < 3; i += 1) {
    const line = box(1.06, 0.02, 0.018, materials.metal);
    line.position.set(0, 0.23 + i * 0.22, -0.25);
    group.add(line);
  }
  return group;
}

function makeStorageCube() {
  const group = new THREE.Group();
  const body = roundedBox(0.72, 0.72, 0.72, 0.05, materials.white);
  body.position.y = 0.36;
  group.add(body);
  for (const x of [-0.18, 0.18]) {
    for (const y of [0.24, 0.52]) {
      const cubby = roundedBox(0.26, 0.2, 0.025, 0.01, materials.paleWood);
      cubby.position.set(x, y, -0.37);
      group.add(cubby);
    }
  }
  return group;
}

function makeWhiteboard() {
  const group = new THREE.Group();
  const board = roundedBox(1.25, 0.8, 0.05, 0.035, materials.white);
  board.position.y = 0.85;
  const rail = roundedBox(1.28, 0.04, 0.07, 0.015, materials.metal);
  rail.position.set(0, 0.43, 0.02);
  group.add(board, rail);
  return group;
}

function makeBulletinBoard() {
  const group = new THREE.Group();
  const board = roundedBox(1.1, 0.75, 0.06, 0.025, new THREE.MeshStandardMaterial({ color: "#b89160", roughness: 0.78 }));
  board.position.y = 0.76;
  group.add(board);
  for (let i = 0; i < 5; i += 1) {
    const note = roundedBox(0.18, 0.14, 0.01, 0.004, new THREE.MeshStandardMaterial({ color: ["#f2e9a4", "#dfe9f2", "#e8d2c3"][i % 3], roughness: 0.8 }));
    note.position.set(-0.36 + i * 0.18, 0.72 + Math.sin(i) * 0.12, 0.04);
    group.add(note);
  }
  return group;
}

function makeAcousticPanel(item: BuilderItem) {
  const panel = roundedBox(0.55, 1.0, 0.08, 0.04, new THREE.MeshStandardMaterial({ color: item.tint ?? "#78938a", roughness: 0.88 }));
  panel.position.y = 0.62;
  return panel;
}

function makeWallArt(item: BuilderItem) {
  const group = new THREE.Group();
  const frame = roundedBox(0.82, 0.62, 0.06, 0.025, materials.darkWood);
  frame.position.y = 0.55;
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.48),
    new THREE.MeshBasicMaterial({ color: item.tint ?? "#d4b866", side: THREE.DoubleSide }),
  );
  art.position.set(0, 0.55, 0.034);
  group.add(frame, art);
  return group;
}

function makeClock() {
  const group = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.045, 36), materials.white);
  face.position.y = 0.34;
  face.rotation.x = Math.PI / 2;
  const handA = box(0.025, 0.012, 0.18, materials.black);
  handA.position.set(0, 0.37, 0.04);
  handA.rotation.y = 0.5;
  const handB = box(0.018, 0.012, 0.12, materials.black);
  handB.position.set(0, 0.38, 0.04);
  handB.rotation.y = -0.95;
  group.add(face, handA, handB);
  return group;
}

function makeProjector() {
  const group = new THREE.Group();
  const body = roundedBox(0.52, 0.22, 0.34, 0.04, materials.white);
  body.position.y = 0.26;
  const lens = cylinder(0.07, 0.035, materials.black);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0.26, 0.19);
  group.add(body, lens);
  return group;
}

function makeWindowObject() {
  const group = new THREE.Group();
  const pane = roundedBox(1.35, 1.05, 0.035, 0.025, new THREE.MeshBasicMaterial({ color: "#fff8df" }));
  pane.position.y = 0.72;
  const frame = makeFrame(1.48, 1.2, 0.06, new THREE.MeshStandardMaterial({ color: "#fbf6ea", roughness: 0.38 }));
  frame.position.y = 0.72;
  for (const x of [-0.32, 0.32]) {
    const rail = box(0.025, 1.12, 0.05, new THREE.MeshStandardMaterial({ color: "#fbf6ea", roughness: 0.38 }));
    rail.position.set(x, 0.72, 0.03);
    group.add(rail);
  }
  const mid = box(1.28, 0.025, 0.05, new THREE.MeshStandardMaterial({ color: "#fbf6ea", roughness: 0.38 }));
  mid.position.set(0, 0.72, 0.03);
  group.add(pane, frame, mid);
  return group;
}

function makeDoorObject(item: BuilderItem) {
  const group = new THREE.Group();
  const door = roundedBox(0.86, 1.9, 0.06, 0.025, new THREE.MeshStandardMaterial({ color: item.tint ?? "#b89160", roughness: 0.58 }));
  door.position.y = 0;
  const inset = roundedBox(0.58, 1.28, 0.025, 0.018, new THREE.MeshStandardMaterial({ color: "#d6c7aa", roughness: 0.62 }));
  inset.position.set(0, 0.04, 0.04);
  const knob = cylinder(0.035, 0.025, materials.metal);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0.28, -0.02, 0.07);
  group.add(door, inset, knob);
  return group;
}

function makeImportedModel(item: BuilderItem) {
  const group = new THREE.Group();
  const placeholder = roundedBox(0.72, 0.72, 0.72, 0.05, new THREE.MeshStandardMaterial({
    color: item.tint ?? "#78938a",
    roughness: 0.65,
    transparent: true,
    opacity: 0.45,
  }));
  placeholder.position.y = 0.36;
  group.add(placeholder);
  if (item.modelData) {
    loadImportedModel(group, placeholder, item.modelData, item.modelFormat ?? "glb", item.tint);
  } else if (item.modelKey) {
    void getModelUrl(item.modelKey).then((url) => {
      if (url) loadImportedModel(group, placeholder, url, item.modelFormat ?? "glb", item.tint);
    });
  }
  return group;
}

function loadImportedModel(group: any, placeholder: any, dataUrl: string, format: string, tint?: string) {
  const lower = format.toLowerCase();
  if (lower === "glb" || lower === "gltf") {
    const loader = new GLTFLoader();
    loader.load(dataUrl, (gltf: any) => {
      group.remove(placeholder);
      normalizeImportedObject(gltf.scene);
      if (tint) tintImportedObject(gltf.scene, tint);
      group.add(gltf.scene);
    });
    return;
  }
  if (lower === "obj") {
    new OBJLoader().load(dataUrl, (object: any) => {
      group.remove(placeholder);
      normalizeImportedObject(object);
      if (tint) tintImportedObject(object, tint);
      group.add(object);
    });
    return;
  }
  if (lower === "stl") {
    new STLLoader().load(dataUrl, (geometry: any) => {
      group.remove(placeholder);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: tint ?? "#d8d6cc", roughness: 0.52, metalness: 0.05 }));
      normalizeImportedObject(mesh);
      group.add(mesh);
    });
  }
}

function normalizeImportedObject(object: any) {
  const box3 = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box3.getSize(size);
  box3.getCenter(center);
  object.position.sub(center);
  const largest = Math.max(size.x, size.y, size.z) || 1;
  object.scale.multiplyScalar(1.2 / largest);
  const normalized = new THREE.Box3().setFromObject(object);
  object.position.y -= normalized.min.y;
  object.traverse((child: any) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.userData.canCastShadow = true;
      child.receiveShadow = true;
    }
  });
}

function tintImportedObject(object: any, color: string) {
  object.traverse((child: any) => {
    if (!(child instanceof THREE.Mesh)) return;
    const next = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.08 });
    child.material = next;
  });
}

function applyObjectTint(object: any, color: string) {
  object.traverse((child: any) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!child.userData.colorable) return;
    const materialsForChild = Array.isArray(child.material) ? child.material : [child.material];
    const nextMaterials = materialsForChild.map((material: any) => {
      if (!material || material.map || material instanceof THREE.MeshBasicMaterial) return material;
      const clone = material.clone();
      if (clone.color) clone.color.set(color);
      clone.needsUpdate = true;
      return clone;
    });
    child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
  });
}

function colorable<T extends { userData: any }>(mesh: T): T {
  mesh.userData.colorable = true;
  return mesh;
}

function makeDivider() {
  const group = new THREE.Group();
  const pane = roundedBox(1.5, 1.55, 0.045, 0.025, materials.glass);
  pane.position.y = 0.86;
  const rail = roundedBox(1.58, 0.055, 0.07, 0.02, materials.metal);
  rail.position.y = 1.66;
  const base = roundedBox(1.56, 0.055, 0.14, 0.02, materials.metal);
  base.position.y = 0.04;
  group.add(pane, rail, base);
  return group;
}

function makeGeneratedImageModel(item: BuilderItem) {
  const group = new THREE.Group();
  const prompt = item.prompt ?? item.name ?? "generated object";
  const seed = (hashPrompt(prompt) ^ (item.generatedSeed ?? 0)) >>> 0;
  const texture = item.imageData
    ? new THREE.TextureLoader().load(item.imageData)
    : makePromptTexture(prompt, item.tint ?? colorFromPrompt(prompt));
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.42,
  });

  const lower = prompt.toLowerCase();
  const accent = new THREE.MeshStandardMaterial({
    color: item.tint ?? colorFromPrompt(prompt),
    roughness: 0.46,
    metalness: lower.includes("metal") || lower.includes("chrome") ? 0.35 : 0.04,
  });

  const base = roundedBox(0.86, 0.05, 0.5, 0.025, materials.metal);
  base.position.y = 0.04;

  if (matches(lower, ["chair", "seat", "stool", "bench", "throne"])) return makeGeneratedChair(seed, accent);
  if (matches(lower, ["desk", "table", "stand", "pedestal"])) return makeGeneratedTable(seed, accent);
  if (matches(lower, ["sofa", "couch", "loveseat", "lounge"])) return makeGeneratedSofa(seed, accent);
  if (matches(lower, ["shelf", "bookshelf", "rack", "storage"])) return makeGeneratedShelf(seed, accent);
  if (matches(lower, ["cup", "mug", "vase", "bottle", "jar"])) return makeGeneratedVessel(seed, accent);
  if (matches(lower, ["keyboard", "console", "remote", "modem", "router", "speaker", "phone"])) return makeGeneratedDevice(seed, accent, material);

  if (lower.includes("lamp") || lower.includes("light")) {
    const stem = cylinder(0.035, 0.62, materials.metal);
    stem.position.y = 0.35;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.34, 28, 1, true), accent);
    shade.position.y = 0.72;
    const glow = new THREE.PointLight("#ffc58d", 0.7, 2, 1.8);
    glow.position.y = 0.62;
    glow.castShadow = true;
    glow.shadow.mapSize.set(256, 256);
    group.add(base, stem, shade, glow);
    return group;
  }

  if (lower.includes("plant") || lower.includes("tree") || lower.includes("fern") || lower.includes("moss")) {
    const pot = roundedBox(0.34, 0.28, 0.34, 0.04, accent);
    pot.position.y = 0.16;
    group.add(base, pot);
    for (let i = 0; i < 10; i += 1) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075 + (seed % 4) * 0.005, 12, 8), materials.leaf);
      leaf.scale.set(0.5, 1.7 + (seed % 3) * 0.2, 0.12);
      leaf.position.set(Math.sin(i * 1.9) * 0.13, 0.44 + Math.sin(i + seed) * 0.05, Math.cos(i * 1.9) * 0.13);
      leaf.rotation.set(0.75, i * 0.78, Math.sin(i) * 0.7);
      group.add(leaf);
    }
    return group;
  }

  if (lower.includes("screen") || lower.includes("monitor") || lower.includes("tv")) {
    const frame = roundedBox(0.82, 0.52, 0.08, 0.03, materials.black);
    frame.position.y = 0.56;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.4), material);
    panel.position.set(0, 0.56, 0.045);
    const stand = cylinder(0.03, 0.36, materials.metal);
    stand.position.y = 0.25;
    group.add(base, stand, frame, panel);
    return group;
  }

  const shapeType = seed % 3;
  const body =
    shapeType === 0
      ? roundedBox(0.58, 0.58, 0.58, 0.04, material)
      : shapeType === 1
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.62, 32), material)
        : new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.7, 32), material);
  body.position.y = 0.39;
  const detail = roundedBox(0.48, 0.08, 0.08, 0.015, accent);
  detail.position.set(0, 0.14, 0.28);
  group.add(base, body, detail);
  return group;
}

function makeGeneratedChair(seed: number, material: any) {
  const group = new THREE.Group();
  const width = 0.48 + (seed % 8) * 0.025;
  const depth = 0.44 + ((seed >> 3) % 7) * 0.025;
  const seat = roundedBox(width, 0.12, depth, 0.06, material);
  seat.position.y = 0.38;
  const back = roundedBox(width, 0.42 + ((seed >> 5) % 6) * 0.055, 0.1, 0.06, material);
  back.position.set(0, 0.68, depth * 0.42);
  const stem = cylinder(0.035, 0.34, materials.metal);
  stem.position.y = 0.18;
  const base = cylinder(0.26 + ((seed >> 2) % 4) * 0.025, 0.035, materials.metal);
  base.position.y = 0.03;
  group.add(seat, back, stem, base);
  if (seed % 2) {
    for (const x of [-width * 0.62, width * 0.62]) {
      const arm = roundedBox(0.08, 0.1, depth * 0.86, 0.03, material);
      arm.position.set(x, 0.52, 0);
      group.add(arm);
    }
  }
  return group;
}

function makeGeneratedTable(seed: number, material: any) {
  const group = new THREE.Group();
  const width = 0.7 + (seed % 9) * 0.06;
  const depth = 0.45 + ((seed >> 3) % 8) * 0.05;
  const height = 0.42 + ((seed >> 5) % 5) * 0.08;
  const top = roundedBox(width, 0.08, depth, 0.035, material);
  top.position.y = height;
  group.add(top);
  for (const x of [-width * 0.42, width * 0.42]) {
    for (const z of [-depth * 0.35, depth * 0.35]) {
      const leg = cylinder(0.025, height, materials.metal);
      leg.position.set(x, height / 2, z);
      group.add(leg);
    }
  }
  return group;
}

function makeGeneratedSofa(seed: number, material: any) {
  const group = new THREE.Group();
  const width = 1.0 + (seed % 8) * 0.08;
  const seat = roundedBox(width, 0.28, 0.58, 0.08, material);
  seat.position.y = 0.26;
  const back = roundedBox(width, 0.55, 0.12, 0.08, material);
  back.position.set(0, 0.55, 0.28);
  const left = roundedBox(0.12, 0.42, 0.58, 0.06, material);
  left.position.set(-width * 0.55, 0.42, 0);
  const right = left.clone();
  right.position.x = width * 0.55;
  group.add(seat, back, left, right);
  return group;
}

function makeGeneratedShelf(seed: number, material: any) {
  const group = new THREE.Group();
  const width = 0.9 + (seed % 5) * 0.1;
  const levels = 2 + (seed % 3);
  for (let i = 0; i < levels; i += 1) {
    const shelf = roundedBox(width, 0.06, 0.34, 0.02, material);
    shelf.position.y = 0.25 + i * 0.32;
    group.add(shelf);
  }
  for (const x of [-width / 2, width / 2]) {
    const side = roundedBox(0.055, 0.34 * levels, 0.36, 0.02, materials.white);
    side.position.set(x, 0.25 + (levels - 1) * 0.16, 0);
    group.add(side);
  }
  return group;
}

function makeGeneratedVessel(seed: number, material: any) {
  const group = new THREE.Group();
  const radius = 0.12 + (seed % 5) * 0.02;
  const height = 0.22 + ((seed >> 4) % 7) * 0.035;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, height, 28), material);
  body.position.y = height / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.88, 0.012, 10, 28), materials.white);
  rim.position.y = height;
  group.add(body, rim);
  if (seed % 2) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.01, 8, 18, Math.PI), material);
    handle.position.set(radius * 0.9, height * 0.58, 0);
    handle.rotation.y = Math.PI / 2;
    group.add(handle);
  }
  return group;
}

function makeGeneratedDevice(seed: number, material: any, screenMaterial: any) {
  const group = new THREE.Group();
  const width = 0.42 + (seed % 7) * 0.04;
  const depth = 0.25 + ((seed >> 2) % 5) * 0.035;
  const body = roundedBox(width, 0.12, depth, 0.035, material);
  body.position.y = 0.07;
  const panel = roundedBox(width * 0.72, 0.018, depth * 0.18, 0.01, screenMaterial);
  panel.position.set(0, 0.14, -depth * 0.25);
  group.add(body, panel);
  for (let i = 0; i < 2 + (seed % 4); i += 1) {
    const dot = cylinder(0.018, 0.01, materials.black);
    dot.position.set(-width * 0.28 + i * width * 0.16, 0.145, depth * 0.18);
    group.add(dot);
  }
  return group;
}

function matches(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function makeScreen(width: number, height: number, feeds: MonitorFeed[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  feeds.push({
    canvas,
    context,
    texture,
    variant: ["ops", "motion", "terminal"][feeds.length % 3] as MonitorFeed["variant"],
    lastUpdate: -1,
    phase: (feeds.length % 4) * 0.018,
  });
  return screen;
}

function drawFeed(feed: MonitorFeed, time: number) {
  const { canvas, context: ctx } = feed;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (feed.variant === "ops") {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#071915");
    gradient.addColorStop(1, "#123146");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(142,240,192,.18)";
    for (let x = 0; x < w; x += 42) drawLine(ctx, x, 0, x, h);
    for (let y = 0; y < h; y += 40) drawLine(ctx, 0, y, w, y);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#8ef0c0";
    ctx.beginPath();
    for (let x = 0; x < w; x += 10) {
      const y = h * 0.58 + Math.sin(x * 0.035 + time * 2.3) * 42 + Math.sin(x * 0.012 + time) * 24;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "700 34px sans-serif";
    ctx.fillText("LIVE OPS", 24, 48);
  }

  if (feed.variant === "motion") {
    const cx = w / 2 + Math.sin(time * 0.8) * 70;
    const cy = h / 2 + Math.cos(time * 0.65) * 40;
    const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, 360);
    gradient.addColorStop(0, "#fff3be");
    gradient.addColorStop(0.28, "#8ed7ff");
    gradient.addColorStop(0.6, "#442e7a");
    gradient.addColorStop(1, "#0a0b18");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i += 1) {
      ctx.strokeStyle = `hsla(${(time * 60 + i * 36) % 360}, 90%, 70%, .56)`;
      ctx.lineWidth = 2 + i * 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 36 + i * 24, 18 + i * 14, time * 0.4 + i, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (feed.variant === "terminal") {
    ctx.fillStyle = "#050806";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "22px monospace";
    for (let i = 0; i < 11; i += 1) {
      ctx.fillStyle = i % 3 === 0 ? "#8ef0c0" : "#d7f7e6";
      ctx.fillText(`asset.${String(i).padStart(2, "0")} ${"|".repeat(6 + Math.round((Math.sin(time + i) + 1) * 6))}`, 24, 32 + i * 25);
    }
  }
}

function addDoor(scene: any, style: RoomStyle) {
  const metrics = roomMetrics(style);
  const doorMaterial = new THREE.MeshStandardMaterial({ color: style.door.color, roughness: 0.58 });
  const door = box(0.9, 1.9, 0.06, doorMaterial);
  if (style.door.wall === "back") {
    door.position.set(clamp(style.door.offset, metrics.minX + 0.55, metrics.maxX - 0.55), 0.95, metrics.backSnapZ - 0.02);
  } else {
    door.position.set(metrics.leftSnapX - 0.04, 0.95, clamp(style.door.offset, metrics.minZ + 0.55, metrics.maxZ - 0.55));
    door.rotation.y = Math.PI / 2;
  }
  const knob = cylinder(0.035, 0.025, materials.metal);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0.28, 0.95, 0.04);
  door.add(knob);
  scene.add(door);
}

function addWindows(wallGroups: Map<WallSide, any>, style: RoomStyle) {
  const metrics = roomMetrics(style);
  const frame = new THREE.MeshStandardMaterial({ color: "#fbf6ea", roughness: 0.38 });
  const glow = new THREE.MeshBasicMaterial({ color: "#fff8df" });
  for (const config of style.windows) {
    const scene = wallGroups.get(config.wall);
    if (!scene) continue;
    const centerOffset = config.wall === "back"
      ? clamp(config.offset, metrics.minX + config.width / 2, metrics.maxX - config.width / 2)
      : clamp(config.offset, metrics.minZ + config.width / 2, metrics.maxZ - config.width / 2);
    const pane = box(config.width, config.height, 0.035, glow);
    if (config.wall === "back") {
      pane.position.set(centerOffset, 2.28, metrics.backSnapZ - 0.03);
    } else {
      pane.position.set(metrics.leftSnapX - 0.05, 2.28, centerOffset);
      pane.rotation.y = Math.PI / 2;
    }
    scene.add(pane);
    const outer = makeFrame(config.width + 0.14, config.height + 0.2, 0.06, frame);
    if (config.wall === "back") outer.position.set(centerOffset, 2.28, metrics.backSnapZ + 0.03);
    else {
      outer.position.set(metrics.leftSnapX - 0.01, 2.28, centerOffset);
      outer.rotation.y = Math.PI / 2;
    }
    scene.add(outer);
    const verticals = style.windowStyle === "wide" ? [-0.45, 0.45] : [-0.68, 0, 0.68];
    for (const railOffset of verticals) {
      const rail = box(0.03, 2.36, 0.06, frame);
      if (config.wall === "back") rail.position.set(centerOffset + railOffset, 2.28, metrics.backSnapZ + 0.07);
      else {
        rail.position.set(metrics.leftSnapX + 0.03, 2.28, centerOffset + railOffset);
        rail.rotation.y = Math.PI / 2;
      }
      scene.add(rail);
    }
    for (const railOffset of style.windowStyle === "tall" ? [-0.55, 0.05, 0.65] : [-0.4, 0.4]) {
      const rail = box(config.width - 0.04, 0.03, 0.06, frame);
      if (config.wall === "back") rail.position.set(centerOffset, 2.28 + railOffset, metrics.backSnapZ + 0.07);
      else {
        rail.position.set(metrics.leftSnapX + 0.03, 2.28 + railOffset, centerOffset);
        rail.rotation.y = Math.PI / 2;
      }
      scene.add(rail);
    }
  }
}

function addFloorGridLines(scene: any, style: RoomStyle) {
  const metrics = roomMetrics(style);
  const lineMaterial = new THREE.LineBasicMaterial({ color: "#b58a54", transparent: true, opacity: 0.22 });
  for (let z = Math.ceil(metrics.minZ / 0.5) * 0.5; z <= metrics.maxZ; z += 0.5) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(metrics.minX, 0.012, z),
      new THREE.Vector3(metrics.maxX, 0.012, z),
    ]);
    scene.add(new THREE.Line(geometry, lineMaterial));
  }
  for (let x = Math.ceil(metrics.minX / 0.5) * 0.5; x <= metrics.maxX; x += 0.5) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.013, metrics.minZ),
      new THREE.Vector3(x, 0.013, metrics.maxZ),
    ]);
    scene.add(new THREE.Line(geometry, lineMaterial));
  }
}

function demoItems(): BuilderItem[] {
  return [
    item("desk", "Executive desk", -0.25, 0.15, 0),
    item("workbench", "Team workbench", 1.9, -1.85, 0),
    item("conferenceTable", "Conference table", -2.45, 1.9, 0),
    item("chair", "Black task chair", -0.35, 1.05, Math.PI),
    item("stool", "Drafting stool", -2.95, 1.1, 0),
    item("chair", "Visitor chair", -1.55, -0.75, 0.15, "#f2efe4"),
    item("chair", "Visitor chair", 1.2, -0.75, -0.15, "#f2efe4"),
    item("monitor", "Live monitor", -0.35, -0.35, 0, undefined, 0.95),
    item("keyboard", "Keyboard", -0.45, 0.18, 0, undefined, 0.95),
    item("mouse", "Mouse", 0.25, 0.16, 0, undefined, 0.95),
    item("cup", "Coffee cup", 0.62, -0.18, 0, undefined, 0.95),
    item("notebook", "Notebook", -0.92, 0.28, -0.2, undefined, 0.95),
    item("pencilCup", "Pencil cup", 0.82, 0.26, 0, undefined, 0.95),
    item("laptop", "Open laptop", 2.05, -1.85, 0, undefined, 1.0),
    item("tablet", "Tablet", 1.52, -1.82, 0.2, undefined, 1.0),
    item("deskLamp", "Desk lamp", -1.05, -0.22, 0.2, undefined, 0.95),
    item("floorLamp", "Floor lamp", 4.0, 1.95, 0),
    item("trashBin", "Trash bin", -4.25, 2.9, 0),
    item("plant", "Round plant", -3.9, -2.65, 0),
    item("smallPlant", "Desk plant", 2.9, -1.85, 0, undefined, 1.0),
    item("shelf", "Wall shelf", -3.9, -1.35, Math.PI / 2),
    item("bookStack", "Shelf books", -3.9, -1.35, Math.PI / 2, undefined, 1.32),
    item("cabinet", "File cabinet", 3.65, -2.7, 0),
    item("sofa", "Orange lounge", 3.15, 1.6, -0.7),
    item("ottoman", "Ottoman", 3.75, 0.75, 0),
    item("coffeeTable", "Coffee table", 2.1, 1.45, -0.2),
    item("rug", "Area rug", 2.5, 1.55, -0.15),
    item("whiteboard", "Whiteboard", -2.8, -2.95, 0),
    item("clock", "Clock", -4.45, 0.2, Math.PI / 2, undefined, 1.15),
    item("wallArt", "Framed art", 2.6, -3.72, 0, "#d4b866", 1.25),
    item("divider", "Glass divider", 1.55, -1.15, Math.PI / 2),
  ];
}

function item(kind: AssetKind, name: string, x: number, z: number, rotation: number, tint?: string, elevation = 0): BuilderItem {
  return {
    id: crypto.randomUUID(),
    name,
    kind,
    position: { x, z },
    elevation,
    rotation,
    scale: 1,
    tint,
  };
}

function loadAssets(): SavedAsset[] {
  const raw = localStorage.getItem(STORAGE_ASSETS);
  const saved = raw ? safeParse<SavedAsset[]>(raw) : null;
  return saved?.length ? saved : [];
}

function saveAssets(assets: SavedAsset[]) {
  localStorage.setItem(STORAGE_ASSETS, JSON.stringify(assets.map((asset) => serializeAsset(asset))));
}

function loadRooms(): SavedRoom[] {
  const raw = localStorage.getItem(STORAGE_ROOMS);
  const rooms = raw ? safeParse<SavedRoom[]>(raw) : null;
  return rooms ?? [];
}

function saveRooms(rooms: SavedRoom[]) {
  localStorage.setItem(STORAGE_ROOMS, JSON.stringify(rooms));
}

const MODEL_DB = "iso-room-builder-models";
const MODEL_STORE = "models";

export async function storeImportedModelFile(file: File) {
  const modelKey = crypto.randomUUID();
  const format = file.name.split(".").pop()?.toLowerCase() ?? "glb";
  const buffer = await file.arrayBuffer();
  const db = await openModelDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, "readwrite");
    tx.objectStore(MODEL_STORE).put({
      key: modelKey,
      buffer,
      type: file.type,
      fileName: file.name,
      format,
    });
    tx.addEventListener("complete", () => resolve());
    tx.addEventListener("error", () => reject(tx.error));
  });
  return {
    modelKey,
    modelUrl: URL.createObjectURL(new Blob([buffer], { type: file.type || "application/octet-stream" })),
    modelFormat: format,
    fileName: file.name,
  };
}

async function getModelUrl(modelKey: string) {
  const db = await openModelDb();
  const record = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction(MODEL_STORE, "readonly");
    const request = tx.objectStore(MODEL_STORE).get(modelKey);
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
  if (!record?.buffer) return null;
  return URL.createObjectURL(new Blob([record.buffer], { type: record.type || "application/octet-stream" }));
}

function openModelDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(MODEL_DB, 1);
    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(MODEL_STORE, { keyPath: "key" });
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

function serializeItem(item: BuilderItem): BuilderItem {
  const copy = structuredClone(item);
  if (copy.kind === "importedModel") {
    delete copy.modelData;
  }
  return copy;
}

function serializeAsset(asset: SavedAsset): SavedAsset {
  const copy = structuredClone(asset);
  if (copy.item) copy.item = serializeItem(copy.item);
  if (copy.kind === "importedModel") {
    delete copy.modelData;
  }
  return copy;
}

function createRoomStyle(widthFeet = DEFAULT_WIDTH_FEET, depthFeet = DEFAULT_DEPTH_FEET): RoomStyle {
  const safeWidthFeet = Math.min(40, Math.max(6, widthFeet || DEFAULT_WIDTH_FEET));
  const safeDepthFeet = Math.min(40, Math.max(6, depthFeet || DEFAULT_DEPTH_FEET));
  const metrics = roomMetrics({ widthFeet: safeWidthFeet, depthFeet: safeDepthFeet } as RoomStyle);
  const wallPalettes = [
    ["#eeeae0", "#d8d6cc", "#b89160"],
    ["#e8edf0", "#d7e1df", "#78938a"],
    ["#f1eadf", "#ded2c3", "#446b7d"],
    ["#e9e4d4", "#d8d0bd", "#7f9657"],
    ["#ece8e0", "#d7d7d0", "#8f6c4a"],
  ];
  const floorColors = ["#e4d6b6", "#d8c9aa", "#e2d5bd", "#dbc796", "#dfd8c8", "#cfd7c4", "#d7d2c6"];
  const palette = wallPalettes[Math.floor(Math.random() * wallPalettes.length)];
  const windowStyle = pick(["grid", "wide", "tall"] as const);
  const windows: RoomStyle["windows"] = [];
  const doorWall = pick(["back", "front", "left", "right"] as const);
  const door = {
    wall: doorWall,
    offset: randomOpenOffset(doorWall, metrics, 0.9),
    color: pick(["#b89160", "#7f9657", "#446b7d", "#8f6c4a", "#d6c7aa"]),
  };
  const width = windowStyle === "wide" ? 2.4 : 1.65;
  const leftWidth = windowStyle === "wide" ? 2.2 : 1.45;
  const height = windowStyle === "tall" ? 2.65 : 2.05;
  const leftHeight = windowStyle === "tall" ? 2.55 : 1.95;
  for (const wall of ["back", "front"] as const) {
    const targetCount = Math.random() < 0.28 ? 0 : 1 + Math.floor(Math.random() * 2);
    for (const offset of shuffled(wallSlots(metrics.minX, metrics.maxX, width))) {
      if (windows.filter((window) => window.wall === wall).length >= targetCount) break;
      if (door.wall === wall && Math.abs(offset - door.offset) < (width + 1.0) / 2) continue;
      windows.push({ wall, offset: offset + (Math.random() - 0.5) * 0.18, width, height });
    }
  }
  for (const wall of ["left", "right"] as const) {
    const targetCount = Math.random() < 0.34 ? 0 : 1;
    for (const offset of shuffled(wallSlots(metrics.minZ, metrics.maxZ, leftWidth))) {
      if (windows.filter((window) => window.wall === wall).length >= targetCount) break;
      if (door.wall === wall && Math.abs(offset - door.offset) < (leftWidth + 1.0) / 2) continue;
      windows.push({ wall, offset: offset + (Math.random() - 0.5) * 0.18, width: leftWidth, height: leftHeight });
    }
  }
  if (!windows.length) {
    const fallbackWall = door.wall === "back" ? "front" : "back";
    windows.push({ wall: fallbackWall, offset: 0, width, height });
  }
  return {
    id: crypto.randomUUID(),
    widthFeet: safeWidthFeet,
    depthFeet: safeDepthFeet,
    wallA: palette[0],
    wallB: palette[1],
    wallC: pick(wallPalettes)[Math.floor(Math.random() * 2)],
    wallD: pick(wallPalettes)[Math.floor(Math.random() * 2)],
    accent: palette[2],
    floor: pick(floorColors),
    trim: "#fbf6ea",
    windowStyle,
    windows,
    door,
    lighting: normalizeLighting({
      azimuth: 25 + Math.floor(Math.random() * 120),
      elevation: 28 + Math.floor(Math.random() * 30),
      intensity: 2.8 + Math.random() * 1.2,
      interior: 1 + Math.random() * 0.7,
      roof: false,
    }),
    background: pick(["#d9d5c5", "#d8dfd7", "#d6d9df", "#dfd9ce", "#d4d6c9"]),
  };
}

function normalizeRoomStyle(style?: Partial<RoomStyle>): RoomStyle {
  const base = createRoomStyle(style?.widthFeet ?? DEFAULT_WIDTH_FEET, style?.depthFeet ?? DEFAULT_DEPTH_FEET);
  return {
    ...base,
    ...style,
    widthFeet: style?.widthFeet ?? base.widthFeet,
    depthFeet: style?.depthFeet ?? base.depthFeet,
    windows: style?.windows?.length ? style.windows : base.windows,
    door: style?.door ?? base.door,
    lighting: normalizeLighting(style?.lighting ?? base.lighting),
  };
}

function normalizeLighting(lighting?: Partial<RoomStyle["lighting"]>): RoomStyle["lighting"] {
  return {
    azimuth: Math.round(Math.min(360, Math.max(0, lighting?.azimuth ?? 38))),
    elevation: Math.round(Math.min(80, Math.max(12, lighting?.elevation ?? 42))),
    intensity: Math.round(Math.min(5, Math.max(0, lighting?.intensity ?? 3.2)) * 10) / 10,
    interior: Math.round(Math.min(3, Math.max(0, lighting?.interior ?? 1.2)) * 10) / 10,
    roof: !!lighting?.roof,
  };
}

function roomMetrics(style: Pick<RoomStyle, "widthFeet" | "depthFeet">) {
  const width = (style.widthFeet || DEFAULT_WIDTH_FEET) * FEET_TO_UNITS;
  const depth = (style.depthFeet || DEFAULT_DEPTH_FEET) * FEET_TO_UNITS;
  const margin = 0.35;
  return {
    width,
    depth,
    minX: -width / 2 + margin,
    maxX: width / 2 - margin,
    minZ: -depth / 2 + margin,
    maxZ: depth / 2 - margin,
    leftX: -width / 2 - 0.09,
    rightX: width / 2 + 0.09,
    backZ: -depth / 2 - 0.09,
    frontZ: depth / 2 + 0.09,
    leftSnapX: -width / 2 + 0.14,
    rightSnapX: width / 2 - 0.14,
    backSnapZ: -depth / 2 + 0.08,
    frontSnapZ: depth / 2 - 0.08,
  };
}

function wallSlots(min: number, max: number, objectWidth: number) {
  const span = max - min;
  const count = Math.max(2, Math.min(5, Math.floor(span / Math.max(1.25, objectWidth))));
  return Array.from({ length: count }, (_, index) => min + span * ((index + 1) / (count + 1)));
}

function randomOpenOffset(wall: WallSide, metrics: ReturnType<typeof roomMetrics>, objectWidth: number) {
  const slots = wall === "back" || wall === "front"
    ? wallSlots(metrics.minX, metrics.maxX, objectWidth)
    : wallSlots(metrics.minZ, metrics.maxZ, objectWidth);
  return pick(slots) + (Math.random() - 0.5) * 0.25;
}

function wallPositionForSide(side: WallSide, offset: number, metrics: ReturnType<typeof roomMetrics>): Vec2 {
  if (side === "left") return { x: metrics.leftSnapX, z: clamp(offset, metrics.minZ, metrics.maxZ) };
  if (side === "right") return { x: metrics.rightSnapX, z: clamp(offset, metrics.minZ, metrics.maxZ) };
  if (side === "front") return { x: clamp(offset, metrics.minX, metrics.maxX), z: metrics.frontSnapZ };
  return { x: clamp(offset, metrics.minX, metrics.maxX), z: metrics.backSnapZ };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function defaultName(kind: AssetKind) {
  return {
    chair: "Task chair",
    stool: "Stool",
    loungeChair: "Lounge chair",
    desk: "Desk",
    lDesk: "L-shaped desk",
    cornerDesk: "Corner desk",
    dataKiosk: "Data kiosk",
    cmmWorkstation: "CMM workstation",
    officeDesk: "Office desk",
    taskChair: "Task chair",
    wheeledChair: "Wheeled chair",
    tallChair: "Tall chair",
    armChair: "Chair with arms",
    recliner: "Recliner",
    kitchenChair: "Kitchen chair",
    draftingChair: "Drafting chair",
    standingDesk: "Standing desk",
    receptionDesk: "Reception desk",
    workbench: "Team workbench",
    conferenceTable: "Conference table",
    credenza: "Credenza",
    rollingCart: "Rolling cart",
    labBench: "Lab bench",
    lightedLabBench: "Lighted lab bench",
    balanceScale: "Balance scale",
    analyticalBalance: "Analytical balance",
    ulM: "Universal length machine",
    cmm: "CMM",
    surfacePlate: "Surface plate",
    calibrationWeights: "Calibration weights",
    microscope: "Microscope",
    oscilloscope: "Oscilloscope",
    caliperSet: "Caliper set",
    toolChest: "Tool chest",
    bed: "Bed",
    nightstand: "Nightstand",
    dresser: "Dresser",
    wardrobe: "Wardrobe",
    vanity: "Vanity",
    bedsideLamp: "Bedside lamp",
    diningTable: "Dining table",
    diningChair: "Dining chair",
    barStool: "Bar stool",
    buffet: "Buffet",
    pendantLight: "Pendant light",
    kitchenIsland: "Kitchen island",
    stove: "Stove",
    fridge: "Fridge",
    sink: "Kitchen sink",
    cabinetCounter: "Cabinet counter",
    microwave: "Microwave",
    toaster: "Toaster",
    bathtub: "Bathtub",
    toilet: "Toilet",
    bathroomSink: "Bathroom sink",
    shower: "Shower",
    mirror: "Mirror",
    towelRack: "Towel rack",
    tvStand: "TV stand",
    wallTv: "Wall TV",
    standTv: "Stand TV",
    television: "Stand TV",
    bookshelf: "Bookshelf",
    fireplace: "Fireplace",
    mediaConsole: "Media console",
    sectional: "Sectional",
    beanBag: "Bean bag",
    monitor: "Live monitor",
    laptop: "Laptop",
    tablet: "Tablet",
    keyboard: "Keyboard",
    mouse: "Mouse",
    cup: "Coffee cup",
    pencilCup: "Pencil cup",
    notebook: "Notebook",
    fileTray: "File tray",
    headphones: "Headphones",
    speaker: "Speaker",
    deskFan: "Desk fan",
    paperPile: "Paper pile",
    bookStack: "Book stack",
    deskLamp: "Desk lamp",
    floorLamp: "Floor lamp",
    phone: "Phone",
    printer: "Printer",
    trashBin: "Trash bin",
    coatRack: "Coat rack",
    plant: "Plant",
    smallPlant: "Small plant",
    planterBox: "Planter box",
    sofa: "Lounge sofa",
    ottoman: "Ottoman",
    coffeeTable: "Coffee table",
    sideTable: "Side table",
    rug: "Area rug",
    shelf: "Storage shelf",
    wallShelf: "Wall shelf",
    aquariumShelf: "Aquarium shelf",
    lizardEnclosure: "Lizard enclosure",
    catSitting: "Sitting cat",
    catSleeping: "Sleeping cat",
    catStretching: "Stretching cat",
    catLoaf: "Loaf cat",
    switch: "Light switch",
    thermostat: "Thermostat",
    fireCanister: "Fire canister",
    exitSign: "Exit sign",
    safetySign: "Safety sign",
    cabinet: "File cabinet",
    storageCube: "Storage cube",
    whiteboard: "Whiteboard",
    bulletinBoard: "Bulletin board",
    acousticPanel: "Acoustic panel",
    wallArt: "Wall art",
    clock: "Clock",
    projector: "Projector",
    window: "Window",
    door: "Door",
    divider: "Glass divider",
    image: "Generated image model",
    importedModel: "Imported model",
    aiModel: "Generated image model",
  }[kind];
}

function titleFromPrompt(prompt: string) {
  const words = prompt
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  const title = words.map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  return title || "Generated Asset";
}

function hashPrompt(prompt: string) {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function colorFromPrompt(prompt: string) {
  const hash = hashPrompt(prompt);
  const hue = hash % 360;
  const sat = 45 + (hash % 22);
  const light = 48 + (hash % 12);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function makePromptTexture(prompt: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const hash = hashPrompt(prompt);
  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#f7f1df");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#10120e";
  for (let i = 0; i < 10; i += 1) {
    const x = (hash * (i + 3)) % 256;
    const y = (hash / (i + 2)) % 256;
    ctx.beginPath();
    ctx.arc(x, y, 12 + ((hash + i) % 24), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.fillRect(18, 190, 220, 34);
  ctx.fillStyle = "#202318";
  ctx.font = "700 18px sans-serif";
  ctx.fillText(titleFromPrompt(prompt).slice(0, 18), 28, 212);
  return new THREE.CanvasTexture(canvas);
}

function snap(position: Vec2): Vec2 {
  return {
    x: Math.round(position.x / GRID) * GRID,
    z: Math.round(position.z / GRID) * GRID,
  };
}

function cloneTransform(item: BuilderItem): BuilderItem {
  return {
    ...item,
    position: { ...item.position },
  };
}

function snapForKind(kind: AssetKind, position: Vec2): Vec2 {
  const grid = FINE_GRID;
  return {
    x: Math.round(position.x / grid) * grid,
    z: Math.round(position.z / grid) * grid,
  };
}

function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

function snapHeight(height: number) {
  return Math.round(height / HEIGHT_GRID) * HEIGHT_GRID;
}

function snapFineHeight(height: number) {
  return Math.round(height / 0.01) * 0.01;
}

const itemBoundsCache = new Map<string, { minY: number; maxY: number }>();

function getItemLocalBounds(item: Pick<BuilderItem, "kind" | "prompt" | "generatedSeed" | "modelFormat">) {
  const key = `${item.kind}:${item.prompt ?? ""}:${item.generatedSeed ?? ""}:${item.modelFormat ?? ""}`;
  const cached = itemBoundsCache.get(key);
  if (cached) return cached;
  const probe = createItemGroup({
    id: "bounds",
    name: "bounds",
    kind: item.kind,
    position: { x: 0, z: 0 },
    elevation: 0,
    rotation: 0,
    scale: 1,
    prompt: item.prompt,
    generatedSeed: item.generatedSeed,
    modelFormat: item.modelFormat,
  } as BuilderItem, []);
  const box3 = new THREE.Box3().setFromObject(probe);
  const bounds = {
    minY: Number.isFinite(box3.min.y) ? box3.min.y : 0,
    maxY: Number.isFinite(box3.max.y) ? box3.max.y : 1,
  };
  itemBoundsCache.set(key, bounds);
  return bounds;
}

type Surface = {
  y: number;
  width: number;
  depth: number;
  offsetX?: number;
  offsetZ?: number;
};

function getSurfaces(item: BuilderItem): Surface[] {
  if (item.kind === "desk") return [{ y: 0.95, width: 2.2, depth: 1.15 }];
  if (item.kind === "officeDesk") return [{ y: 0.95, width: 2.2, depth: 1.15 }];
  if (item.kind === "lDesk") {
    return [
      { y: 0.94, width: 2.35, depth: 0.88 },
      { y: 0.94, width: 0.88, depth: 1.65, offsetX: -0.74, offsetZ: 0.38 },
    ];
  }
  if (item.kind === "cornerDesk") {
    return [
      { y: 0.94, width: 2.35, depth: 0.88 },
      { y: 0.94, width: 0.88, depth: 1.65, offsetX: -0.74, offsetZ: 0.38 },
      { y: 0.97, width: 0.9, depth: 0.9, offsetX: -0.72, offsetZ: -0.02 },
    ];
  }
  if (item.kind === "dataKiosk" || item.kind === "cmmWorkstation") return [{ y: 0.94, width: 0.86, depth: 0.54 }];
  if (item.kind === "standingDesk") return [{ y: 1.18, width: 2.0, depth: 0.9 }];
  if (item.kind === "receptionDesk") return [{ y: 1.04, width: 2.8, depth: 0.84 }];
  if (item.kind === "workbench") return [{ y: 1, width: 3.4, depth: 0.95 }];
  if (item.kind === "conferenceTable") return [{ y: 0.85, width: 3.4, depth: 1.35 }];
  if (item.kind === "credenza") return [{ y: 0.74, width: 1.75, depth: 0.5 }];
  if (item.kind === "nightstand") return [{ y: 0.62, width: 0.62, depth: 0.5 }];
  if (item.kind === "dresser") return [{ y: 0.86, width: 1.45, depth: 0.56 }];
  if (item.kind === "vanity") return [{ y: 0.95, width: 2.2, depth: 1.15 }];
  if (item.kind === "diningTable") return [{ y: 0.82, width: 1.64, depth: 1.64 }];
  if (item.kind === "buffet") return [{ y: 0.78, width: 2.18, depth: 0.54 }];
  if (item.kind === "kitchenIsland") return [{ y: 0.94, width: 2.25, depth: 1.08 }];
  if (item.kind === "labBench" || item.kind === "lightedLabBench") return [{ y: 0.98, width: 2.55, depth: 0.92 }];
  if (item.kind === "surfacePlate") return [{ y: 0.92, width: 1.45, depth: 0.9 }];
  if (item.kind === "cabinetCounter") return [{ y: 0.93, width: 1.65, depth: 0.68 }];
  if (item.kind === "sink") return [{ y: 0.96, width: 1.65, depth: 0.68 }];
  if (item.kind === "bathroomSink") return [{ y: 0.7, width: 0.62, depth: 0.46 }];
  if (item.kind === "tvStand") return [{ y: 0.58, width: 2.02, depth: 0.54 }];
  if (item.kind === "mediaConsole") return [{ y: 0.58, width: 2.54, depth: 0.54 }];
  if (item.kind === "rollingCart") {
    return [
      { y: 0.32, width: 0.72, depth: 0.42 },
      { y: 0.64, width: 0.72, depth: 0.42 },
      { y: 0.96, width: 0.72, depth: 0.42 },
    ];
  }
  if (item.kind === "coffeeTable") return [{ y: 0.47, width: 1.15, depth: 0.7 }];
  if (item.kind === "sideTable") return [{ y: 0.56, width: 0.68, depth: 0.68 }];
  if (item.kind === "cabinet") return [{ y: 0.94, width: 1.2, depth: 0.48 }];
  if (item.kind === "storageCube") return [{ y: 0.74, width: 0.72, depth: 0.72 }];
  if (item.kind === "shelf") {
    return [
      { y: 0.34, width: 1.28, depth: 0.38 },
      { y: 0.84, width: 1.28, depth: 0.38 },
      { y: 1.34, width: 1.28, depth: 0.38 },
    ];
  }
  if (item.kind === "wallShelf") return [{ y: 0.32, width: 1.15, depth: 0.34 }];
  if (item.kind === "aquariumShelf") return [{ y: 1.32, width: 1.55, depth: 0.52 }];
  if (item.kind === "lizardEnclosure") return [{ y: 1.12, width: 1.42, depth: 0.52 }];
  return [];
}

function pointOnSurface(position: Vec2, item: BuilderItem, surface: Surface) {
  const dx = position.x - item.position.x - (surface.offsetX ?? 0);
  const dz = position.z - item.position.z - (surface.offsetZ ?? 0);
  const cos = Math.cos(-(item.rotation ?? 0));
  const sin = Math.sin(-(item.rotation ?? 0));
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  return Math.abs(localX) <= surface.width * item.scale * 0.5 && Math.abs(localZ) <= surface.depth * item.scale * 0.5;
}

function wallSideForItem(item: BuilderItem, metrics: ReturnType<typeof roomMetrics>): WallSide {
  const distances: Array<{ side: WallSide; distance: number }> = [
    { side: "left", distance: Math.abs(item.position.x - metrics.leftSnapX) },
    { side: "right", distance: Math.abs(item.position.x - metrics.rightSnapX) },
    { side: "back", distance: Math.abs(item.position.z - metrics.backSnapZ) },
    { side: "front", distance: Math.abs(item.position.z - metrics.frontSnapZ) },
  ];
  return distances.sort((a, b) => a.distance - b.distance)[0].side;
}

function shouldCastShadow(kind: AssetKind) {
  return !wallMountedKinds.has(kind) && kind !== "window" && kind !== "door";
}

function inwardVectorForWall(side: WallSide): Vec2 {
  if (side === "back") return { x: 0, z: 1 };
  if (side === "front") return { x: 0, z: -1 };
  if (side === "left") return { x: 1, z: 0 };
  return { x: -1, z: 0 };
}

function wallRotation(side: WallSide) {
  if (side === "left" || side === "right") return Math.PI / 2;
  return 0;
}

function setObjectOpacity(object: any, opacity: number) {
  object.traverse((child: any) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materialsForChild = Array.isArray(child.material) ? child.material : [child.material];
    const fadedMaterials = materialsForChild.map((material: any) => {
      if (!material) return material;
      if (!material.userData?.fadeMaterial) {
        const clone = material.clone();
        clone.userData.fadeMaterial = true;
        clone.userData.baseOpacity = material.opacity ?? 1;
        clone.transparent = true;
        clone.depthWrite = opacity > 0.45;
        return clone;
      }
      material.transparent = true;
      material.depthWrite = opacity > 0.45;
      return material;
    });
    child.material = Array.isArray(child.material) ? fadedMaterials : fadedMaterials[0];
    const nextMaterials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of nextMaterials) {
      if (!material) continue;
      material.opacity = (material.userData.baseOpacity ?? 1) * opacity;
      material.depthWrite = opacity > 0.45;
      material.needsUpdate = true;
    }
  });
}

function clampToRoom(position: Vec2): Vec2 {
  return {
    x: Math.min(4.4, Math.max(-4.4, position.x)),
    z: Math.min(3.25, Math.max(-3.35, position.z)),
  };
}

function box(width: number, height: number, depth: number, material: any) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
}

function roundedBox(width: number, height: number, depth: number, radius: number, material: any) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 3, 3, 3);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.radius = radius;
  return mesh;
}

function cylinder(radius: number, height: number, material: any) {
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 28), material);
}

function makeFrame(width: number, height: number, thickness: number, material: any) {
  const group = new THREE.Group();
  const top = box(width, thickness, 0.08, material);
  top.position.y = height / 2;
  const bottom = top.clone();
  bottom.position.y = -height / 2;
  const left = box(thickness, height, 0.08, material);
  left.position.x = -width / 2;
  const right = left.clone();
  right.position.x = width / 2;
  group.add(top, bottom, left, right);
  return group;
}

function wallMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.74,
    bumpMap: stripeTexture("#f6f2e8", "#c8c5bb", 96, 16),
    bumpScale: 0.045,
  });
}

function stripeTexture(a: string, b: string, size: number, stripe: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = a;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = b;
  for (let y = 0; y < size; y += stripe) ctx.fillRect(0, y, size, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 5);
  return texture;
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
