import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const motion = {
  fast: 0.45,
  normal: 0.8,
  slow: 1.2,
  scrub: 0.85,
  easeStandard: "power3.inOut",
  easeEnter: "expo.out",
  easeExit: "power2.inOut"
} as const;

export { gsap, ScrollTrigger, motion };
