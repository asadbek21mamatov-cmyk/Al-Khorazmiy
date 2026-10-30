/**
 * Al-Khorazmiy International School
 * Main Client Scripts: UI, i18n switcher, Theme, Sliders, Lightbox & Form
 */

/* ==========================================================
       1. CINEMATIC ENTRANCE VIDEO INTRO (ZERO-FREEZE)
       ========================================================== */
    (function initNetflixIntro() {
        const introOverlay = document.getElementById('netflixIntro');
        const introVideo = document.getElementById('introVideo');
        const soundBtn = document.getElementById('introSoundBtn');
        const skipBtn = document.getElementById('introSkipBtn');
        if (!introOverlay) return;

        let introClosed = false;

        function closeNetflixIntro() {
            if (introClosed) return;
            introClosed = true;
            clearTimeout(safetyTimer);
            introOverlay.classList.add('hide');
            document.body.classList.remove('intro-playing');

            setTimeout(() => {
                if (introVideo && !introVideo.paused) {
                    try { introVideo.pause(); } catch (_) {}
                }
                introOverlay.style.display = 'none';
            }, 520);
        }

        document.body.classList.add('intro-playing');

        // Unconditional guaranteed exit (5.03s video + buffer = 5.6s max) — NEVER freezes!
        const safetyTimer = setTimeout(closeNetflixIntro, 5600);

        function updateSoundIcon() {
            if (!soundBtn || !introVideo) return;
            const icon = soundBtn.querySelector('i');
            if (!icon) return;
            if (introVideo.muted) {
                icon.className = 'fas fa-volume-mute';
                soundBtn.setAttribute('aria-label', 'Ovozni yoqish');
                soundBtn.setAttribute('title', 'Ovozni yoqish');
            } else {
                icon.className = 'fas fa-volume-up';
                soundBtn.setAttribute('aria-label', "Ovozni o'chirish");
                soundBtn.setAttribute('title', "Ovozni o'chirish");
            }
        }

        if (soundBtn && introVideo) {
            soundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                introVideo.muted = !introVideo.muted;
                if (!introVideo.muted) {
                    introVideo.volume = 1.0;
                    introVideo.play().catch(() => {});
                }
                updateSoundIcon();
            });
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeNetflixIntro();
            });
        }

        introOverlay.addEventListener('click', () => {
            closeNetflixIntro();
        });

        if (introVideo) {
            introVideo.addEventListener('timeupdate', () => {
                if (introVideo.currentTime >= 3.85) {
                    introOverlay.classList.add('flash-white');
                }
                // Dissolve smoothly during the bright white ending transition
                if (introVideo.currentTime >= 4.35) {
                    closeNetflixIntro();
                }
            });

            introVideo.addEventListener('ended', closeNetflixIntro);
            introVideo.addEventListener('error', closeNetflixIntro);

            introVideo.muted = true;
            const playPromise = introVideo.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    updateSoundIcon();
                }).catch(() => {
                    closeNetflixIntro();
                });
            }
        } else {
            closeNetflixIntro();
        }
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
        if (typeof window.refreshAwardTabCounts === 'function') {
            window.refreshAwardTabCounts();
        }
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
                    item.classList.remove('is-playing');
                    video.removeAttribute('controls');
                }
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

                const SUPABASE_EDGE_APPLY = 'https://lzthytpezdadtobbampc.supabase.co/functions/v1/submit-application';
                const SUPABASE_PUB_KEY = 'sb_publishable_3Tgx9iGhPKp0U2ivkBDiyA_QOKqe8cp';
                const payloadObj = {
                    parent: parent,
                    child: child,
                    phone: phone,
                    grade: grade,
                    time: timeStr
                };

                let submittedOk = false;
                try {
                    const cloudResp = await fetch(SUPABASE_EDGE_APPLY, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_PUB_KEY
                        },
                        body: JSON.stringify(payloadObj)
                    });
                    if (cloudResp.ok) {
                        const resData = await cloudResp.json();
                        submittedOk = Boolean(resData && resData.ok);
                        if (resData && resData.botDeepLink) {
                            const modalBotLink = document.getElementById('modalBotLink');
                            if (modalBotLink) modalBotLink.href = resData.botDeepLink;
                        }
                    }
                } catch (cloudErr) {
                    console.warn('Cloud submit-application xatosi, lokal server sinab ko\'rilmoqda:', cloudErr);
                }

                // Fallback to local bot.py /api/apply only if cloud endpoint was unreachable
                if (!submittedOk) {
                    const isLocalFile = window.location.protocol === 'file:';
                    const localApiUrl = isLocalFile || window.location.port !== '5000'
                        ? 'http://localhost:5000/api/apply'
                        : '/api/apply';
                    try {
                        const response = await fetch(localApiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payloadObj)
                        });
                        if (response.ok) {
                            const resData = await response.json();
                            if (resData.botDeepLink) {
                                const modalBotLink = document.getElementById('modalBotLink');
                                if (modalBotLink) modalBotLink.href = resData.botDeepLink;
                            }
                        }
                    } catch (fetchErr) {
                        console.warn('Lokal serverga ulanishda ogohlantirish:', fetchErr);
                    }
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
    const facSlider = initSlider('facTrack', 'facPrevBtn', 'facNextBtn', null, 2800);

    // Subject Filter Tabs for Awards (Delegated so dynamic tabs work seamlessly)
    const awardsFilterTabsEl = document.getElementById('awardsFilterTabs');
    if (awardsFilterTabsEl) {
        awardsFilterTabsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.award-tab-btn');
            if (!btn) return;
            awardsFilterTabsEl.querySelectorAll('.award-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter') || 'all';
            if (awardsSlider) {
                awardsSlider.filterBy(filter);
                awardsSlider.resetAuto();
            }
        });
    }

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


    /* ==========================================================
       10. SUPABASE CLOUD DYNAMIC CMS LOADER
       Loads live Certificates, Campus Gallery & School News
       using publishable key only (RLS-protected, non-blocking)
       ========================================================== */
    (function initSupabaseCMS() {
        const SB_URL = 'https://lzthytpezdadtobbampc.supabase.co';
        const SB_PUB_KEY = 'sb_publishable_3Tgx9iGhPKp0U2ivkBDiyA_QOKqe8cp';

        function escapeAttr(val) {
            return escapeHtml(val).replace(/"/g, '&quot;');
        }

        function formatUzDate(isoDate) {
            if (!isoDate) return '';
            const parts = String(isoDate).slice(0, 10).split('-');
            if (parts.length === 3) {
                return `${parts[2]}.${parts[1]}.${parts[0]}`;
            }
            return escapeHtml(isoDate);
        }

        function catIcon(cat) {
            if (cat === 'math') return 'fas fa-calculator';
            if (cat === 'tarix') return 'fas fa-landmark';
            if (cat === 'english') return 'fas fa-language';
            return 'fas fa-award';
        }

        window.refreshAwardTabCounts = function refreshAwardTabCounts() {
            const track = document.getElementById('awardsTrack');
            const tabsWrap = document.getElementById('awardsFilterTabs');
            if (!track || !tabsWrap) return;

            const originals = Array.from(track.querySelectorAll('.slide-card:not([data-cloned])'));
            const counts = { all: originals.length, math: 0, tarix: 0, english: 0, other: 0 };
            originals.forEach(c => {
                const cat = c.getAttribute('data-cat') || 'other';
                if (counts[cat] !== undefined) counts[cat]++;
                else counts.other++;
            });

            const lang = localStorage.getItem('al_lang') || 'uz';
            const labelsByLang = {
                uz: { all: 'Barchasi', math: 'Matematika', tarix: 'Tarix', english: 'Ingliz tili CEFR', other: 'Boshqa' },
                ru: { all: 'Все', math: 'Математика', tarix: 'История', english: 'Английский CEFR', other: 'Другое' },
                en: { all: 'All', math: 'Mathematics', tarix: 'History', english: 'English CEFR', other: 'Other' }
            };
            const lbl = labelsByLang[lang] || labelsByLang.uz;

            ['all', 'math', 'tarix', 'english'].forEach(key => {
                const btn = tabsWrap.querySelector(`.award-tab-btn[data-filter="${key}"] span`);
                if (btn) btn.textContent = `${lbl[key]} (${counts[key]})`;
            });

            let otherBtn = tabsWrap.querySelector('.award-tab-btn[data-filter="other"]');
            if (counts.other > 0) {
                if (!otherBtn) {
                    otherBtn = document.createElement('button');
                    otherBtn.className = 'award-tab-btn';
                    otherBtn.setAttribute('data-filter', 'other');
                    otherBtn.innerHTML = `<i class="fas fa-award"></i> <span>${lbl.other} (${counts.other})</span>`;
                    tabsWrap.appendChild(otherBtn);
                } else {
                    const sp = otherBtn.querySelector('span');
                    if (sp) sp.textContent = `${lbl.other} (${counts.other})`;
                }
            } else if (otherBtn) {
                otherBtn.remove();
            }
        };

        async function sbFetch(tablePath) {
            const resp = await fetch(`${SB_URL}/rest/v1/${tablePath}`, {
                headers: { 'apikey': SB_PUB_KEY }
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return resp.json();
        }

        async function loadDynamicContent() {
            const [certsRes, galRes, newsRes] = await Promise.allSettled([
                sbFetch('certificates?select=*&is_published=eq.true&order=sort_order.asc,id.desc'),
                sbFetch('gallery_items?select=*&is_published=eq.true&order=sort_order.asc,id.desc'),
                sbFetch('news_posts?select=*&is_published=eq.true&order=published_date.desc,id.desc')
            ]);

            // 1. Certificates (#awardsTrack)
            if (certsRes.status === 'fulfilled' && Array.isArray(certsRes.value) && certsRes.value.length > 0) {
                const awardsTrack = document.getElementById('awardsTrack');
                if (awardsTrack) {
                    awardsTrack.innerHTML = certsRes.value.map((row, idx) => {
                        const cat = escapeAttr(row.category || 'other');
                        const img = escapeAttr(row.image_url || '');
                        const title = escapeAttr(row.title || '');
                        const badge = escapeHtml(row.badge_text || '');
                        const icon = catIcon(row.category);
                        return `
                <div class="slide-card" data-cat="${cat}" data-index="${idx}" data-src="${img}" data-title="${title}">
                    <img src="${img}" alt="${title}" loading="lazy">
                    <div class="slide-card-overlay">
                        <span class="slide-badge"><i class="${icon}"></i> <span>${badge}</span></span>
                        <div class="slide-card-title">${escapeHtml(row.title || '')}</div>
                    </div>
                </div>`;
                    }).join('');

                    window.refreshAwardTabCounts();
                    const activeBtn = document.querySelector('#awardsFilterTabs .award-tab-btn.active');
                    const curFilter = activeBtn ? (activeBtn.getAttribute('data-filter') || 'all') : 'all';
                    if (awardsSlider) awardsSlider.filterBy(curFilter);
                }
            }

            // 2. Campus Gallery (#facTrack)
            if (galRes.status === 'fulfilled' && Array.isArray(galRes.value) && galRes.value.length > 0) {
                const facTrack = document.getElementById('facTrack');
                if (facTrack) {
                    facTrack.innerHTML = galRes.value.map((row, idx) => {
                        const img = escapeAttr(row.image_url || '');
                        const title = escapeAttr(row.title || '');
                        const badge = escapeHtml(row.badge_text || '');
                        const icon = escapeAttr(row.icon_class || 'fas fa-camera');
                        return `
                <div class="slide-card" data-index="${idx}" data-src="${img}" data-title="${title}">
                    <img src="${img}" alt="${title}" loading="lazy">
                    <div class="slide-card-overlay">
                        <span class="slide-badge"><i class="${icon}" aria-hidden="true"></i> <span>${badge}</span></span>
                        <div class="slide-card-title">${escapeHtml(row.title || '')}</div>
                    </div>
                </div>`;
                    }).join('');
                    if (facSlider) facSlider.filterBy('all');
                }
            }

            // 3. School News (#newsGrid)
            if (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value) && newsRes.value.length > 0) {
                const newsGrid = document.getElementById('newsGrid');
                if (newsGrid) {
                    const lang = localStorage.getItem('al_lang') || 'uz';
                    const dict = (typeof I18N !== 'undefined' && I18N[lang]) ? I18N[lang] : {};
                    const btnText = escapeHtml(dict.news_btn_apply || 'Batafsil / Ariza');
                    newsGrid.innerHTML = newsRes.value.map((post) => {
                        const img = escapeAttr(post.image_url || 'school_building.webp');
                        const cat = escapeHtml(post.category || 'Yangilik');
                        const title = escapeHtml(post.title || '');
                        const summary = escapeHtml(post.summary || '');
                        const dateStr = formatUzDate(post.published_date);
                        return `
            <article class="news-card">
                <div class="news-img">
                    <img src="${img}" alt="${escapeAttr(post.title || '')}" loading="lazy">
                    <span class="news-badge">${cat}</span>
                </div>
                <div class="news-body">
                    <div class="news-date"><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${dateStr}</div>
                    <h3 class="news-card-title">${title}</h3>
                    <p class="news-summary">${summary}</p>
                    <a href="#admission" class="news-footer-link"><span data-i18n="news_btn_apply">${btnText}</span> <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
                </div>
            </article>`;
                    }).join('');
                }
            }
        }

        // Load asynchronously after first paint so intro & LCP stay instantaneous
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadDynamicContent(), { timeout: 1200 });
        } else {
            setTimeout(loadDynamicContent, 150);
        }
    })();
