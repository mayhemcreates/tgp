import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import "./styles.scss";
import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import * as Plyr from "plyr";

// Extend Window interface to include tgp property
declare global {
  interface Window {
    tgp: {
      isBreakpointXl?: boolean;
      isBreakpointXxl?: boolean;
    };
  }
}

const isBreakpointXl = () => {
  return window.matchMedia("(min-width: 1200px)").matches;
};

const isBreakpointXxl = () => {
  return window.matchMedia("(min-width: 1920px)").matches;
};

window.tgp = window.tgp || {};
window.tgp.isBreakpointXl = isBreakpointXl();
window.tgp.isBreakpointXxl = isBreakpointXxl();

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

// IMPORTANT: Disable browser scroll restoration IMMEDIATELY
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Force scroll to top before anything else
window.scrollTo(0, 0);

let userHasScrolled = false;

// Detect when user actually scrolls
window.addEventListener(
  "scroll",
  () => {
    userHasScrolled = true;
  },
  { once: true },
);

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  initAnimations();
  initSwiper();
  initTextAnimation();
  initialiseVideo();
  initNav();
});

function initAnimations(): void {
  ScrollTrigger.batch(".js-batch", {
    batchMax: 1,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, stagger: 0.5, duration: 1, delay: 0.5 }),
  });

  gsap.from(".header", {
    duration: 1,
    y: 0,
    opacity: 0,
    ease: "power3.out",
  });

  const header = document.querySelector(".header") as HTMLElement;
  let width = window.tgp.isBreakpointXxl ? (window.innerWidth / 12) * 6 : window.innerWidth - 40;

  window.addEventListener("resize", () => {
    window.tgp.isBreakpointXxl = isBreakpointXxl();
    width = window.tgp.isBreakpointXxl ? (window.innerWidth / 12) * 6 : window.innerWidth - 40;
    if (window.scrollY < 200) {
      gsap.set(header, {
        maxWidth: width + "px",
      });
    }
  });

  if (header) {
    // Set initial state explicitly
    gsap.set(header, {
      maxWidth: width + "px",
      top: window.tgp.isBreakpointXl ? 20 : 10,
      borderRadius: 25,
    });

    let scrollTween: gsap.core.Tween | null = null;

    const images = document.querySelectorAll(".js-scale-image") as NodeListOf<HTMLElement>;
    images.forEach((image) => {
      gsap.fromTo(
        image,
        {
          scale: 1.15,
        },
        {
          scale: 1.0,
          ease: "none",
          scrollTrigger: {
            trigger: image,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      );
    });

    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "200px top",
      onUpdate: (self) => {
        const progress = self.progress;
        const direction = self.direction;

        // Kill any existing tween to avoid conflicts
        if (scrollTween) scrollTween.kill();

        // Different durations based on scroll direction
        const duration = direction === 1 ? 0.8 : 0.3;
        const hamburgerNav = document.querySelector(".js-hamburger-nav") as HTMLElement;
        scrollTween = gsap.to(header, {
          maxWidth: progress === 1 ? "100vw" : width + "px",
          top: progress === 1 ? 0 : 20,
          borderRadius: progress === 1 ? 0 : 25,
          duration: duration,
          ease: "power2.out",
        });

        if (hamburgerNav && !window.tgp.isBreakpointXl) {
          if (progress === 1) {
            hamburgerNav.classList.add("hamburger__nav--scrolled");
          } else {
            hamburgerNav.classList.remove("hamburger__nav--scrolled");
          }
        }
      },
    });
  }
}

const initTextAnimation = () => {
  const text = document.querySelectorAll(".js-split") as NodeListOf<HTMLElement>;
  text.forEach((el) => {
    const textContent = el.textContent || "";
    gsap.to(el, {
      duration: 4,
      scrambleText: {
        text: textContent,
        rightToLeft: false,
        chars: "lowercase",
      },
    });
  });
};

