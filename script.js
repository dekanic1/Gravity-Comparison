const canvasN = document.getElementById('canvas-newton');
const canvasE = document.getElementById('canvas-einstein');
const ctxN = canvasN.getContext('2d');
const ctxE = canvasE.getContext('2d');

// UI Elements
const elStarMass = document.getElementById('star-mass');
const elPlanetV = document.getElementById('planet-v');
const elRelativityMult = document.getElementById('relativity-mult');
const elSimSpeed = document.getElementById('sim-speed');
const elPlanetDist = document.getElementById('planet-dist');
const elPlanetCount = document.getElementById('planet-count');
const elPathPreview = document.getElementById('path-preview');

const valStarMass = document.getElementById('star-mass-val');
const valPlanetV = document.getElementById('planet-v-val');
const valRelativityMult = document.getElementById('relativity-mult-val');
const valSimSpeed = document.getElementById('sim-speed-val');
const valPlanetDist = document.getElementById('planet-dist-val');
const valPlanetCount = document.getElementById('planet-count-val');

const statN = document.getElementById('stats-newton');
const statE = document.getElementById('stats-einstein');
const btnTr = document.getElementById('btn-tr');
const btnEn = document.getElementById('btn-en');

const planetColors = [
    '#00cec9', // Original Cyan (Newton vibe)
    '#fdcb6e', // Original Gold (Einstein vibe)
    '#ff7675', // Soft Red
    '#a29bfe', // Purple
    '#55efc4'  // Mint Green
];

// Localization
const translations = {
    tr: {
        header: { title: "Gravity Sim", subtitle: "Newton vs Genel Görelilik" },
        controls: {
            starMass: "Yıldız Kütlesi",
            simSpeed: "Simülasyon Hızı",
            speedWarning: "⚠️ Yüksek hızda fiziksel sapmalar olabilir!",
            advancedToggle: "Gelişmiş Ayarlar",
            planetV: "İlk Hız (Gezegen)",
            relativityMult: "Görelilik Etkisi Çarpanı",
            planetDist: "Gezegen Uzaklığı",
            planetCount: "Gezegen Sayısı",
            pathPreview: "Gelecek Yol İzi"
        },
        buttons: {
            realistic: "Gerçekçi",
            ideal: "Hızlı",
            reset: "Baştan",
            clear: "İzi Sil"
        },
        info: {
            title: "Teorik Farklar",
            newtonTitle: "Newton'un Kanunu:",
            newton: "Newton'un Kanunu: Uzay sabittir. Gezegen yıldız etrafında mükemmel, değişmeyen bir elips çizerek sonsuza dek aynı yolu izler.",
            einsteinTitle: "Einstein (Genel Görelilik):",
            einstein: "Einstein (Genel Görelilik): Kütle, uzay-zaman örtüsünü büker (arkadaki ızgaraya bakın). Bu bükülme yıldıza yaklaştıkça artar ve gezegen her yakınlaştığında yörüngesinin biraz sapmasına (yalpalamasına) neden olur. Harika rozet deseni böyle oluşur."
        },
        panels: {
            newtonTitle: "Newton (Klasik Fizik)",
            einsteinTitle: "Einstein (Genel Görelilik)"
        },
        stats: {
            world: "Dünya",
            newton: "Newton",
            einstein: "Einstein",
            precession: "Yalpalama"
        }
    },
    en: {
        header: { title: "Gravity Sim", subtitle: "Newton vs General Relativity" },
        controls: {
            starMass: "Star Mass",
            simSpeed: "Simulation Speed",
            speedWarning: "⚠️ High speed may cause physical inaccuracies!",
            advancedToggle: "Advanced Settings",
            planetV: "Initial Velocity (Planet)",
            relativityMult: "Relativity Effect Multiplier",
            planetDist: "Planet Distance",
            planetCount: "Planet Count",
            pathPreview: "Future Path Trace"
        },
        buttons: {
            realistic: "Realistic",
            ideal: "Fast",
            reset: "Restart",
            clear: "Clear Trails"
        },
        info: {
            title: "Theoretical Differences",
            newtonTitle: "Newton's Law:",
            newton: "Newton's Law: Space is fixed. A planet follows the same path forever, drawing a perfect and unchanging ellipse around its star.",
            einsteinTitle: "Einstein (General Relativity):",
            einstein: "Einstein (General Relativity): Mass warps the fabric of space-time (look at the grid behind). This warp increases near the star, causing the planet's orbit to shift (precess) slightly with each pass. This is how the beautiful rosette pattern is formed."
        },
        panels: {
            newtonTitle: "Newton (Classical Physics)",
            einsteinTitle: "Einstein (General Relativity)"
        },
        stats: {
            world: "Earth",
            newton: "Newton",
            einstein: "Einstein",
            precession: "Precession"
        }
    }
};

