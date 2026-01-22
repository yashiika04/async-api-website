import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

/**
 * @description Custom hook to observe headings and set the current active heading
 * @example const { currActive } = useHeadingsObserver();
 * @returns {object} currActive - current active heading
 */
export function useHeadingsObserver() {
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);
  const headingsRef = useRef<NodeListOf<HTMLElement> | []>([]);
  const [currActive, setCurrActive] = useState<string | null>(null);
  const visibleHeadingsRef = useRef<Set<string>>(new Set());
  const currActiveRef = useRef<string | null>(null);

  useEffect(() => {
    const updateActiveHeading = () => {
      // Find the heading closest to the sticky header position (120px from top)
      // This ensures stable highlighting as you scroll through sections
      const STICKY_OFFSET = 120;
      let closestId: string | null = null;
      let closestDistance = Infinity;

      visibleHeadingsRef.current.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - STICKY_OFFSET);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestId = id;
          }
        }
      });

      if (closestId && closestId !== currActiveRef.current) {
        currActiveRef.current = closestId;
        setCurrActive(closestId);
      }
    };

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const id = entry.target.id;

        if (entry.isIntersecting) {
          visibleHeadingsRef.current.add(id);
        } else {
          visibleHeadingsRef.current.delete(id);
        }
      });

      updateActiveHeading();
    };

    // Disconnect previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    // Reset state and visible headings when route changes
    setCurrActive(null);
    currActiveRef.current = null;
    visibleHeadingsRef.current.clear();

    // The heading in from top 20% of the viewport to top 30% of the viewport will be considered as active
    observer.current = new IntersectionObserver(callback, {
      rootMargin: '-20% 0px -70% 0px'
    });

    headingsRef.current = document.querySelectorAll('h2, h3');
    headingsRef.current.forEach((heading) => {
      observer.current?.observe(heading);
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [router.pathname]);

  return { currActive };
}
