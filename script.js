/* ============================================
   ANTHONY CHEN — PERSONAL WEBSITE SCRIPTS
   Biology × Chemistry Theme
   Realistic Molecular Background
   ============================================ */

// ——————————————————————————————
// 1. REALISTIC MOLECULAR BACKGROUND
// ——————————————————————————————
(function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let molecules = [];
    let mouse = { x: null, y: null };

    // Standard styling for skeletal structures
    const BOND_COLOR = 'rgba(37, 99, 235, '; // Royal Blue base
    const HETERO_COLOR = 'rgba(16, 185, 129, '; // Emerald Green for text
    const CLEAR_BG = '#060a0c'; // Matches dark body background

    // Helper to rotate points locally
    function rotatePoint(x, y, angle, scale) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: (x * cos - y * sin) * scale,
            y: (x * sin + y * cos) * scale
        };
    }

    // Common skeletal molecules definitions
    // nodes: array of {x, y, label, align} 
    // edges: array of [node1_idx, node2_idx, isDouble]
    // rings: array of {cx, cy, r}
    const MOLECULE_DEFS = [
        {
            name: "Benzene",
            nodes: [
                {x: 0, y: -10}, {x: 8.66, y: -5}, {x: 8.66, y: 5},
                {x: 0, y: 10}, {x: -8.66, y: 5}, {x: -8.66, y: -5}
            ],
            edges: [
                [0,1, false], [1,2, false], [2,3, false], 
                [3,4, false], [4,5, false], [5,0, false]
            ],
            rings: [{cx: 0, cy: 0, r: 6}]
        },
        {
            name: "Phenol",
            nodes: [
                {x: 0, y: -10}, {x: 8.66, y: -5}, {x: 8.66, y: 5},
                {x: 0, y: 10}, {x: -8.66, y: 5}, {x: -8.66, y: -5},
                {x: 0, y: -20, label: 'OH', isNu: true}
            ],
            edges: [
                [0,1, false], [1,2, false], [2,3, false], 
                [3,4, false], [4,5, false], [5,0, false],
                [0,6, false]
            ],
            rings: [{cx: 0, cy: 0, r: 6}]
        },
        {
            name: "Acetone", // Electrophile at central carbon
            nodes: [
                {x: -8.66, y: 5}, {x: 0, y: 0, isE: true}, {x: 8.66, y: 5}, 
                {x: 0, y: -10, label: 'O'}
            ],
            edges: [
                [0,1, false], [1,2, false], [1,3, true]
            ]
        },
        {
            name: "Ethanol",
            nodes: [
                {x: -8.66, y: 5}, {x: 0, y: 0}, {x: 10, y: 0, label: 'OH', align: 'left', isNu: true}
            ],
            edges: [
                [0,1, false], [1,2, false]
            ]
        },
        {
            name: "Dopamine",
            nodes: [
                {x: 0, y: -10}, {x: 8.66, y: -5}, {x: 8.66, y: 5},
                {x: 0, y: 10}, {x: -8.66, y: 5}, {x: -8.66, y: -5},
                {x: -17.32, y: -10, label: 'HO', align: 'right', isNu: true}, {x: -17.32, y: 10, label: 'HO', align: 'right', isNu: true},
                {x: 17.32, y: -10}, {x: 25.98, y: -5, label: 'NH₂', align: 'left', isNu: true}
            ],
            edges: [
                [0,1, false], [1,2, false], [2,3, false], 
                [3,4, false], [4,5, false], [5,0, false],
                [5,6, false], [4,7, false],
                [1,8, false], [8,9, false]
            ],
            rings: [{cx: 0, cy: 0, r: 6}]
        },
        {
            name: "Acetic Acid",
            nodes: [
                {x: -8.66, y: 5}, {x: 0, y: 0, isE: true}, 
                {x: 0, y: -10, label: 'O'}, 
                {x: 10, y: 5, label: 'OH', align: 'left', isNu: true}
            ],
            edges: [
                [0,1, false], [1,2, true], [1,3, false]
            ]
        },
        {
            name: "Methylamine",
            nodes: [
                {x: -8.66, y: 5}, {x: 0, y: 0, label: 'NH₂', align: 'left', isNu: true}
            ],
            edges: [
                [0,1, false]
            ]
        },
        {
            name: "Ammonia",
            nodes: [
                {x: 0, y: 0, label: 'NH₃', isNu: true}
            ],
            edges: []
        },
        {
            name: "Acetaldehyde",
            nodes: [
                {x: -8.66, y: 5}, {x: 0, y: 0, isE: true}, 
                {x: 10, y: 0, label: 'O'}
            ],
            edges: [
                [0,1, false], [1,2, true]
            ]
        },
        {
            name: "Methanol",
            nodes: [
                {x: -5, y: 0}, {x: 6, y: 0, label: 'OH', align: 'left', isNu: true}
            ],
            edges: [
                [0,1, false]
            ]
        },
        {
            name: "Aniline",
            nodes: [
                {x: 0, y: -10}, {x: 8.66, y: -5}, {x: 8.66, y: 5},
                {x: 0, y: 10}, {x: -8.66, y: 5}, {x: -8.66, y: -5},
                {x: 0, y: -20, label: 'NH₂', isNu: true}
            ],
            edges: [
                [0,1, false], [1,2, false], [2,3, false], 
                [3,4, false], [4,5, false], [5,0, false],
                [0,6, false]
            ],
            rings: [{cx: 0, cy: 0, r: 6}]
        }
    ];

    let molIdCounter = 0;

    function createMoleculeData(def, cx, cy, scale, angle, mId) {
        const transformedNodes = def.nodes.map(n => {
            const pt = rotatePoint(n.x, n.y, angle, scale);
            return { 
                x: cx + pt.x, 
                y: cy + pt.y, 
                label: n.label || null, 
                align: n.align || 'center',
                isNu: n.isNu || false,
                isE: n.isE || false,
                molId: mId 
            };
        });
        const transformedRings = def.rings ? def.rings.map(r => {
            const pt = rotatePoint(r.cx, r.cy, angle, scale);
            return { x: cx + pt.x, y: cy + pt.y, radius: r.r };
        }) : null;
        return { nodes: transformedNodes, edges: def.edges, rings: transformedRings };
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createMolecules() {
        molecules = [];
        const count = Math.min(Math.floor((width * height) / 45000), 30);
        for (let i = 0; i < count; i++) {
            const def = MOLECULE_DEFS[Math.floor(Math.random() * MOLECULE_DEFS.length)];
            const cx = Math.random() * width;
            const cy = Math.random() * height;
            const scale = 1.0 + Math.random() * 1.5;
            const angle = Math.random() * Math.PI * 2;
            
            const id = molIdCounter++;
            const mol = createMoleculeData(def, cx, cy, scale, angle, id);

            molecules.push({
                id: id,
                def: def,
                data: mol,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                vr: (Math.random() - 0.5) * 0.002,
                cx, cy,
                scale,
                angle,
                alpha: 0.15 + Math.random() * 0.25
            });
        }
    }

    function drawMolecule(mol) {
        const { data, alpha } = mol;
        const { nodes, edges, rings } = data;

        ctx.strokeStyle = BOND_COLOR + alpha + ')';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw aromatic rings
        if (rings) {
            ctx.lineWidth = 1.6;
            for (const r of rings) {
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius * mol.scale, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Draw edges (bonds)
        for (const edge of edges) {
            const [i, j, isDouble] = edge;
            const n1 = nodes[i];
            const n2 = nodes[j];
            
            ctx.lineWidth = isDouble ? 2.5 : 1.5;

            if (isDouble) {
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = (-dy / len) * 2.5;
                const ny = (dx / len) * 2.5;

                ctx.beginPath();
                ctx.moveTo(n1.x + nx, n1.y + ny);
                ctx.lineTo(n2.x + nx, n2.y + ny);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(n1.x - nx, n1.y - ny);
                ctx.lineTo(n2.x - nx, n2.y - ny);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();
            }
        }

        // Draw heteroatom labels
        const fs = Math.max(10, 11 * mol.scale);
        ctx.font = `bold ${fs}px var(--font-sans, sans-serif)`;
        ctx.textBaseline = 'middle';
        
        for (const n of nodes) {
            if (n.label) {
                // Clear a tight circle exactly at the coordinate to snip the bond end perfectly
                ctx.fillStyle = CLEAR_BG;
                ctx.beginPath();
                ctx.arc(n.x, n.y, fs * 0.65, 0, Math.PI * 2);
                ctx.fill();

                // Draw exact text aligned logically to avoid H-overlap
                ctx.textAlign = n.align;
                ctx.fillStyle = HETERO_COLOR + (alpha * 1.5) + ')';
                
                // Small explicit text offset to visually snap O/N perfectly to the bare node point
                let offsetX = 0;
                if (n.align === 'left') offsetX = -fs * 0.15;
                else if (n.align === 'right') offsetX = fs * 0.15;
                
                ctx.fillText(n.label, n.x + offsetX, n.y);
            }
        }
    }

    function updateMolecules() {
        for (const mol of molecules) {
            mol.cx += mol.vx;
            mol.cy += mol.vy;
            mol.angle += mol.vr;

            // Mouse repulsion
            if (mouse.x !== null) {
                const dx = mol.cx - mouse.x;
                const dy = mol.cy - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150 * 0.3;
                    mol.vx += (dx / dist) * force;
                    mol.vy += (dy / dist) * force;
                }
            }

            // Damping
            mol.vx *= 0.995;
            mol.vy *= 0.995;

            // Wrap around edges
            if (mol.cx < -100) mol.cx = width + 100;
            if (mol.cx > width + 100) mol.cx = -100;
            if (mol.cy < -100) mol.cy = height + 100;
            if (mol.cy > height + 100) mol.cy = -100;

            // Update transformed data
            mol.data = createMoleculeData(mol.def, mol.cx, mol.cy, mol.scale, mol.angle, mol.id);
        }
    }

    function drawMechanisms() {
        const nuNodes = [];
        const eNodes = [];
        
        for (const mol of molecules) {
            for (const n of mol.data.nodes) {
                if (n.isNu) nuNodes.push(n);
                if (n.isE) eNodes.push(n);
            }
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (const nu of nuNodes) {
            for (const e of eNodes) {
                // Must be interacting between different molecules
                if (nu.molId === e.molId) continue;
                
                const dx = e.x - nu.x;
                const dy = e.y - nu.y;
                const distSq = dx*dx + dy*dy;
                
                if (distSq < 20000) { // proximity radius ~141px
                    const dist = Math.sqrt(distSq);
                    const alpha = (1 - dist / 141) * 0.85; // fade smoothly 
                    
                    ctx.beginPath();
                    ctx.moveTo(nu.x, nu.y);
                    
                    // Curve perpendicular to vector
                    const midX = (nu.x + e.x) / 2;
                    const midY = (nu.y + e.y) / 2;
                    const perpX = -dy * 0.35; 
                    const perpY = dx * 0.35;
                    
                    const cpX = midX + perpX;
                    const cpY = midY + perpY;
                    
                    ctx.quadraticCurveTo(cpX, cpY, e.x, e.y);
                    
                    // Draw dashed mechanism curly arrow
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = 1.4;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Arrowhead calculation
                    const angle = Math.atan2(e.y - cpY, e.x - cpX);
                    const headLen = 7;
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y);
                    ctx.lineTo(e.x - headLen * Math.cos(angle - Math.PI / 6), e.y - headLen * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(e.x - headLen * Math.cos(angle + Math.PI / 6), e.y - headLen * Math.sin(angle + Math.PI / 6));
                    ctx.closePath();
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fill();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        updateMolecules();
        drawMechanisms();
        for (const mol of molecules) drawMolecule(mol);
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => { resize(); createMolecules(); });
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });

    // "Synthesis" mode: hover on benzene logo to create more molecules
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo) {
        navLogo.addEventListener('mouseenter', () => {
            const count = 5;
            for (let i = 0; i < count; i++) {
                const def = MOLECULE_DEFS[Math.floor(Math.random() * MOLECULE_DEFS.length)];
                const cx = Math.random() * width;
                const cy = Math.random() * height;
                const scale = 1.0 + Math.random() * 1.5;
                const angle = Math.random() * Math.PI * 2;
                
                const id = molIdCounter++;
                const mol = createMoleculeData(def, cx, cy, scale, angle, id);

                molecules.push({
                    id: id,
                    def: def,
                    data: mol,
                    vx: (Math.random() - 0.5) * 0.4, // slightly faster
                    vy: (Math.random() - 0.5) * 0.4,
                    vr: (Math.random() - 0.5) * 0.005,
                    cx, cy,
                    scale,
                    angle,
                    alpha: 0.15 + Math.random() * 0.25
                });
            }
        });
    }

    resize();
    createMolecules();
    animate();
})();


// ——————————————————————————————
// 2. TYPING EFFECT — Biology & Chemistry focused
// ——————————————————————————————
(function initTyping() {
    const el = document.getElementById('typing-text');
    const phrases = [
        'Bioinformatics & Biochemistry @ UCSD',
        'Computational Chemistry Researcher',
        'Organic Chemistry Tutor',
        'From Bench to Bioinformatics',
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let delay = 100;

    function type() {
        const current = phrases[phraseIndex];
        if (isDeleting) {
            el.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            delay = 35;
        } else {
            el.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            delay = 70 + Math.random() * 40;
        }

        if (!isDeleting && charIndex === current.length) {
            delay = 2400;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            delay = 500;
        }

        setTimeout(type, delay);
    }

    setTimeout(type, 1000);
})();


// ——————————————————————————————
// 3. NAVBAR SCROLL
// ——————————————————————————————
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section, #hero');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);

        let current = '';
        sections.forEach((s) => {
            if (window.scrollY >= s.offsetTop - 200) current = s.id;
        });
        navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    });
})();