let currentLang = 'en';

function updateLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const path = el.getAttribute('data-i18n').split('.');
        let translation = translations[lang];
        path.forEach(key => {
            if (translation) translation = translation[key];
        });

        if (translation) {
            // Special handling for elements with strong tags inside
            if (el.getAttribute('data-i18n').startsWith('info.newton') ||
                el.getAttribute('data-i18n').startsWith('info.einstein')) {
                const titleKey = el.getAttribute('data-i18n') + 'Title';
                const fullText = translation;
                const titlePath = titleKey.split('.');
                let titleTranslation = translations[lang];
                titlePath.forEach(k => { if (titleTranslation) titleTranslation = titleTranslation[k]; });

                el.innerHTML = `<strong>${titleTranslation}</strong> ${fullText.replace(titleTranslation, '').trim()}`;
            } else {
                if (el.querySelector('span')) {
                    const span = el.querySelector('span').outerHTML;
                    el.innerHTML = translation + ' ' + span;
                } else {
                    el.innerText = translation;
                }
            }
        }
    });

    // Update button states
    btnTr.classList.toggle('active', lang === 'tr');
    btnEn.classList.toggle('active', lang === 'en');
}

btnTr.addEventListener('click', () => updateLanguage('tr'));
btnEn.addEventListener('click', () => updateLanguage('en'));

// Set initial English state
updateLanguage('en');

// Config
let config = {
    G: 1, // Normalized gravity constant
    starMass: parseFloat(elStarMass.value),
    planetInitialV: parseFloat(elPlanetV.value),
    relativityMultiplier: parseFloat(elRelativityMult.value),
    simSpeed: parseFloat(elSimSpeed.value),
    planetDistance: parseFloat(elPlanetDist.value),
    planetCount: parseInt(elPlanetCount.value),
    pathPreview: elPathPreview.checked,
    worldTime: 0,
    dt: 0.05,
    trailLength: 10000,
};

// State
class Simulation {
    constructor(isEinstein) {
        this.isEinstein = isEinstein;
        this.reset();
    }

    reset() {
        this.planets = [];
        for (let i = 0; i < config.planetCount; i++) {
            // Stagger planets by radial distance (15 units) so they don't overlap
            const staggeredDist = config.planetDistance + (i * 15);
            this.planets.push({
                x: 0,
                y: -staggeredDist,
                vx: config.planetInitialV + (i * 0.1),
                vy: 0,
                mass: 1,
                color: planetColors[i % planetColors.length],
                trail: [],
                totalAngle: 0,
                lastAngle: Math.atan2(-staggeredDist, 0),
                dashedUntilAngle: -1,
                swallowed: false,
                lastR: staggeredDist,
                lastDr: 0,
                precessionTotal: 0
            });
        }

        this.star = {
            x: 0,
            y: 0,
            mass: config.starMass
        };
    }

