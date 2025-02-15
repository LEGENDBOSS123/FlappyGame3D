import SpatialHash from "../Broadphase/SpatialHash.mjs";
import CollisionDetector from "../Collision/CollisionDetector.mjs";
import Composite from "../Shapes/Composite.mjs";

var World = class {
    constructor(options) {
        this.maxID = options?.maxID ?? 0;
        this.deltaTime = options?.deltaTime ?? 1;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;

        this.iterations = options?.iterations ?? 1;

        this.all = options?.all ?? {};

        this.spatialHash = options?.spatialHash ?? new SpatialHash({ world: this });
        this.collisionDetector = options?.collisionDetector ?? new CollisionDetector({ world: this });
        this.graphicsEngine = options?.graphicsEngine ?? null;
    }

    setDeltaTime(deltaTime) {
        this.deltaTime = deltaTime;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;
    }

    setIterations(iterations) {
        this.iterations = iterations;
        this.setDeltaTime(1 / this.iterations);
    }

    addComposite(composite) {
        this.add(composite);
    }

    add(element) {
        element.id = (this.maxID++);
        element.setWorld(this);
        element.graphicsEngine = this.graphicsEngine;
        element.mesh = element._mesh;
        this.all[element.id] = element;
        return element;
    }

    remove(element) {
        element.dispatchEvent("delete");
        if (element.parent) {
            element.parent.children.splice(element.parent.children.indexOf(element), 1);
        }
        for (var i in element.children) {
            this.remove(element.children[i]);
        }
        this.spatialHash.remove(element.id);
        delete this.all[element.id];
    }

    step() {
        
        for (var i in this.all) {
            this.all[i].dispatchEvent("preStep");
        }
        for (var iter = 0; iter < this.iterations; iter++) {
            for (var i in this.all) {
                this.all[i].dispatchEvent("preIteration");
                if (this.all[i].isMaxParent()) {
                    this.all[i].updateBeforeCollisionAll();
                }
            }
            this.collisionDetector.handleAll(this.all);
            this.collisionDetector.resolveAll();
            for (var i in this.all) {
                if (this.all[i].isMaxParent()) {
                    this.all[i].updateAfterCollisionAll();
                }
                this.all[i].dispatchEvent("postIteration");
            }
        }
        for (var i in this.all) {
            this.all[i].dispatchEvent("postStep");

        }
        for (var i in this.all) {
            if (this.all[i].toBeRemoved) {

                this.remove(this.all[i]);
            }
        }
    }

    getByID(id) {
        return this.all[id];
    }

    toJSON() {
        var world = {};

        world.maxID = this.maxID;
        world.deltaTime = this.deltaTime;
        world.deltaTimeSquared = this.deltaTimeSquared;
        world.inverseDeltaTime = this.inverseDeltaTime;
        world.iterations = this.iterations;
        world.all = {};

        for (var i in this.all) {
            world.all[i] = this.getByID(i).toJSON();
        }


        world.spatialHash = null;//this.spatialHash.toJSON();
        world.collisionDetector = this.collisionDetector.toJSON();

        return world;
    }

    static fromJSON(json, graphicsEngine = this.graphicsEngine) {
        var world = new this();

        world.maxID = json.maxID;
        world.deltaTime = json.deltaTime;
        world.deltaTimeSquared = json.deltaTimeSquared;
        world.inverseDeltaTime = json.inverseDeltaTime;
        world.iterations = json.iterations;
        world.all = {};

        for (var i in json.all) {
            world.all[i] = Composite.SHAPES_CLASSES[json.all[i].shape].fromJSON(json.all[i], world, graphicsEngine);
        }

        for (var i in world.all) {
            world.all[i].updateReferences(world, graphicsEngine);
        }

        world.spatialHash = new SpatialHash({ world: world });//SpatialHash.fromJSON(json.spatialHash, world);
        world.collisionDetector = CollisionDetector.fromJSON(json.collisionDetector, world);
        world.graphicsEngine = graphicsEngine;
        return world;
    }
};


export default World;