// ——————————————————————————————
// 4. MOBILE NAV
// ——————————————————————————————
(function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            links.classList.remove('open');
        });
    });
})();


// ——————————————————————————————
// 5. SCROLL REVEAL
// ——————————————————————————————
(function initScrollReveal() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    document.querySelectorAll('.section, .exp-card, .project-featured, .skill-category').forEach((el) => {
        observer.observe(el);
    });
})();


// ——————————————————————————————
// 6. SMOOTH SCROLL
// ——————————————————————————————
(function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.pageYOffset - 80,
                    behavior: 'smooth',
                });
            }
        });
    });
})();


// ——————————————————————————————
// 7. SKILL PILL HOVER — Bio & Chem colors
// ——————————————————————————————
(function initSkillPills() {
    const pills = document.querySelectorAll('.skill-pill');
    const colors = [
        { bg: 'rgba(37, 99, 235, 0.12)', border: '#2563eb', text: '#60a5fa' },
        { bg: 'rgba(96, 165, 250, 0.12)', border: '#60a5fa', text: '#93c5fd' },
        { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#34d399' },
        { bg: 'rgba(52, 211, 153, 0.12)', border: '#34d399', text: '#6ee7b7' },
    ];

    pills.forEach((pill) => {
        pill.addEventListener('mouseenter', () => {
            const c = colors[Math.floor(Math.random() * colors.length)];
            pill.style.background = c.bg;
            pill.style.borderColor = c.border;
            pill.style.color = c.text;
        });
        pill.addEventListener('mouseleave', () => {
            pill.style.background = '';
            pill.style.borderColor = '';
            pill.style.color = '';
        });
    });
})();