    update() {
        const steps = Math.max(1, Math.floor(config.simSpeed * 15));
        const dt = (config.dt * config.simSpeed) / steps;

        for (let s = 0; s < steps; s++) {
            // Physics for each planet
            this.planets.forEach(p => {
                if (p.swallowed) return;

                const dx = this.star.x - p.x;
                const dy = this.star.y - p.y;
                const r2Actual = dx * dx + dy * dy;
                const rActual = Math.sqrt(r2Actual);

                if (rActual < 8) {
                    p.vx *= 0.8;
                    p.vy *= 0.8;
                    if (rActual < 3) p.swallowed = true;
                    return;
                }

                const rSafe = Math.max(rActual, 10);
                const r2Safe = rSafe * rSafe;

                let F = (config.G * this.star.mass) / r2Safe;
                if (this.isEinstein) {
                    const alpha = Math.min(config.relativityMultiplier * 2.5, 3500);
                    F += F * (alpha / r2Safe);
                }

                const angle = Math.atan2(dy, dx);
                const ax = Math.cos(angle) * F;
                const ay = Math.sin(angle) * F;

                p.vx += ax * dt;
                p.vy += ay * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // Orbit counters
                const currentAngle = Math.atan2(p.y, p.x);
                let diff = currentAngle - p.lastAngle;
                if (diff > Math.PI) diff -= 2 * Math.PI;
                if (diff < -Math.PI) diff += 2 * Math.PI;
                p.totalAngle += diff;
                p.lastAngle = currentAngle;

                // Inner logic for precession (Einstein side only)
                if (this.isEinstein) {
                    const dr = rActual - p.lastR;
                    if (p.lastDr < 0 && dr > 0) {
                        const periAngle = (currentAngle * 180 / Math.PI + 360) % 360;
                        if (p.lastPeriAngle !== undefined) {
                            let shift = periAngle - p.lastPeriAngle;
                            if (shift < -180) shift += 360;
                            if (shift > 180) shift -= 360;
                            p.precessionTotal += Math.abs(shift);
                        }
                        p.lastPeriAngle = periAngle;
                    }
                    p.lastDr = dr;
                    p.lastR = rActual;
                }
            });

            // Collision Detection (Ghosting + Dashed indicator)
            for (let i = 0; i < this.planets.length; i++) {
                for (let j = i + 1; j < this.planets.length; j++) {
                    const p1 = this.planets[i];
                    const p2 = this.planets[j];
                    if (p1.swallowed || p2.swallowed) continue;

                    const dxCol = p1.x - p2.x;
                    const dyCol = p1.y - p2.y;
                    const distCol = Math.sqrt(dxCol * dxCol + dyCol * dyCol);

                    if (distCol < 10) {
                        p1.dashedUntilAngle = p1.totalAngle + Math.PI * 2;
                        p2.dashedUntilAngle = p2.totalAngle + Math.PI * 2;
                    }
                }
            }

            // N-Body Physics: Mutual attraction
            for (let i = 0; i < this.planets.length; i++) {
                for (let j = i + 1; j < this.planets.length; j++) {
                    const p1 = this.planets[i];
                    const p2 = this.planets[j];
                    if (p1.swallowed || p2.swallowed) continue;

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const r2 = dx * dx + dy * dy;
                    if (r2 < 25) continue;

                    const strength = (config.G * 0.5) / r2;
                    const r = Math.sqrt(r2);
                    const ax = (dx / r) * strength;
                    const ay = (dy / r) * strength;

                    p1.vx += ax * dt;
                    p1.vy += ay * dt;
                    p2.vx -= ax * dt;
                    p2.vy -= ay * dt;
                }
            }
        }

        // Add to trails - Moved OUTSIDE the sub-step loop for long-term history
        this.planets.forEach(p => {
            if (p.swallowed) return;
            const isDashed = p.totalAngle < p.dashedUntilAngle;
            p.trail.push({ x: p.x, y: p.y, dashed: isDashed });
            if (p.trail.length > config.trailLength) p.trail.shift();
        });
    }

