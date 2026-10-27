/**
 * Al-Khorazmiy International School
 * Main Client Scripts: UI, i18n switcher, Theme, Sliders, Lightbox & Form
 */

/* ==========================================================
       1. PRO HOLLYWOOD / NETFLIX 3D & LASER INTRO (4.4s < 5s)
       ========================================================== */
    (function initNetflixIntro() {
        const introOverlay = document.getElementById('netflixIntro');
        const canvas = document.getElementById('introParticleCanvas');
        if (!introOverlay) return;

        let introClosed = false;
        let animFrameId = null;

        // 60fps Cinema Bokeh & Spark Particle Engine
        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            let cw = (canvas.width = window.innerWidth);
            let ch = (canvas.height = window.innerHeight);

            const particles = Array.from({ length: 46 }, (_, i) => {
                const isGold = i % 3 === 0;
                return {
                    x: Math.random() * cw,
                    y: Math.random() * ch,
                    r: Math.random() * 2.2 + 0.6,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: -Math.random() * 0.7 - 0.15,
                    alpha: Math.random() * 0.65 + 0.15,
                    color: isGold ? '251, 191, 36' : '45, 212, 191'
                };
            });

            function renderParticles() {
                if (introClosed) return;
                ctx.clearRect(0, 0, cw, ch);
                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.y < -10) p.y = ch + 10;
                    if (p.x < -10) p.x = cw + 10;
                    if (p.x > cw + 10) p.x = -10;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `rgba(${p.color}, 0.8)`;
                    ctx.fill();
                }
                animFrameId = requestAnimationFrame(renderParticles);
            }
            renderParticles();
        }

        function closeNetflixIntro() {
            if (introClosed) return;
            introClosed = true;
            if (animFrameId) cancelAnimationFrame(animFrameId);
            introOverlay.classList.add('hide');
            document.body.classList.remove('intro-playing');

            setTimeout(() => {
                introOverlay.style.display = 'none';
            }, 820);
        }

        // Lock page scroll while intro is active
        document.body.classList.add('intro-playing');

        // Transition out at 3.65s -> finishes completely at ~4.45s (strictly <= 5s)
        setTimeout(closeNetflixIntro, 3650);

        // Allow clicking to close early if desired
        introOverlay.addEventListener('click', closeNetflixIntro);
    })();

