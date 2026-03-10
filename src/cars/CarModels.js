// src/cars/CarModels.js - Modelos 3D detalhados estilo Car Mechanic Simulator

import * as THREE from 'three';

export class CarModels {
    constructor() {
        this.models = {};
    }

    // ─── Materiais reutilizáveis ───────────────────────────────────────────────
    _mat(color, metalness = 0.7, roughness = 0.35) {
        return new THREE.MeshStandardMaterial({ color, metalness, roughness });
    }
    _glass() {
        return new THREE.MeshStandardMaterial({
            color: 0x88bbdd, metalness: 0.1, roughness: 0.05,
            transparent: true, opacity: 0.35, side: THREE.DoubleSide
        });
    }
    _chrome()  { return this._mat(0xcccccc, 1.0, 0.15); }
    _black()   { return this._mat(0x111111, 0.3, 0.8);  }
    _rubber()  { return this._mat(0x1a1a1a, 0.0, 0.95); }
    _light(color, emissive) {
        return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.2 });
    }

    // ─── Rodas completas ──────────────────────────────────────────────────────
    _addWheels(group, positions, radius = 0.36, width = 0.26, spokeCount = 5) {
        const tireMat  = this._rubber();
        const rimMat   = this._mat(0x999999, 0.9, 0.2);
        const spokeMat = this._chrome();
        const boltMat  = this._mat(0xbbbbbb, 0.9, 0.1);

        positions.forEach(([x, y, z]) => {
            const wg = new THREE.Group();

            // Pneu
            const tire = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.82, radius * 0.22, 16, 32), tireMat);
            tire.rotation.y = Math.PI / 2;
            wg.add(tire);

            // Aro central
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width * 0.9, 24), rimMat);
            rim.rotation.z = Math.PI / 2;
            wg.add(rim);

            // Raios
            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spoke = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, radius * 0.1, radius * 0.08), spokeMat);
                spoke.rotation.z = Math.PI / 2;
                spoke.rotation.x = angle;
                spoke.position.set(0, Math.cos(angle) * radius * 0.38, Math.sin(angle) * radius * 0.38);
                wg.add(spoke);
            }

            // Calota central
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.15, radius * 0.15, width * 0.95, 12), rimMat);
            cap.rotation.z = Math.PI / 2;
            wg.add(cap);

            // Parafusos
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, width, 6), boltMat);
                bolt.rotation.z = Math.PI / 2;
                bolt.position.set(0, Math.cos(a) * radius * 0.3, Math.sin(a) * radius * 0.3);
                wg.add(bolt);
            }

            wg.position.set(x, y, z);
            wg.castShadow = true;
            group.add(wg);
        });
    }

    // ─── Faróis / Lanternas ───────────────────────────────────────────────────
    _addHeadlights(group, frontZ, rearZ, y = 0.55, w = 0.85) {
        const hMat = this._light(0xfff5cc, 0x554400);
        const tMat = this._light(0xff2222, 0x440000);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.05 });

        [-w, w].forEach(x => {
            // Farol dianteiro
            const hg = new THREE.Group();
            const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.12), hMat);
            hg.add(hBody);
            const hLens = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.04), lensMat);
            hLens.position.z = 0.08;
            hg.add(hLens);
            hg.position.set(x, y, frontZ);
            group.add(hg);

            // Lanterna traseira
            const tg = new THREE.Group();
            const tBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.1), tMat);
            tg.add(tBody);
            const tLens = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.04), new THREE.MeshStandardMaterial({ color: 0xff4444, transparent: true, opacity: 0.7, roughness: 0.05 }));
            tLens.position.z = -0.07;
            tg.add(tLens);
            tg.position.set(x, y, rearZ);
            group.add(tg);
        });
    }

    // ─── Espelhos retrovisores ────────────────────────────────────────────────
    _addMirrors(group, bodyColor, y = 0.9, z = 0.6) {
        const mat = this._mat(bodyColor);
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.9, roughness: 0.1 });
        [-1.12, 1.12].forEach(x => {
            const mg = new THREE.Group();
            const housing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.22), mat);
            mg.add(housing);
            const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.18), glassMat);
            mirror.position.x = x > 0 ? 0.05 : -0.05;
            mg.add(mirror);
            mg.position.set(x, y, z);
            group.add(mg);
        });
    }

    // ─── Grades dianteiras ────────────────────────────────────────────────────
    _addGrille(group, z, y = 0.45, w = 1.6, h = 0.25) {
        const grilleMat = this._mat(0x222222, 0.5, 0.6);
        const chromeMat = this._chrome();
        const grille = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), grilleMat);
        grille.position.set(0, y, z);
        group.add(grille);
        // Barras horizontais
        for (let i = 0; i < 4; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.02, 0.04), chromeMat);
            bar.position.set(0, y - h / 2 + 0.04 + i * (h / 4), z + 0.04);
            group.add(bar);
        }
    }

    // ─── Para-choques ─────────────────────────────────────────────────────────
    _addBumpers(group, frontZ, rearZ, w = 2.05, color = 0x333333) {
        const mat = this._mat(color, 0.2, 0.8);
        const chrome = this._chrome();

        // Dianteiro
        const bf = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 0.18), mat);
        bf.position.set(0, 0.38, frontZ + 0.09);
        group.add(bf);
        const bfStrip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.04, 0.06), chrome);
        bfStrip.position.set(0, 0.47, frontZ + 0.16);
        group.add(bfStrip);

        // Traseiro
        const br = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 0.18), mat);
        br.position.set(0, 0.38, rearZ - 0.09);
        group.add(br);
        const brStrip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.04, 0.06), chrome);
        brStrip.position.set(0, 0.47, rearZ - 0.16);
        group.add(brStrip);
    }

    // ─── Portas laterais ──────────────────────────────────────────────────────
    _addDoors(group, bodyColor, bodyY, bodyH, bodyLen, bodyW) {
        const mat = this._mat(bodyColor);
        const chrome = this._chrome();
        const handleMat = this._mat(0x888888, 0.9, 0.2);

        const sides = [-bodyW / 2 - 0.01, bodyW / 2 + 0.01];
        const doorZs = [bodyLen * 0.15, -bodyLen * 0.18];

        sides.forEach(x => {
            doorZs.forEach(z => {
                // Painel da porta
                const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, bodyH * 0.85, bodyLen * 0.38), mat);
                door.position.set(x, bodyY + 0.02, z);
                group.add(door);
                // Soleira
                const sill = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, bodyLen * 0.36), chrome);
                sill.position.set(x, bodyY - bodyH / 2 + 0.02, z);
                group.add(sill);
                // Maçaneta
                const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.14), handleMat);
                handle.position.set(x + (x < 0 ? -0.04 : 0.04), bodyY + 0.08, z + 0.05);
                group.add(handle);
            });
        });
    }

    // ─── Escapamento ──────────────────────────────────────────────────────────
    _addExhaust(group, rearZ, offset = 0.4) {
        const mat = this._mat(0x777777, 0.8, 0.3);
        [offset, -offset].forEach(x => {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.4, 12), mat);
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(x, 0.2, rearZ - 0.15);
            group.add(pipe);
            const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.06, 12), this._chrome());
            tip.rotation.x = Math.PI / 2;
            tip.position.set(x, 0.2, rearZ - 0.34);
            group.add(tip);
        });
    }

    // ─── Chassis / Fundo ──────────────────────────────────────────────────────
    _addChassis(group, w, len) {
        const mat = this._mat(0x1a1a1a, 0.2, 0.9);
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.1, len * 0.9), mat);
        chassis.position.y = 0.1;
        chassis.receiveShadow = true;
        group.add(chassis);
    }

    // ─── Motor visível (sob o capô) ───────────────────────────────────────────
    _addEngine(group, hoodZ, y = 0.75) {
        const blockMat = this._mat(0x333333, 0.3, 0.7);
        const coverMat = this._mat(0x111111, 0.4, 0.6);
        const hoseMat  = this._mat(0x222222, 0.0, 0.9);
        const capMat   = this._mat(0xdddddd, 0.6, 0.4);

        const block = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 0.9), blockMat);
        block.position.set(0, y, hoodZ - 0.1);
        group.add(block);

        const cover = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.82), coverMat);
        cover.position.set(0, y + 0.25, hoodZ - 0.1);
        group.add(cover);

        // Tampa de óleo
        const oilCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10), capMat);
        oilCap.position.set(-0.3, y + 0.32, hoodZ - 0.1);
        group.add(oilCap);

        // Mangueiras
        [[-0.45, 0.28, 0.35], [0.45, 0.28, 0.35]].forEach(([hx, hy, hz]) => {
            const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), hoseMat);
            hose.rotation.x = 0.5;
            hose.position.set(hx, hy + y - 0.1, hoodZ + hz - 0.4);
            group.add(hose);
        });
    }

    // =========================================================================
    //  SEDAN
    // =========================================================================
    createSedan(color = 0x2255aa) {
        const g = new THREE.Group();
        const W = 2.1, H = 0.58, L = 4.6;
        const bodyY = 0.62;
        const mat = this._mat(color);

        this._addChassis(g, W, L);

        // Carroceria
        const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), mat);
        body.position.y = bodyY;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        // Capô levemente elevado
        const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.07, 1.55), mat);
        hood.position.set(0, bodyY + H / 2 + 0.035, 1.1);
        hood.castShadow = true;
        g.add(hood);

        // Porta-malas
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.07, 1.0), mat);
        trunk.position.set(0, bodyY + H / 2 + 0.035, -1.5);
        trunk.castShadow = true;
        g.add(trunk);

        // Cabine com vidros
        const roofMat = this._mat(color, 0.5, 0.5);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.52, 1.75), roofMat);
        roof.position.set(0, bodyY + H / 2 + 0.28, -0.22);
        roof.castShadow = true;
        g.add(roof);

        // Vidros laterais
        const glassMat = this._glass();
        [-(W / 2 - 0.04), W / 2 - 0.04].forEach(x => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 1.55), glassMat);
            win.position.set(x, bodyY + H / 2 + 0.3, -0.22);
            g.add(win);
        });
        // Pára-brisa dianteiro
        const wf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, 0.44, 0.06), glassMat);
        wf.position.set(0, bodyY + H / 2 + 0.3, 0.68);
        wf.rotation.x = -0.35;
        g.add(wf);
        // Pára-brisa traseiro
        const wr = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, 0.38, 0.06), glassMat);
        wr.position.set(0, bodyY + H / 2 + 0.3, -1.1);
        wr.rotation.x = 0.3;
        g.add(wr);

        this._addDoors(g, color, bodyY, H, L, W);
        this._addBumpers(g, L / 2, -L / 2);
        this._addGrille(g, L / 2 + 0.02);
        this._addHeadlights(g, L / 2 + 0.04, -L / 2 - 0.04, bodyY + 0.06);
        this._addMirrors(g, color, bodyY + H / 2 + 0.38, 0.62);
        this._addExhaust(g, -L / 2, 0.38);
        this._addEngine(g, 1.1, bodyY + H / 2 + 0.06);
        this._addWheels(g, [
            [-W / 2 - 0.06, 0.36, 1.35],
            [ W / 2 + 0.06, 0.36, 1.35],
            [-W / 2 - 0.06, 0.36, -1.35],
            [ W / 2 + 0.06, 0.36, -1.35],
        ], 0.36, 0.26, 5);

        g.userData.type = 'sedan';
        g.userData.color = color;
        return g;
    }

    // =========================================================================
    //  HATCH
    // =========================================================================
    createHatch(color = 0xcc2222) {
        const g = new THREE.Group();
        const W = 1.95, H = 0.62, L = 4.0;
        const bodyY = 0.60;
        const mat = this._mat(color);

        this._addChassis(g, W, L);

        const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), mat);
        body.position.y = bodyY;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        // Capô curto
        const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.07, 1.2), mat);
        hood.position.set(0, bodyY + H / 2 + 0.035, 1.0);
        hood.castShadow = true;
        g.add(hood);

        // Teto mais longo (hatch integra porta-malas)
        const roofMat = this._mat(color, 0.5, 0.5);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.58, 2.1), roofMat);
        roof.position.set(0, bodyY + H / 2 + 0.31, -0.3);
        roof.castShadow = true;
        g.add(roof);

        const glassMat = this._glass();
        [-(W / 2 - 0.04), W / 2 - 0.04].forEach(x => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 1.9), glassMat);
            win.position.set(x, bodyY + H / 2 + 0.32, -0.3);
            g.add(win);
        });
        const wf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.48, 0.06), glassMat);
        wf.position.set(0, bodyY + H / 2 + 0.32, 0.7);
        wf.rotation.x = -0.4;
        g.add(wf);
        const wr = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.42, 0.06), glassMat);
        wr.position.set(0, bodyY + H / 2 + 0.32, -1.35);
        wr.rotation.x = 0.5;
        g.add(wr);

        // Porta traseira (hatch)
        const hatchDoor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, H + 0.5, 0.07), mat);
        hatchDoor.position.set(0, bodyY + 0.05, -L / 2 - 0.03);
        g.add(hatchDoor);

        this._addDoors(g, color, bodyY, H, L, W);
        this._addBumpers(g, L / 2, -L / 2, 1.98);
        this._addGrille(g, L / 2 + 0.02, bodyY - 0.1);
        this._addHeadlights(g, L / 2 + 0.04, -L / 2 - 0.04, bodyY + 0.06, 0.78);
        this._addMirrors(g, color, bodyY + H / 2 + 0.4, 0.55);
        this._addExhaust(g, -L / 2, 0.32);
        this._addEngine(g, 1.0, bodyY + H / 2 + 0.06);
        this._addWheels(g, [
            [-W / 2 - 0.06, 0.35, 1.2],
            [ W / 2 + 0.06, 0.35, 1.2],
            [-W / 2 - 0.06, 0.35, -1.2],
            [ W / 2 + 0.06, 0.35, -1.2],
        ], 0.35, 0.25, 5);

        g.userData.type = 'hatch';
        g.userData.color = color;
        return g;
    }

    // =========================================================================
    //  SUV
    // =========================================================================
    createSUV(color = 0x226622) {
        const g = new THREE.Group();
        const W = 2.22, H = 0.72, L = 4.9;
        const bodyY = 0.74;
        const mat = this._mat(color, 0.5, 0.5);

        this._addChassis(g, W, L);

        // Corpo alto
        const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), mat);
        body.position.y = bodyY;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        // Capô robusto com nervura central
        const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.09, 1.5), mat);
        hood.position.set(0, bodyY + H / 2 + 0.045, 1.2);
        hood.castShadow = true;
        g.add(hood);
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 1.46), this._mat(color, 0.5, 0.4));
        rib.position.set(0, bodyY + H / 2 + 0.1, 1.2);
        g.add(rib);

        // Teto alto
        const roofMat = this._mat(color, 0.4, 0.55);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.14, 0.72, 2.3), roofMat);
        roof.position.set(0, bodyY + H / 2 + 0.38, -0.35);
        roof.castShadow = true;
        g.add(roof);

        // Rack de teto
        const rackMat = this._chrome();
        [-0.85, 0.85].forEach(z => {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.04, 0.06), rackMat);
            bar.position.set(0, bodyY + H / 2 + 0.78, z);
            g.add(bar);
        });
        [-W / 2 + 0.2, W / 2 - 0.2].forEach(x => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 1.85), rackMat);
            rail.position.set(x, bodyY + H / 2 + 0.78, -0.05);
            g.add(rail);
        });

        const glassMat = this._glass();
        [-(W / 2 - 0.04), W / 2 - 0.04].forEach(x => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.56, 2.1), glassMat);
            win.position.set(x, bodyY + H / 2 + 0.4, -0.35);
            g.add(win);
        });
        const wf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.58, 0.07), glassMat);
        wf.position.set(0, bodyY + H / 2 + 0.4, 0.72);
        wf.rotation.x = -0.25;
        g.add(wf);
        const wr = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.52, 0.07), glassMat);
        wr.position.set(0, bodyY + H / 2 + 0.4, -1.42);
        wr.rotation.x = 0.18;
        g.add(wr);

        // Proteção plástica lateral (cladding)
        const claddingMat = this._mat(0x2a2a2a, 0.1, 0.9);
        [-(W / 2 + 0.02), W / 2 + 0.02].forEach(x => {
            const cladding = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, L * 0.88), claddingMat);
            cladding.position.set(x, bodyY - 0.12, 0);
            g.add(cladding);
        });

        // Estribo
        [-(W / 2 + 0.08), W / 2 + 0.08].forEach(x => {
            const step = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, L * 0.55), claddingMat);
            step.position.set(x, bodyY - H / 2 + 0.02, -0.1);
            g.add(step);
        });

        this._addDoors(g, color, bodyY, H, L, W);
        this._addBumpers(g, L / 2, -L / 2, W + 0.08, 0x2a2a2a);
        this._addGrille(g, L / 2 + 0.03, bodyY - 0.08, 1.8, 0.3);
        this._addHeadlights(g, L / 2 + 0.05, -L / 2 - 0.05, bodyY + 0.1, 0.9);
        this._addMirrors(g, color, bodyY + H / 2 + 0.5, 0.7);
        this._addExhaust(g, -L / 2, 0.5);
        this._addEngine(g, 1.2, bodyY + H / 2 + 0.1);
        this._addWheels(g, [
            [-W / 2 - 0.07, 0.44, 1.5],
            [ W / 2 + 0.07, 0.44, 1.5],
            [-W / 2 - 0.07, 0.44, -1.5],
            [ W / 2 + 0.07, 0.44, -1.5],
        ], 0.44, 0.3, 6);

        g.userData.type = 'suv';
        g.userData.color = color;
        return g;
    }

    // =========================================================================
    //  PICKUP
    // =========================================================================
    createPickup(color = 0x884422) {
        const g = new THREE.Group();
        const W = 2.1, bodyY = 0.72;
        const mat = this._mat(color, 0.4, 0.6);

        this._addChassis(g, W, 5.2);

        // Cabine dupla
        const cab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.7, 2.1), mat);
        cab.position.set(0, bodyY, 0.9);
        cab.castShadow = true; cab.receiveShadow = true;
        g.add(cab);

        // Teto da cabine
        const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.62, 1.95), this._mat(color, 0.4, 0.5));
        cabRoof.position.set(0, bodyY + 0.7 / 2 + 0.33, 0.9);
        cabRoof.castShadow = true;
        g.add(cabRoof);

        // Vidros da cabine
        const glassMat = this._glass();
        [-(W / 2 - 0.04), W / 2 - 0.04].forEach(x => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 1.75), glassMat);
            win.position.set(x, bodyY + 0.68, 0.9);
            g.add(win);
        });
        const wf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.5, 0.07), glassMat);
        wf.position.set(0, bodyY + 0.68, 1.96);
        wf.rotation.x = -0.22;
        g.add(wf);
        const wr = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.44, 0.07), glassMat);
        wr.position.set(0, bodyY + 0.68, -0.19);
        wr.rotation.x = 0.18;
        g.add(wr);

        // Capô
        const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.08, 0.09, 1.4), mat);
        hood.position.set(0, bodyY + 0.7 / 2 + 0.045, 2.35);
        hood.castShadow = true;
        g.add(hood);

        // Caçamba
        const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, 2.55), this._mat(0x333333, 0.2, 0.8));
        bedFloor.position.set(0, bodyY - 0.05, -1.18);
        g.add(bedFloor);

        const bedWallMat = mat;
        // Laterais da caçamba
        [-(W / 2), W / 2].forEach(x => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 2.55), bedWallMat);
            wall.position.set(x, bodyY + 0.16, -1.18);
            g.add(wall);
        });
        // Frente da caçamba
        const bedFront = new THREE.Mesh(new THREE.BoxGeometry(W, 0.42, 0.1), bedWallMat);
        bedFront.position.set(0, bodyY + 0.16, 0.1);
        g.add(bedFront);
        // Porta traseira da caçamba
        const tailgate = new THREE.Mesh(new THREE.BoxGeometry(W, 0.42, 0.1), bedWallMat);
        tailgate.position.set(0, bodyY + 0.16, -2.46);
        g.add(tailgate);

        // Para-choque traseiro robusto
        const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.2, 0.22), this._mat(0x555555, 0.8, 0.3));
        rearBumper.position.set(0, bodyY - 0.1, -2.6);
        g.add(rearBumper);

        this._addBumpers(g, 3.05, -2.55, W + 0.1);
        this._addGrille(g, 3.06, bodyY - 0.1, 1.85, 0.3);
        this._addHeadlights(g, 3.06, -2.52, bodyY + 0.08, 0.88);
        this._addMirrors(g, color, bodyY + 0.86, 1.65);
        this._addExhaust(g, -2.5, 0.44);
        this._addEngine(g, 2.35, bodyY + 0.7 / 2 + 0.1);
        this._addWheels(g, [
            [-W / 2 - 0.07, 0.44, 1.9],
            [ W / 2 + 0.07, 0.44, 1.9],
            [-W / 2 - 0.07, 0.44, -1.2],
            [ W / 2 + 0.07, 0.44, -1.2],
        ], 0.44, 0.32, 6);

        g.userData.type = 'pickup';
        g.userData.color = color;
        return g;
    }

    // =========================================================================
    //  ESPORTIVO
    // =========================================================================
    createSports(color = 0xdd1111) {
        const g = new THREE.Group();
        const W = 2.18, H = 0.44, L = 4.5;
        const bodyY = 0.42;
        const mat = this._mat(color, 0.9, 0.18);

        this._addChassis(g, W, L);

        // Corpo baixo e aerodinâmico
        const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), mat);
        body.position.y = bodyY;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        // Capô longo com saídas de ar
        const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.06, 1.8), mat);
        hood.position.set(0, bodyY + H / 2 + 0.03, 1.0);
        hood.castShadow = true;
        g.add(hood);

        // Saídas de ar no capô
        [-0.4, 0.4].forEach(x => {
            const vent = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.5), this._mat(0x111111));
            vent.position.set(x, bodyY + H / 2 + 0.055, 1.1);
            g.add(vent);
        });

        // Cabine baixa
        const roofMat = this._mat(color, 0.8, 0.25);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.24, 0.38, 1.45), roofMat);
        roof.position.set(0, bodyY + H / 2 + 0.22, -0.28);
        roof.castShadow = true;
        g.add(roof);

        const glassMat = this._glass();
        [-(W / 2 - 0.04), W / 2 - 0.04].forEach(x => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 1.3), glassMat);
            win.position.set(x, bodyY + H / 2 + 0.23, -0.28);
            g.add(win);
        });
        const wf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.28, 0.34, 0.06), glassMat);
        wf.position.set(0, bodyY + H / 2 + 0.22, 0.48);
        wf.rotation.x = -0.52;
        g.add(wf);
        const wr = new THREE.Mesh(new THREE.BoxGeometry(W - 0.28, 0.28, 0.06), glassMat);
        wr.position.set(0, bodyY + H / 2 + 0.2, -1.02);
        wr.rotation.x = 0.6;
        g.add(wr);

        // Difusor traseiro
        const diffuserMat = this._mat(0x111111, 0.3, 0.7);
        const diffuser = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.12, 0.35), diffuserMat);
        diffuser.position.set(0, bodyY - H / 2 + 0.06, -L / 2 + 0.18);
        diffuser.rotation.x = -0.3;
        g.add(diffuser);

        // Spoiler
        const spoilerMat = this._mat(0x111111, 0.4, 0.5);
        const spoilerBase1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), spoilerMat);
        spoilerBase1.position.set(-0.55, bodyY + H / 2 + 0.42, -L / 2 + 0.1);
        g.add(spoilerBase1);
        const spoilerBase2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), spoilerMat);
        spoilerBase2.position.set(0.55, bodyY + H / 2 + 0.42, -L / 2 + 0.1);
        g.add(spoilerBase2);
        const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.06, 0.42), spoilerMat);
        spoilerWing.position.set(0, bodyY + H / 2 + 0.53, -L / 2 + 0.1);
        spoilerWing.rotation.x = 0.12;
        g.add(spoilerWing);

        // Saídas laterais
        [-W / 2 - 0.02, W / 2 + 0.02].forEach(x => {
            const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.4), diffuserMat);
            scoop.position.set(x, bodyY - 0.06, -0.5);
            g.add(scoop);
        });

        this._addBumpers(g, L / 2, -L / 2, W + 0.06, 0x111111);
        this._addGrille(g, L / 2 + 0.02, bodyY - 0.1, 1.4, 0.22);
        this._addHeadlights(g, L / 2 + 0.04, -L / 2 - 0.04, bodyY + 0.05, 0.82);
        this._addMirrors(g, color, bodyY + H / 2 + 0.28, 0.52);
        this._addExhaust(g, -L / 2, 0.38);
        this._addEngine(g, 1.0, bodyY + H / 2 + 0.04);
        this._addWheels(g, [
            [-W / 2 - 0.07, 0.32, 1.3],
            [ W / 2 + 0.07, 0.32, 1.3],
            [-W / 2 - 0.07, 0.32, -1.3],
            [ W / 2 + 0.07, 0.32, -1.3],
        ], 0.34, 0.28, 7);

        g.userData.type = 'sports';
        g.userData.color = color;
        return g;
    }

    // =========================================================================
    //  CLÁSSICO
    // =========================================================================
    createClassic(color = 0x225588) {
        const g = new THREE.Group();
        const W = 2.05, H = 0.6, L = 4.8;
        const bodyY = 0.64;
        const mat = this._mat(color, 0.6, 0.4);

        this._addChassis(g, W, L);

        // Corpo arredondado (simulado com boxes levemente maiores em camadas)
        const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, L), mat);
        body.position.y = bodyY;
        body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        // Capô comprido estilo clássico
        const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.08, 0.08, 2.0), mat);
        hood.position.set(0, bodyY + H / 2 + 0.04, 1.2);
        g.add(hood);

        // Porta-malas curto
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(W - 0.08, 0.08, 0.9), mat);
        trunk.position.set(0, bodyY + H / 2 + 0.04, -1.65);
        g.add(trunk);

        // Teto arqueado
        const roofMat = this._mat(color, 0.55, 0.45);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.56, 1.6), roofMat);
        roof.position.set(0, bodyY + H / 2 + 0.3, -0.35);
        roof.castShadow = true;
        g.add(roof);

        // Cromados característicos
        const chrome = this._chrome();
        // Moldura do para-brisa
        const trim = new THREE.Mesh(new THREE.BoxGeometry(W - 0.14, 0.04, 0.04), chrome);
        trim.position.set(0, bodyY + H / 2 + 0.58, 0.46);
        g.add(trim);

        // Frisos laterais cromados
        [-(W / 2 + 0.02), W / 2 + 0.02].forEach(x => {
            const friso = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, L * 0.82), chrome);
            friso.position.set(x, bodyY + 0.04, -0.1);
            g.add(friso);
        });

        // Placa dianteira cromada
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.04), chrome);
        plate.position.set(0, bodyY - 0.1, L / 2 + 0.12);
        g.add(plate);

        const glassMat = this._glass();
        [-(W / 2 - 0.04), W / 2 - 0.04].forEach(x => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 1.42), glassMat);
            win.position.set(x, bodyY + H / 2 + 0.3, -0.35);
            g.add(win);
        });
        const wf = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, 0.46, 0.06), glassMat);
        wf.position.set(0, bodyY + H / 2 + 0.3, 0.48);
        wf.rotation.x = -0.28;
        g.add(wf);
        const wr = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, 0.38, 0.06), glassMat);
        wr.position.set(0, bodyY + H / 2 + 0.28, -1.12);
        wr.rotation.x = 0.24;
        g.add(wr);

        this._addDoors(g, color, bodyY, H, L, W);
        this._addBumpers(g, L / 2, -L / 2, W + 0.1, 0x888888);
        this._addGrille(g, L / 2 + 0.02, bodyY - 0.02, 1.7, 0.28);
        this._addHeadlights(g, L / 2 + 0.04, -L / 2 - 0.04, bodyY + 0.08, 0.82);
        this._addMirrors(g, color, bodyY + H / 2 + 0.38, 0.64);
        this._addExhaust(g, -L / 2, 0.36);
        this._addEngine(g, 1.2, bodyY + H / 2 + 0.08);
        this._addWheels(g, [
            [-W / 2 - 0.06, 0.38, 1.45],
            [ W / 2 + 0.06, 0.38, 1.45],
            [-W / 2 - 0.06, 0.38, -1.45],
            [ W / 2 + 0.06, 0.38, -1.45],
        ], 0.38, 0.26, 8);

        g.userData.type = 'classic';
        g.userData.color = color;
        return g;
    }

    // ─── Factory principal ────────────────────────────────────────────────────
    createCarByType(type, color) {
        switch (type) {
            case 'sedan':   return this.createSedan(color);
            case 'hatch':   return this.createHatch(color);
            case 'suv':     return this.createSUV(color);
            case 'pickup':  return this.createPickup(color);
            case 'sports':  return this.createSports(color);
            case 'classic': return this.createClassic(color);
            default:        return this.createSedan(color);
        }
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.CarModels = CarModels;
}