    draw(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;

        // Space-Time Grid (Einstein only)
        if (this.isEinstein) {
            this.drawGrid(ctx, width, height);
        }

        // Draw Star
        ctx.save();
        ctx.translate(centerX, centerY);
        const starPoint = this.isEinstein ? this.getWarpedPoint(0, 0) : { x: 0, y: 0 };
        const starGradient = ctx.createRadialGradient(starPoint.x, starPoint.y, 0, starPoint.x, starPoint.y, 25);
        starGradient.addColorStop(0, '#fff');
        starGradient.addColorStop(0.3, '#f9ca24');
        starGradient.addColorStop(1, 'rgba(249, 202, 36, 0)');
        ctx.fillStyle = starGradient;
        ctx.beginPath();
        ctx.arc(starPoint.x, starPoint.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw each planet and its trail
        this.planets.forEach(p => {
            if (p.swallowed) return;

            // Trail
            if (p.trail.length > 2) {
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';

                // Batch trail segments by color/dashed-state
                let currentDashed = p.trail[0].dashed;
                let lastPathColor = '';
                ctx.beginPath();
                if (currentDashed) ctx.setLineDash([5, 5]);
                else ctx.setLineDash([]);

                // Optimized skip for mobile/low-end, but keep resolution for desktop
                const skip = p.trail.length > 5000 ? 2 : 1;

                for (let i = 0; i < p.trail.length; i += skip) {
                    const pt = p.trail[i];
                    const warped = this.isEinstein ? this.getWarpedPoint(pt.x, pt.y) : pt;

                    // Improved Fading: Non-linear fade with a higher floor for visibility
                    // maxAlpha 120 (approx 47%) when preview is active, 200 (78%) otherwise
                    const maxAlpha = config.pathPreview ? 110 : 200;
                    const minAlpha = 30; // Never invisible

                    // Batch alpha updates every 20 steps to save on stroke() calls
                    const alphaStep = 20;
                    const iBatched = Math.floor(i / alphaStep) * alphaStep;
                    const t = iBatched / p.trail.length;

                    // Square root fade stays visible longer
                    const alphaValue = minAlpha + Math.floor(Math.pow(t, 0.4) * (maxAlpha - minAlpha));
                    const alpha = alphaValue.toString(16).padStart(2, '0');
                    const colorWithAlpha = p.color + alpha;

                    if (i === 0) {
                        ctx.moveTo(warped.x, warped.y);
                        lastPathColor = colorWithAlpha;
                        ctx.strokeStyle = colorWithAlpha;
                    } else if (pt.dashed !== currentDashed || colorWithAlpha !== lastPathColor) {
                        ctx.lineTo(warped.x, warped.y);
                        ctx.stroke();
                        ctx.beginPath();
                        currentDashed = pt.dashed;
                        lastPathColor = colorWithAlpha;
                        ctx.strokeStyle = colorWithAlpha;
                        if (currentDashed) ctx.setLineDash([5, 5]);
                        else ctx.setLineDash([]);
                        ctx.moveTo(warped.x, warped.y);
                    } else {
                        ctx.lineTo(warped.x, warped.y);
                    }
                }
                ctx.stroke();
                ctx.restore();
            }

            // Path Preview (Future Trajectory)
            if (config.pathPreview) {
                this.drawFuturePath(ctx, p, centerX, centerY);
            }

            // Planet Body
            ctx.save();
            ctx.translate(centerX, centerY);
            const planetPoint = this.isEinstein ? this.getWarpedPoint(p.x, p.y) : p;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(planetPoint.x, planetPoint.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Stats
        this.updateStats();
    }

    updateStats() {
        const activePlanets = this.planets.filter(p => !p.swallowed);
        if (activePlanets.length === 0) return;

        const p = activePlanets[0];
        const simYears = Math.abs(p.totalAngle / (2 * Math.PI)).toFixed(1);

        // Calibrate World Year (Time-based linear reference)
        // 1 Year = ~163 time units at default Newton settings
        const worldYears = (config.worldTime / 163.1).toFixed(1);
        const precession = this.isEinstein ? p.precessionTotal.toFixed(1) + '°' : '---';
        const t = translations[currentLang].stats;

        if (this.isEinstein) {
            statE.innerHTML = `${t.world}: ${worldYears} | ${t.einstein}: ${simYears} | ${t.precession}: ${precession}`;
        } else {
            statN.innerHTML = `${t.world}: ${worldYears} | ${t.newton}: ${simYears}`;
        }
    }

    drawFuturePath(ctx, p, centerX, centerY) {
        // Run a fast extrapolation for ~2-3 full laps to show precession clearly
        let tempP = { x: p.x, y: p.y, vx: p.vx, vy: p.vy };
        const lapSteps = 800; // Much higher resolution for a longer path
        const lapDt = 0.8; // Smaller steps for better accuracy and smoothness

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = p.color + 'cc';
        ctx.setLineDash([]);

        const startWarped = this.isEinstein ? this.getWarpedPoint(tempP.x, tempP.y) : tempP;
        ctx.moveTo(startWarped.x, startWarped.y);

        for (let i = 0; i < lapSteps; i++) {
            const dx = this.star.x - tempP.x;
            const dy = this.star.y - tempP.y;
            const r2 = dx * dx + dy * dy;
            const r = Math.sqrt(r2);

            if (r < 6) break; // Only break if very close to the star

            const rSafe = Math.max(r, 6);
            let F = (config.G * this.star.mass) / (rSafe * rSafe);
            if (this.isEinstein) {
                const alpha = Math.min(config.relativityMultiplier * 2.5, 3500);
                F += F * (alpha / (rSafe * rSafe));
            }

            const angle = Math.atan2(dy, dx);
            tempP.vx += Math.cos(angle) * F * lapDt;
            tempP.vy += Math.sin(angle) * F * lapDt;
            tempP.x += tempP.vx * lapDt;
            tempP.y += tempP.vy * lapDt;

            const warped = this.isEinstein ? this.getWarpedPoint(tempP.x, tempP.y) : tempP;
            ctx.lineTo(warped.x, warped.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    drawGrid(ctx, width, height) {
        const cx = width / 2;
        const cy = height / 2;
        const step = 40;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.lineWidth = 1;

        // Grid lines with dynamic coloring - Optimized batching
        const drawGridLine = (isVertical, start, end, crossStart, crossEnd) => {
            const pathRes = 12; // High resolution for better depth around sun
            for (let cross = crossStart; cross <= crossEnd; cross += step) {
                let lastColor = '';
                ctx.beginPath();
                for (let main = start; main <= end; main += pathRes) {
                    const x = isVertical ? cross : main;
                    const y = isVertical ? main : cross;
                    const warped = this.getWarpedPoint(x, y);

                    const dx = warped.x - x;
                    const dy = warped.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    let r = 255, g = 255, b = 255, a = 0.1;
                    if (dist > 5) {
                        const t = Math.min(dist / 140, 1);
                        r = Math.floor(255 * (1 - t) + 140 * t);
                        g = Math.floor(255 * (1 - t));
                        b = 255;
                        a = 0.1 + (0.4 * t);
                    }
                    const color = `rgba(${r}, ${g}, ${b}, ${a})`;

                    if (main === start) {
                        ctx.moveTo(warped.x, warped.y);
                        ctx.strokeStyle = color;
                        lastColor = color;
                    } else if (color !== lastColor) {
                        ctx.lineTo(warped.x, warped.y);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.moveTo(warped.x, warped.y);
                        lastColor = color;
                    } else {
                        ctx.lineTo(warped.x, warped.y);
                    }
                }
                ctx.stroke();
            }
        };

        drawGridLine(false, -cx, cx, -cy, cy); // Horizontal lines
        drawGridLine(true, -cy, cy, -cx, cx);  // Vertical lines

        ctx.restore();
    }

    getWarpedPoint(x, y) {
        let dispX = 0;
        let dispY = 0;

        // Displacement from Star
        const dxS = x - this.star.x;
        const dyS = y - this.star.y;
        const rS = Math.sqrt(dxS * dxS + dyS * dyS);

        if (rS > 2) {
            const starWarp = (config.starMass / 5000) * 800;
            const pullS = Math.min(starWarp / Math.max(rS, 15), rS * 0.7);
            dispX += (dxS / rS) * pullS;
            dispY += (dyS / rS) * pullS;
        }

        // Displacement from all active Planets
        this.planets.forEach(p => {
            if (p.swallowed) return;
            const dxP = x - p.x;
            const dyP = y - p.y;
            const rP = Math.sqrt(dxP * dxP + dyP * dyP);

            if (rP > 2) {
                const planetWarp = 120;
                const pullP = Math.min(planetWarp / Math.max(rP, 10), rP * 0.8);
                dispX += (dxP / rP) * pullP;
                dispY += (dyP / rP) * pullP;
            }
        });

        return {
            x: x - dispX,
            y: y - dispY
        };
    }
}

let simNewton = new Simulation(false);
let simEinstein = new Simulation(true);

function resizeCanvas() {
    const parentN = canvasN.parentElement;
    const parentE = canvasE.parentElement;

    canvasN.width = parentN.clientWidth;
    canvasN.height = parentN.clientHeight;

    canvasE.width = parentE.clientWidth;
    canvasE.height = parentE.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function loop() {
    simNewton.star.mass = config.starMass;
    simEinstein.star.mass = config.starMass;

    // Increment world time linearly
    config.worldTime += config.dt * config.simSpeed;

    simNewton.update();
    simEinstein.update();

    simNewton.draw(ctxN, canvasN.width, canvasN.height);
    simEinstein.draw(ctxE, canvasE.width, canvasE.height);

    requestAnimationFrame(loop);
}

// Input Listeners
elStarMass.addEventListener('input', (e) => {
    config.starMass = parseFloat(e.target.value);
    valStarMass.innerText = config.starMass;
});

elPlanetV.addEventListener('input', (e) => {
    valPlanetV.innerText = parseFloat(e.target.value).toFixed(1);
    config.planetInitialV = parseFloat(e.target.value);
});

elRelativityMult.addEventListener('input', (e) => {
    config.relativityMultiplier = parseFloat(e.target.value);
    valRelativityMult.innerText = config.relativityMultiplier;
});

function setupEditableValue(displayId, sliderId, isFloat = false) {
    const display = document.getElementById(displayId);
    const slider = document.getElementById(sliderId);

    display.addEventListener('blur', () => {
        let val = parseFloat(display.innerText.replace('x', ''));
        if (isNaN(val)) val = parseFloat(slider.value);

        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);

        // Constrain
        if (val < min) val = min;
        if (val > max) val = max;

        slider.value = val;
        // Trigger the input event to update state and UI
        slider.dispatchEvent(new Event('input'));

        // Final UI cleanup
        if (displayId === 'sim-speed-val') {
            display.innerText = val.toFixed(1) + 'x';
        } else {
            display.innerText = isFloat ? val.toFixed(1) : Math.round(val);
        }
    });

    display.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            display.blur();
        }
    });
}

setupEditableValue('star-mass-val', 'star-mass');
setupEditableValue('planet-v-val', 'planet-v', true);
setupEditableValue('relativity-mult-val', 'relativity-mult');
setupEditableValue('sim-speed-val', 'sim-speed', true);
setupEditableValue('planet-dist-val', 'planet-dist');
setupEditableValue('planet-count-val', 'planet-count');

// Advanced Settings Toggle
const advancedToggle = document.getElementById('advanced-toggle');
const advancedSection = document.getElementById('advanced-section');

advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedSection.classList.toggle('visible');
    const arrow = advancedToggle.querySelector('span');
    arrow.innerText = advancedToggle.classList.contains('active') ? '▲' : '▼';
});

elPlanetCount.addEventListener('input', (e) => {
    config.planetCount = parseInt(e.target.value);
    valPlanetCount.innerText = config.planetCount;
    simNewton.reset();
    simEinstein.reset();
});

elPlanetDist.addEventListener('input', (e) => {
    config.planetDistance = parseFloat(e.target.value);
    valPlanetDist.innerText = config.planetDistance;
    simNewton.reset();
    simEinstein.reset();
});

elSimSpeed.addEventListener('input', (e) => {
    config.simSpeed = parseFloat(e.target.value);
    valSimSpeed.innerText = config.simSpeed.toFixed(1) + 'x';

    // Warning logic
    const warning = document.getElementById('speed-warning');
    if (config.simSpeed > 10) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
});

elPathPreview.addEventListener('change', (e) => {
    config.pathPreview = e.target.checked;
});

function setPreset(starMass, planetV, relativity, speed, planetDist = 150) {
    elStarMass.value = starMass;
    elPlanetV.value = planetV;
    elRelativityMult.value = relativity;
    elSimSpeed.value = speed;
    elPlanetDist.value = planetDist;

    elStarMass.dispatchEvent(new Event('input'));
    elPlanetV.dispatchEvent(new Event('input'));
    elRelativityMult.dispatchEvent(new Event('input'));
    elSimSpeed.dispatchEvent(new Event('input'));
    elPlanetDist.dispatchEvent(new Event('input'));

    config.planetInitialV = planetV;
    config.planetDistance = planetDist;
    simNewton.reset();
    simEinstein.reset();
}

document.getElementById('btn-realistic').addEventListener('click', () => {
    setPreset(5000, 4.4, 1, 3.0);
});

document.getElementById('btn-ideal').addEventListener('click', () => {
    setPreset(5000, 4.8, 200, 6.0);
});

document.getElementById('btn-reset').addEventListener('click', () => {
    config.planetInitialV = parseFloat(elPlanetV.value);
    simNewton.reset();
    simEinstein.reset();
});

document.getElementById('btn-clear-trails').addEventListener('click', () => {
    simNewton.planets.forEach(p => p.trail = []);
    simEinstein.planets.forEach(p => p.trail = []);
    // Note: Do not reset angles or orbits here, only clear visual trail.
});

// Start loop
requestAnimationFrame(loop);