/* ==========================================================
       2. TRANSLATION ENGINE - INSTANT & BULLETPROOF
       ========================================================== */
    function setLanguage(lang) {
        if (!I18N[lang]) lang = 'uz';
        localStorage.setItem('al_lang', lang);
        document.documentElement.lang = lang;
        
        const dict = I18N[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) {
                el.innerHTML = dict[key];
            }
        });
        
        // Update flags and active status
        const flagSvgs = { uz: 'flag_uz.svg', ru: 'flag_ru.svg', en: 'flag_gb.svg' };
        const labels = { uz: 'UZ', ru: 'RU', en: 'EN' };
        
        const langFlag = document.getElementById('langFlag');
        const langLabel = document.getElementById('langLabel');
        if (langFlag) {
            langFlag.src = flagSvgs[lang] || 'flag_uz.svg';
            langFlag.alt = labels[lang] || 'UZ';
        }
        if (langLabel) langLabel.textContent = labels[lang] || 'UZ';
        
        document.querySelectorAll('.lang-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-lang') === lang);
        });
    }

    // Initialize Lang
    const savedLang = localStorage.getItem('al_lang') || 'uz';
    setLanguage(savedLang);

    // Lang Dropdown Events
    const langWrap = document.getElementById('langWrap');
    const langBtn = document.getElementById('langToggleBtn');
    const langBox = document.getElementById('langBox');

    if (langBtn && langBox) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langBox.classList.toggle('show');
        });
        
        document.querySelectorAll('.lang-item').forEach(item => {
            item.addEventListener('click', () => {
                const lang = item.getAttribute('data-lang');
                setLanguage(lang);
                langBox.classList.remove('show');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!langWrap.contains(e.target)) {
                langBox.classList.remove('show');
            }
        });
    }

    /* ==========================================================
       3. 10/10 DARK & LIGHT THEME TOGGLE
       ========================================================== */
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const htmlEl = document.documentElement;

    function applyTheme(isDark) {
        if (isDark) {
            htmlEl.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
            localStorage.setItem('al_theme', 'dark');
        } else {
            htmlEl.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
            localStorage.setItem('al_theme', 'light');
        }
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('al_theme') || 'light';
    applyTheme(savedTheme === 'dark');

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isCurrentDark = htmlEl.getAttribute('data-theme') === 'dark';
            applyTheme(!isCurrentDark);
        });
    }

    /* ==========================================================
       4. REELS VIDEO AUTO-PAUSE & RESTART FROM 0s
       ========================================================== */
    const reelItems = document.querySelectorAll('.reel-item');
    
    // Intersection Observer to Pause when Scrolled Away
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                const item = entry.target;
                const video = item.querySelector('video');
                if (video && !video.paused) {
                    video.pause();
                }
                if (video) {
                    video.currentTime = 0.1; // Keep preview frame visible
                }
                item.classList.remove('is-playing');
                if (video) video.removeAttribute('controls');
            }
        });
    }, { threshold: 0.15 });

    reelItems.forEach(item => {
        const video = item.querySelector('video');
        if (!video) return;
        
        videoObserver.observe(item);

        item.addEventListener('click', (e) => {
            if (e.target === video && !video.paused) return;
            
            if (video.paused) {
                // Pause all other videos and reset to preview frame
                document.querySelectorAll('.reel-item video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                        v.currentTime = 0.1;
                        v.parentElement.classList.remove('is-playing');
                        v.removeAttribute('controls');
                    }
                });
                
                video.currentTime = 0; // Restart from 0s on each play
                video.play().then(() => {
                    item.classList.add('is-playing');
                    video.setAttribute('controls', 'controls');
                }).catch(() => {});
            } else {
                video.pause();
                video.currentTime = 0.1;
                item.classList.remove('is-playing');
                video.removeAttribute('controls');
            }
        });
        
        video.addEventListener('ended', () => {
            item.classList.remove('is-playing');
            video.removeAttribute('controls');
            video.currentTime = 0.1;
        });
    });

    /* ==========================================================
       5. MOBILE MENU & NAVIGATION
       ========================================================== */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    function closeMobile() {
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('open');
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            mobileOverlay.classList.add('open');
        });
    }
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobile);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);

    document.querySelectorAll('.mobile-nav-links a').forEach(a => {
        a.addEventListener('click', closeMobile);
    });

    // Active Nav Indicator on Scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links > li > a');
    
    window.addEventListener('scroll', () => {
        let cur = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 140) cur = s.id;
        });
        navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
        });
        
        const btt = document.getElementById('backToTop');
        if (btt) {
            btt.classList.toggle('visible', window.scrollY > 400);
        }
    }, { passive: true });

    const btt = document.getElementById('backToTop');
    if (btt) {
        btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* ==========================================================
       6. APPLICATION FORM & SECURE BACKEND INTEGRATION
       Applications are securely submitted via bot.py /api/apply
       No Telegram tokens or private credentials exposed to client!
       ========================================================== */
    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function capitalizeWords(str) {
        if (!str) return "";
        return str.replace(/(^|[\s\-'ʻ`’])([a-zа-яўқғҳ])/gi, (m, prefix, char) => prefix + char.toUpperCase());
    }

    function formatPhoneNumber(val) {
        let digits = val.replace(/\D/g, '');
        if (!digits.startsWith('998')) {
            digits = '998' + digits;
        }
        digits = digits.substring(0, 12);

        let res = '+998';
        if (digits.length > 3) res += ' ' + digits.substring(3, 5);
        if (digits.length > 5) res += ' ' + digits.substring(5, 8);
        if (digits.length > 8) res += ' ' + digits.substring(8, 10);
        if (digits.length > 10) res += ' ' + digits.substring(10, 12);
        return res;
    }

    const form = document.getElementById('admissionForm');
    const modal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const parentInput = document.getElementById('parentName');
    const childInput = document.getElementById('childName');
    const phoneInput = document.getElementById('phoneNumber');

    // Auto capitalize names on typing
    [parentInput, childInput].forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', () => {
            const start = inp.selectionStart;
            const end = inp.selectionEnd;
            const original = inp.value;
            const capitalized = capitalizeWords(original);
            if (original !== capitalized) {
                inp.value = capitalized;
                inp.setSelectionRange(start, end);
            }
        });
        inp.addEventListener('blur', () => {
            inp.value = capitalizeWords(inp.value.trim());
        });
    });

    // Auto format phone number with +998 prefix
    if (phoneInput) {
        if (!phoneInput.value || !phoneInput.value.startsWith('+998')) {
            phoneInput.value = '+998 ';
        }

        phoneInput.addEventListener('input', () => {
            phoneInput.value = formatPhoneNumber(phoneInput.value);
        });

        phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && phoneInput.selectionStart <= 5 && phoneInput.selectionEnd <= 5) {
                e.preventDefault();
            }
        });

        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value || !phoneInput.value.startsWith('+998')) {
                phoneInput.value = '+998 ';
            }
            setTimeout(() => {
                if (phoneInput.selectionStart < 5) {
                    phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
                }
            }, 0);
        });

        phoneInput.addEventListener('click', () => {
            if (phoneInput.selectionStart < 5) {
                phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
            }
        });
    }

    if (form) {
        form.addEventListener('reset', () => {
            setTimeout(() => {
                if (phoneInput) phoneInput.value = '+998 ';
            }, 0);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const parent = capitalizeWords(document.getElementById('parentName').value.trim());
            const child = capitalizeWords(document.getElementById('childName').value.trim());
            const phone = document.getElementById('phoneNumber').value.trim();
            const grade = document.getElementById('gradeLevel').value;

            const curLang = localStorage.getItem('al_lang') || 'uz';
            const dict = (typeof I18N !== 'undefined' && I18N[curLang]) ? I18N[curLang] : {};

            if (!parent || !child || !phone || !grade) {
                alert(dict.form_err_fill || "Iltimos, barcha majburiy maydonlarni to'ldiring!");
                return;
            }

            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 12) {
                alert(dict.form_err_phone || "Iltimos, telefon raqamingizni to'liq kiriting (masalan: +998 90 123 45 67)!");
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                const sendingText = dict.form_sending || 'Yuborilmoqda...';
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${sendingText}`;
            }

            try {
                const now = new Date();
                const timeStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                                ' ' + now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

                // Backend API endpoint (securely routed via bot.py server)
                const isLocalFile = window.location.protocol === 'file:';
                const apiUrl = isLocalFile || window.location.port !== '5000'
                    ? 'http://localhost:5000/api/apply'
                    : '/api/apply';

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            parent: parent,
                            child: child,
                            phone: phone,
                            grade: grade,
                            time: timeStr
                        })
                    });

                    if (response.ok) {
                        const resData = await response.json();
                        if (resData.botDeepLink) {
                            const modalBotLink = document.getElementById('modalBotLink');
                            if (modalBotLink) {
                                modalBotLink.href = resData.botDeepLink;
                            }
                        }
                    }
                } catch (fetchErr) {
                    console.warn("Backend serverga ulanishda ogohlantirish (bot.py ishga tushirilganligini tekshiring):", fetchErr);
                }

                modal.classList.add('show');
                form.reset();
                if (phoneInput) phoneInput.value = '+998 ';
            } catch (err) {
                console.error("Xatolik:", err);
                modal.classList.add('show');
                form.reset();
                if (phoneInput) phoneInput.value = '+998 ';
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    }

    /* ==========================================================
       7. INTERACTIVE SLIDESHOW & FULLSCREEN LIGHTBOX
       ========================================================== */
    function initSlider(trackId, prevBtnId, nextBtnId, dotsId, autoSlideTime = 2200) {
        const track = document.getElementById(trackId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const dotsContainer = dotsId ? document.getElementById(dotsId) : null;
        if (!track) return;

        let activeOriginals = [];
        let totalOriginals = 0;

        function buildTrackForFilter(filter = 'all') {
            // Remove existing clones
            track.querySelectorAll('.slide-card[data-cloned="true"]').forEach(el => el.remove());

            const allOriginals = Array.from(track.querySelectorAll('.slide-card:not([data-cloned])'));
            activeOriginals = [];

            allOriginals.forEach(c => {
                const cat = c.getAttribute('data-cat');
                const match = (filter === 'all' || !cat || cat === filter);
                c.style.display = match ? '' : 'none';
                if (match) activeOriginals.push(c);
            });

            totalOriginals = activeOriginals.length;
            if (totalOriginals === 0) return;

            activeOriginals.forEach((c, idx) => {
                c.setAttribute('data-index', idx);
                const clone = c.cloneNode(true);
                clone.setAttribute('data-cloned', 'true');
                clone.setAttribute('data-index', idx);
                track.appendChild(clone);
            });

            if (dotsContainer) {
                dotsContainer.innerHTML = '';
                activeOriginals.forEach((_, idx) => {
                    const dot = document.createElement('div');
                    dot.className = 'slider-dot' + (idx === 0 ? ' active' : '');
                    dot.addEventListener('click', () => {
                        const step = getCardStep();
                        track.scrollTo({ left: idx * step, behavior: 'smooth' });
                        resetAuto();
                    });
                    dotsContainer.appendChild(dot);
                });
            }

            track.style.scrollBehavior = 'auto';
            track.scrollLeft = 0;
            track.style.scrollBehavior = '';
            bindTrackLightbox(track);
        }

        function getCardStep() {
            const first = activeOriginals[0] || track.querySelector('.slide-card');
            if (!first) return 298;
            const style = window.getComputedStyle(track);
            const gap = parseFloat(style.gap) || 18;
            return first.offsetWidth + gap;
        }

        function getOriginalsWidth() {
            return getCardStep() * totalOriginals;
        }

        function updateDots() {
            if (!dotsContainer || totalOriginals === 0) return;
            const step = getCardStep();
            const currentIdx = Math.round(track.scrollLeft / step) % totalOriginals;
            dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
                d.classList.toggle('active', i === currentIdx);
            });
        }

        function handleScrollWrap() {
            if (totalOriginals === 0) return;
            const origWidth = getOriginalsWidth();
            if (origWidth > 0 && track.scrollLeft >= origWidth) {
                track.style.scrollBehavior = 'auto';
                track.scrollLeft -= origWidth;
                track.style.scrollBehavior = '';
            }
            updateDots();
        }

        track.addEventListener('scroll', handleScrollWrap, { passive: true });

        function slideNext() {
            if (totalOriginals === 0) return;
            const step = getCardStep();
            const origWidth = getOriginalsWidth();
            if (track.scrollLeft >= origWidth - 10) {
                track.style.scrollBehavior = 'auto';
                track.scrollLeft -= origWidth;
                track.style.scrollBehavior = '';
            }
            track.scrollBy({ left: step, behavior: 'smooth' });
        }

        function slidePrev() {
            if (totalOriginals === 0) return;
            const step = getCardStep();
            const origWidth = getOriginalsWidth();
            if (track.scrollLeft <= 10) {
                track.style.scrollBehavior = 'auto';
                track.scrollLeft += origWidth;
                track.style.scrollBehavior = '';
            }
            track.scrollBy({ left: -step, behavior: 'smooth' });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                slideNext();
                resetAuto();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                slidePrev();
                resetAuto();
            });
        }

        let timer = null;
        let isPaused = false;

        function startAuto() {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
                if (!isPaused) {
                    slideNext();
                }
            }, autoSlideTime);
        }

        function resetAuto() {
            startAuto();
        }

        track.addEventListener('mouseenter', () => { isPaused = true; });
        track.addEventListener('mouseleave', () => { isPaused = false; });
        track.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
        track.addEventListener('touchend', () => {
            setTimeout(() => { isPaused = false; }, 1500);
        }, { passive: true });

        buildTrackForFilter('all');
        startAuto();

        return { filterBy: buildTrackForFilter, resetAuto };
    }

    // Lightbox Modal Logic
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let allLightboxItems = [];
    let currentLightboxIdx = 0;

    function openLightbox(items, index) {
        allLightboxItems = items;
        currentLightboxIdx = index;
        updateLightboxContent();
        lightboxModal.classList.add('show');
    }

    function updateLightboxContent() {
        if (!allLightboxItems.length) return;
        const item = allLightboxItems[currentLightboxIdx];
        lightboxImg.src = item.src;
        lightboxCaption.innerHTML = item.title + ' <span style="opacity:0.6;font-size:13px;margin-left:8px;">(' + (currentLightboxIdx + 1) + ' / ' + allLightboxItems.length + ')</span>';
    }

    function bindTrackLightbox(track) {
        track.querySelectorAll('.slide-card').forEach((card) => {
            card.onclick = () => {
                const visibleOriginals = Array.from(track.querySelectorAll('.slide-card:not([data-cloned])')).filter(c => c.style.display !== 'none');
                const items = visibleOriginals.map(c => ({
                    src: c.getAttribute('data-src'),
                    title: (c.querySelector('.slide-card-title') && c.querySelector('.slide-card-title').textContent.trim()) || c.getAttribute('data-title')
                }));
                const index = parseInt(card.getAttribute('data-index') || 0);
                openLightbox(items, index);
            };
        });
    }

    const awardsSlider = initSlider('awardsTrack', 'awardsPrevBtn', 'awardsNextBtn', 'awardsDots', 2200);
    initSlider('facTrack', 'facPrevBtn', 'facNextBtn', null, 2800);

    // Subject Filter Tabs for Awards
    const filterTabs = document.querySelectorAll('#awardsFilterTabs .award-tab-btn');
    filterTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            filterTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter') || 'all';
            if (awardsSlider) {
                awardsSlider.filterBy(filter);
                awardsSlider.resetAuto();
            }
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => lightboxModal.classList.remove('show'));
    }
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) lightboxModal.classList.remove('show');
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLightboxIdx = (currentLightboxIdx + 1) % allLightboxItems.length;
            updateLightboxContent();
        });
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            currentLightboxIdx = (currentLightboxIdx - 1 + allLightboxItems.length) % allLightboxItems.length;
            updateLightboxContent();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightboxModal.classList.contains('show')) return;
        if (e.key === 'Escape') lightboxModal.classList.remove('show');
        if (e.key === 'ArrowRight') lightboxNext.click();
        if (e.key === 'ArrowLeft') lightboxPrev.click();
    });


    /* ==========================================================
       8. JAHON SCHOOL STYLE SCROLL OBSERVER (SMOOTH SIDE SLIDES)
       ========================================================== */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
    });

    document.querySelectorAll('.reveal-left, .reveal-right, .reveal-up, .reveal-zoom').forEach(el => {
        revealObserver.observe(el);
    });

    // Trigger hero animations on page load
    setTimeout(() => {
        document.querySelectorAll('#hero .reveal-left, #hero .reveal-right').forEach(el => {
            el.classList.add('revealed');
        });
    }, 150);


    /* ==========================================================
       9. FAQ ACCORDION INTERACTION (+ / - TOGGLE & KEYBOARD A11Y)
       ========================================================== */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        if (!header) return;

        const toggleFaq = () => {
            const isOpen = item.classList.contains('active');
            
            // Close other items
            faqItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('active');
                    const otherHeader = other.querySelector('.faq-header');
                    if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active', !isOpen);
            header.setAttribute('aria-expanded', String(!isOpen));
        };

        header.addEventListener('click', toggleFaq);
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFaq();
            }
        });
    });
