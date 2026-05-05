javascript:(function() {
	const portalGun = {
		name: "portal gun",
		description: "creates <strong class='color-f'>por</strong class='color-f'><strong class='color-e'>tals</strong class='color-e'> when shot at a surface<br>fire while crouched to create <strong class='color-e'>orange portals</strong class='color-e'>",
		ammo: Infinity,
		ammoPack: Infinity,
		defaultAmmoPack: Infinity,
		have: false,
		charge: 0,
		isStuckOn: false,
		angle: 0,
		do() {},
	};

	const ensurePortalState = () => {
		if (!b.portalGunState) {
			b.portalGunState = {
				blue: null,
				orange: null,
				portals: null,
			};
		}
		if (typeof m.lastUsedPortalCycle !== "number") m.lastUsedPortalCycle = 0;
		if (typeof level.hasCreatedBluePortal !== "boolean") level.hasCreatedBluePortal = false;
		if (typeof level.hasCreatedOrangePortal !== "boolean") level.hasCreatedOrangePortal = false;
	};

	const removePreviousPortals = () => {
		if (!b.portalGunState || !b.portalGunState.portals) return;
		for (const portal of b.portalGunState.portals) {
			const index = composite.indexOf(portal);
			if (index !== -1) composite.splice(index, 1);
			Matter.Composite.remove(engine.world, portal);
		}
		b.portalGunState.portals = null;
	};

	b.portalGunBullet = function(where = {
		x: m.pos.x + 20 * Math.cos(m.angle),
		y: m.pos.y + 20 * Math.sin(m.angle)
	}, whereEnd = {
		x: where.x + 3000 * Math.cos(m.angle),
		y: where.y + 3000 * Math.sin(m.angle)
	}) {
		ensurePortalState();
		const best = vertexCollision(where, whereEnd, [map, body]);
		if (best.dist2 === Infinity) return;

		const normal = Vector.perp(Vector.normalise(Vector.sub(best.v1, best.v2)));
		const beam = Vector.sub(whereEnd, where);
		const reflected = Vector.mult(normal, 2 * Vector.dot(beam, normal));
		const angle = Math.atan2(reflected.y, reflected.x);
		const portalPos = {
			x: best.x - 75 * Math.cos(angle),
			y: best.y - 75 * Math.sin(angle),
		};
		const portal = { x: portalPos.x, y: portalPos.y, angle };

		if (input.down) {
			b.portalGunState.orange = portal;
			level.hasCreatedOrangePortal = true;
		} else {
			b.portalGunState.blue = portal;
			level.hasCreatedBluePortal = true;
		}

		if (!b.portalGunState.blue || !b.portalGunState.orange) return;

		removePreviousPortals();
		b.portalGunState.portals = level.portal(
			{ x: b.portalGunState.blue.x, y: b.portalGunState.blue.y },
			b.portalGunState.blue.angle + Math.PI,
			{ x: b.portalGunState.orange.x, y: b.portalGunState.orange.y },
			b.portalGunState.orange.angle + Math.PI
		);
	};

	portalGun.fire = function() {
		const drain = 0.01;
		if (m.energy < drain) {
			m.fireCDcycle = m.cycle + 100;
			return;
		}
		if (m.cycle - m.lastUsedPortalCycle <= 5 && m.lastUsedPortalCycle !== 0) return;

		m.fireCDcycle = m.cycle;
		m.energy -= drain;
		const where = {
			x: m.pos.x + 20 * Math.cos(m.angle),
			y: m.pos.y + 20 * Math.sin(m.angle)
		};
		b.portalGunBullet(where, {
			x: where.x + 3000 * Math.cos(m.angle),
			y: where.y + 3000 * Math.sin(m.angle)
		});
		m.lastUsedPortalCycle = m.cycle;
	};

	if (!level.portalGunResetPatched) {
		const originalStart = level.start;
		level.start = function(...args) {
			level.hasCreatedBluePortal = false;
			level.hasCreatedOrangePortal = false;
			b.portalGunState = {
				blue: null,
				orange: null,
				portals: null,
			};
			m.lastUsedPortalCycle = 0;
			return originalStart.apply(this, args);
		};
		level.portalGunResetPatched = true;
	}

	b.guns.push(portalGun);
	console.log("%cPortal gun mod successfully installed", "color: dodgerblue");
})();