const initSwiper = () => {
  const el = document.querySelector(".js-news-swiper") as HTMLElement;
  const paginationEl = el.querySelector(".swiper-pagination") as HTMLElement;
  const nextButton = el.querySelector(".swiper-button-next") as HTMLElement;
  const prevButton = el.querySelector(".swiper-button-prev") as HTMLElement;

  const swiper = new Swiper(el, {
    modules: [Navigation, Pagination],
    slidesPerView: "auto",
    spaceBetween: 15,
    speed: 500,
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 30,
      },
      1200: {
        slidesPerView: 3,
        spaceBetween: 40,
        touchRatio: 0,
      },
      1440: {
        slidesPerView: 3,
        spaceBetween: 40,
        touchRatio: 0,
      },
    },
    pagination: {
      el: paginationEl,
    },
    navigation: {
      nextEl: nextButton,
      prevEl: prevButton,
    },
  });
};

const initialiseVideo = () => {
  const videoItems = document.querySelectorAll(".js-video") as NodeListOf<HTMLElement>;
  const activePlayers: Plyr[] = [];

  videoItems.forEach((video) => {
    // Initialize player immediately to start preloading
    const player = new Plyr.default(video, {
      controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "captions", "settings", "fullscreen"],
      settings: ["captions"],
      autoplay: false,
      muted: true,
    });
    const wrapper = player.elements.container as HTMLElement;

    gsap.set(wrapper, {
      scale: 0.5,
      opacity: 0,
    });
    activePlayers.push(player);

    // Set up scroll trigger to play when in view
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom-=100",
      once: true,
      onEnter: () => {
        activePlayers.forEach((p) => {
          if (p !== player && p.playing) {
            p.pause();
          }
        });

        // Play this video with animation
        player.play();
        gsap.to(wrapper, {
          scale: 1,
          opacity: 1,
          duration: 1.5,
          delay: 0.3,
          ease: "power2.out",
        });
      },
    });
  });
};

const initNav = () => {
  const navBtn = document.querySelector(".js-nav-btn") as HTMLElement;
  const hamburgerNav = document.querySelector(".js-hamburger-nav") as HTMLElement;
  const navToggle = document.querySelector(".js-nav-toggle") as HTMLElement;
  const subNav = document.querySelector(".js-subnav") as HTMLElement;
  const firstLine = document.querySelector(".js-first-line") as HTMLElement;

  // Set initial state for hamburger nav
  gsap.set(hamburgerNav, {
    height: 0,
    width: 0,
    autoAlpha: 0,
    overflow: "hidden",
  });

  navToggle.addEventListener("click", () => {
    subNav.classList.toggle("subnav--open");
    firstLine.classList.toggle("line__toggle--rotate");
  });

  navBtn.addEventListener("click", () => {
    const isOpen = hamburgerNav.classList.contains("hamburger__nav--open");

    if (!isOpen) {
      if (!window.tgp.isBreakpointXl) {
        document.body.style.height = "100vh";
        document.body.style.overflow = "hidden";
      }
      // Opening animation
      hamburgerNav.classList.add("hamburger__nav--open");
      navBtn.classList.add("nav__hamburger--open");

      gsap.set(hamburgerNav, { width: 400 }); // Set width immediately
      gsap.to(hamburgerNav, {
        height: window.tgp.isBreakpointXl ? "auto" : "calc(100vh + 20px)",
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.out",
      });
    } else {
      if (!window.tgp.isBreakpointXl) {
        document.body.style.height = "unset";
        document.body.style.overflow = "initial";
      }
      // Closing animation
      navBtn.classList.remove("nav__hamburger--open");

      gsap.to(hamburgerNav, {
        height: 0,
        duration: 0.4,
        ease: "power2.in",
      });
      gsap.to(hamburgerNav, {
        autoAlpha: 0,
        duration: 0.2,
        delay: 0.2,
        ease: "power2.in",
        onComplete: () => {
          hamburgerNav.classList.remove("hamburger__nav--open");
          gsap.set(hamburgerNav, { width: 0 });
        },
      });
    }
  });
};
